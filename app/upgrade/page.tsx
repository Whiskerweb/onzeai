import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isPlanId, type PlanId } from "@/lib/plan-config";
import { coaches, type CoachId } from "../_data/coaches";
import { UpgradeWizard } from "./_components/UpgradeWizard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Modifier mon plan · Onze.ai",
  description: "Change ton plan ou tes coachs en quelques clics.",
};

type SP = Promise<{ token?: string }>;

export default async function UpgradePage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const token = sp.token?.trim();

  if (!token) {
    return <ErrorState reason="Lien manquant. Régénère-le avec /upgrade dans le bot." />;
  }

  const sb = getSupabaseAdmin();

  const { data: tokenRow, error: tokenErr } = await sb
    .from("auth_tokens")
    .select("token, user_id, purpose, expires_at, claimed_at")
    .eq("token", token)
    .maybeSingle();

  if (tokenErr || !tokenRow) {
    return <ErrorState reason="Lien invalide. Régénère-le avec /upgrade dans le bot." />;
  }
  if (tokenRow.purpose !== "upgrade") {
    return <ErrorState reason="Ce lien n'est pas un lien d'upgrade." />;
  }
  if (tokenRow.claimed_at) {
    return <ErrorState reason="Ce lien a déjà été utilisé. Régénère-le avec /upgrade dans le bot." />;
  }
  if (new Date(tokenRow.expires_at).getTime() < Date.now()) {
    return <ErrorState reason="Lien expiré (30 minutes). Régénère-le avec /upgrade dans le bot." />;
  }

  const { data: user } = await sb
    .from("users")
    .select("id, email, plan, subscription_status")
    .eq("id", tokenRow.user_id)
    .single();

  if (!user || !isPlanId(user.plan)) {
    return <ErrorState reason="Compte introuvable." />;
  }
  if (user.subscription_status === "terminated" || user.subscription_status === "canceled") {
    return (
      <ErrorState reason="Ton compte est désactivé. Repars depuis /start pour t'abonner à nouveau." />
    );
  }

  const { data: coachRows } = await sb
    .from("user_coaches")
    .select("coach_id")
    .eq("user_id", user.id);

  const validCoachSet = new Set<CoachId>(coaches.map((c) => c.id));
  const currentCoachIds: CoachId[] = (coachRows ?? [])
    .map((r) => r.coach_id as CoachId)
    .filter((id): id is CoachId => validCoachSet.has(id));

  return (
    <main className="min-h-screen bg-onze-bg text-zinc-100">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-dot-pattern opacity-25" />

      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span className="grid size-7 place-items-center rounded-lg bg-onze-pitch text-white shadow-onze-btn">
            ◆
          </span>
          Onze.ai
        </Link>
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Modifier mon abonnement
        </span>
      </header>

      <UpgradeWizard
        token={token}
        currentPlan={user.plan as PlanId}
        currentCoachIds={currentCoachIds}
      />
    </main>
  );
}

function ErrorState({ reason }: { reason: string }) {
  return (
    <main className="min-h-screen bg-onze-bg text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-16">
        <div className="rounded-2xl border border-red-500/30 bg-onze-surface p-8 shadow-onze-btn">
          <h1 className="text-2xl font-medium tracking-tight">Lien indisponible.</h1>
          <p className="mt-3 text-sm text-zinc-400">{reason}</p>
        </div>
      </div>
    </main>
  );
}
