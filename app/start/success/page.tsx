import Link from "next/link";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isPlanId } from "@/lib/plan-config";
import { ArrowRight } from "lucide-react";
import crypto from "node:crypto";

function getPeriodEnd(sub: Stripe.Subscription | null): string | null {
  if (!sub) return null;
  const ts = sub.items?.data?.[0]?.current_period_end;
  return ts ? new Date(ts * 1000).toISOString() : null;
}

export const dynamic = "force-dynamic";

type SP = Promise<{ session_id?: string }>;

export default async function SuccessPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const sessionId = sp.session_id;

  if (!sessionId) {
    return <ErrorPage reason="Session Stripe manquante." />;
  }

  let session;
  try {
    session = await getStripe().checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "customer"],
    });
  } catch (e) {
    console.error("[success] retrieve session", e);
    return <ErrorPage reason="Session Stripe introuvable." />;
  }

  if (session.status !== "complete") {
    return <ErrorPage reason="Le paiement n'a pas encore été confirmé. Réessaie dans 30 secondes." />;
  }

  const meta = (session.metadata ?? {}) as Record<string, string>;
  const plan = isPlanId(meta.plan) ? meta.plan : null;
  const coachIds = (meta.coach_ids ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const email =
    session.customer_details?.email ??
    (typeof session.customer_email === "string" ? session.customer_email : null);

  if (!plan || coachIds.length === 0 || !email) {
    return <ErrorPage reason="Données de session incomplètes." />;
  }

  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
  const subscription =
    typeof session.subscription === "string"
      ? null
      : session.subscription ?? null;

  // Idempotent: re-running the same session must not duplicate the user.
  // Try to find existing user by stripe_customer_id first.
  let userId: string | null = null;
  let token: string | null = null;

  if (customerId) {
    const { data: existing } = await getSupabaseAdmin()
      .from("users")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    if (existing) userId = existing.id as string;
  }

  if (!userId) {
    const { data: inserted, error: insertErr } = await getSupabaseAdmin()
      .from("users")
      .insert({
        email,
        plan,
        active_coach_id: coachIds[0],
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription?.id ?? null,
        subscription_status: subscription?.status ?? "trialing",
        trial_ends_at: subscription?.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null,
        current_period_end: getPeriodEnd(subscription),
      })
      .select("id")
      .single();
    if (insertErr || !inserted) {
      console.error("[success] insert user", insertErr);
      return <ErrorPage reason="Impossible de créer ton compte. Réessaie ou contacte-nous." />;
    }
    userId = inserted.id as string;

    const coachRows = coachIds.map((coachId) => ({ user_id: userId!, coach_id: coachId }));
    const { error: coachErr } = await getSupabaseAdmin().from("user_coaches").insert(coachRows);
    if (coachErr) {
      console.error("[success] insert user_coaches", coachErr);
    }
  }

  // Generate a fresh auth_token for the bot deep link.
  token = crypto.randomBytes(24).toString("base64url");
  const { error: tokenErr } = await getSupabaseAdmin().from("auth_tokens").insert({
    token,
    user_id: userId,
  });
  if (tokenErr) {
    console.error("[success] insert auth_token", tokenErr);
    return <ErrorPage reason="Impossible de générer ton lien Telegram." />;
  }

  const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? "onze_ai_bot";
  const tgUrl = `https://t.me/${botUsername}?start=${token}`;

  // Try server-side redirect for fast-path; if Telegram doesn't accept, the meta-refresh below
  // and the manual fallback button cover it.
  // Note: we DO render UI even though we redirect, because some clients block t.me/.
  return (
    <main className="min-h-screen bg-onze-bg text-zinc-100">
      <meta httpEquiv="refresh" content={`0;url=${tgUrl}`} />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-dot-pattern opacity-25" />
      <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-16">
        <div className="rounded-2xl border border-onze-pitch/30 bg-onze-surface p-8 shadow-onze-btn">
          <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-onze-pitch-soft">
            ✓ Paiement validé
          </div>
          <h1 className="text-balance text-3xl font-medium tracking-tight">
            Dernière étape : ouvre Telegram.
          </h1>
          <p className="mt-3 text-sm text-zinc-400">
            On t&apos;envoie au bot Onze.ai. Tape <code className="rounded bg-white/10 px-1">/start</code>{" "}
            quand il s&apos;ouvre — ton compte est activé instantanément, et tes coachs commencent à
            t&apos;envoyer leurs paris.
          </p>
          <Link
            href={tgUrl}
            className="group mt-6 inline-flex items-center justify-between gap-2 rounded-lg bg-onze-pitch px-5 py-3 text-sm font-semibold text-white shadow-onze-btn transition-all hover:bg-onze-pitch-soft"
          >
            Ouvrir Telegram
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <p className="mt-4 text-[11px] text-zinc-500">
            Lien valide 30 minutes. Si tu rates l&apos;ouverture, reviens sur cette page depuis
            ton email.
          </p>
        </div>
      </div>
    </main>
  );
}

function ErrorPage({ reason }: { reason: string }) {
  return (
    <main className="min-h-screen bg-onze-bg text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-16">
        <div className="rounded-2xl border border-red-500/30 bg-onze-surface p-8 shadow-onze-btn">
          <h1 className="text-2xl font-medium tracking-tight">Aïe.</h1>
          <p className="mt-3 text-sm text-zinc-400">{reason}</p>
          <Link
            href="/start"
            className="mt-6 inline-block rounded-lg border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white"
          >
            Recommencer
          </Link>
        </div>
      </div>
    </main>
  );
}
