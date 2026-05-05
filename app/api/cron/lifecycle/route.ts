import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Daily cron:
//   Pass 1 — soft lock users whose trial ended >2 days ago without a successful payment.
//            Cancels Stripe subscription, marks status 'terminated', notifies via Telegram.
//   Pass 2 — hard delete users locked >30 days. Cascades through user_coaches,
//            chat_messages, pick_deliveries, auth_tokens.

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const sb = getSupabaseAdmin();
  const stripe = (() => {
    try {
      return getStripe();
    } catch {
      return null;
    }
  })();

  const lockResult = await lockExpiredTrials(sb, stripe);
  const deleteResult = await deleteLongLocked(sb);

  return NextResponse.json({
    locked: lockResult.locked,
    deleted: deleteResult.deleted,
    errors: [...lockResult.errors, ...deleteResult.errors],
  });
}

type Stripe = NonNullable<ReturnType<typeof getStripe>>;

async function lockExpiredTrials(
  sb: ReturnType<typeof getSupabaseAdmin>,
  stripe: Stripe | null,
) {
  const cutoff = new Date(Date.now() - 2 * 86_400_000).toISOString();
  const errors: string[] = [];

  const { data: rows, error } = await sb
    .from("users")
    .select("id, stripe_subscription_id, telegram_id")
    .in("subscription_status", ["past_due", "unpaid", "incomplete", "incomplete_expired"])
    .lt("trial_ends_at", cutoff)
    .is("locked_at", null);

  if (error) {
    return { locked: 0, errors: [`select: ${error.message}`] };
  }

  let locked = 0;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://akyra.io";

  for (const row of rows ?? []) {
    if (stripe && row.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(row.stripe_subscription_id);
      } catch (e) {
        errors.push(`stripe.cancel ${row.id}: ${(e as Error).message}`);
      }
    }

    const { error: updateErr } = await sb
      .from("users")
      .update({
        subscription_status: "terminated",
        locked_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    if (updateErr) {
      errors.push(`update ${row.id}: ${updateErr.message}`);
      continue;
    }

    if (botToken && row.telegram_id) {
      try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: row.telegram_id,
            text: `Ton essai s'est terminé sans paiement réussi. On a fermé ton accès. Si tu veux revenir : ${appUrl}/start.`,
            link_preview_options: { is_disabled: true },
          }),
        });
      } catch (e) {
        errors.push(`tg notify ${row.id}: ${(e as Error).message}`);
      }
    }

    locked++;
  }

  return { locked, errors };
}

async function deleteLongLocked(sb: ReturnType<typeof getSupabaseAdmin>) {
  const cutoff = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const errors: string[] = [];

  const { data: rows, error } = await sb
    .from("users")
    .select("id")
    .eq("subscription_status", "terminated")
    .lt("locked_at", cutoff);

  if (error) {
    return { deleted: 0, errors: [`select: ${error.message}`] };
  }

  let deleted = 0;
  for (const row of rows ?? []) {
    const { error: delErr } = await sb.from("users").delete().eq("id", row.id);
    if (delErr) {
      errors.push(`delete ${row.id}: ${delErr.message}`);
      continue;
    }
    deleted++;
  }

  return { deleted, errors };
}
