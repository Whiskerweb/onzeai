import { NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  PLAN_CONFIG,
  isPlanId,
  getStripePriceId,
  type PlanId,
} from "@/lib/plan-config";
import { coaches } from "@/app/_data/coaches";

export const runtime = "nodejs";

const validCoachIds = new Set(coaches.map((c) => c.id));

const Body = z.object({
  token: z.string().min(20),
  plan: z.string().refine(isPlanId, "plan invalide"),
  coachIds: z.array(z.string()).min(1).max(5),
});

export async function POST(req: Request) {
  let payload: z.infer<typeof Body>;
  try {
    payload = Body.parse(await req.json());
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof z.ZodError ? e.issues[0]?.message : "Body invalide" },
      { status: 400 },
    );
  }

  const sb = getSupabaseAdmin();

  // 1. Validate token
  const { data: t, error: tErr } = await sb
    .from("auth_tokens")
    .select("user_id, purpose, claimed_at, expires_at")
    .eq("token", payload.token)
    .maybeSingle();
  if (tErr) {
    console.error("[upgrade] token lookup", tErr);
    return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
  }
  if (!t || t.purpose !== "upgrade") {
    return NextResponse.json({ error: "Lien invalide" }, { status: 400 });
  }
  if (t.claimed_at) {
    return NextResponse.json({ error: "Lien déjà utilisé" }, { status: 400 });
  }
  if (new Date(t.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "Lien expiré" }, { status: 400 });
  }

  // 2. Load user
  const { data: user, error: uErr } = await sb
    .from("users")
    .select("id, plan, active_coach_id, stripe_subscription_id, subscription_status")
    .eq("id", t.user_id)
    .single();
  if (uErr || !user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 400 });
  }
  if (user.subscription_status === "terminated" || user.subscription_status === "canceled") {
    return NextResponse.json({ error: "Compte désactivé" }, { status: 400 });
  }

  // 3. Validate coach count vs new plan
  const newPlan = payload.plan as PlanId;
  const cfg = PLAN_CONFIG[newPlan];
  const coachIds = Array.from(new Set(payload.coachIds));
  if (coachIds.length !== cfg.maxCoaches) {
    return NextResponse.json(
      {
        error: `Le plan ${cfg.name} requiert exactement ${cfg.maxCoaches} coach${
          cfg.maxCoaches > 1 ? "s" : ""
        }.`,
      },
      { status: 400 },
    );
  }
  for (const id of coachIds) {
    if (!validCoachIds.has(id as never)) {
      return NextResponse.json({ error: `Coach inconnu : ${id}` }, { status: 400 });
    }
  }

  // 4. Update Stripe subscription if plan changed
  if (user.stripe_subscription_id && newPlan !== user.plan) {
    try {
      const stripe = getStripe();
      const sub = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
      const itemId = sub.items?.data?.[0]?.id;
      if (!itemId) {
        return NextResponse.json({ error: "Abonnement Stripe invalide" }, { status: 500 });
      }
      await stripe.subscriptions.update(user.stripe_subscription_id, {
        items: [{ id: itemId, price: getStripePriceId(newPlan) }],
        proration_behavior: "create_prorations",
        metadata: {
          plan: newPlan,
          coach_ids: coachIds.join(","),
        },
      });
    } catch (e) {
      console.error("[upgrade] Stripe update error", e);
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Erreur Stripe" },
        { status: 500 },
      );
    }
  }

  // 5. Update users.plan + active_coach_id
  const newActive =
    user.active_coach_id && coachIds.includes(user.active_coach_id)
      ? user.active_coach_id
      : coachIds[0];

  const { error: updateErr } = await sb
    .from("users")
    .update({ plan: newPlan, active_coach_id: newActive })
    .eq("id", user.id);
  if (updateErr) {
    console.error("[upgrade] update user", updateErr);
    return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
  }

  // 6. Reconcile user_coaches (DELETE removed, INSERT added)
  const { data: existing } = await sb
    .from("user_coaches")
    .select("coach_id")
    .eq("user_id", user.id);
  const existingSet = new Set((existing ?? []).map((r) => r.coach_id as string));
  const newSet = new Set(coachIds);

  const toDelete = [...existingSet].filter((id) => !newSet.has(id));
  const toInsert = [...newSet].filter((id) => !existingSet.has(id));

  if (toDelete.length > 0) {
    await sb.from("user_coaches").delete().eq("user_id", user.id).in("coach_id", toDelete);
  }
  if (toInsert.length > 0) {
    await sb
      .from("user_coaches")
      .insert(toInsert.map((coach_id) => ({ user_id: user.id, coach_id })));
  }

  // 7. Mark token claimed
  await sb
    .from("auth_tokens")
    .update({ claimed_at: new Date().toISOString() })
    .eq("token", payload.token);

  return NextResponse.json({ ok: true, plan: newPlan, coachIds });
}
