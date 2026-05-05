import { NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/lib/stripe";
import { PLAN_CONFIG, isPlanId, getStripePriceId } from "@/lib/plan-config";
import { coaches } from "@/app/_data/coaches";

export const runtime = "nodejs";

const validCoachIds = new Set(coaches.map((c) => c.id));

const Body = z.object({
  plan: z.string().refine(isPlanId, "plan invalide"),
  coachIds: z.array(z.string()).min(1).max(5),
  email: z.string().email("email invalide"),
  freeFixtureId: z.string().nullable().optional(),
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

  const cfg = PLAN_CONFIG[payload.plan as keyof typeof PLAN_CONFIG];
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
      return NextResponse.json({ error: `Coach inconnu: ${id}` }, { status: 400 });
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  let priceId: string;
  try {
    priceId = getStripePriceId(payload.plan as keyof typeof PLAN_CONFIG);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Configuration Stripe manquante" },
      { status: 500 },
    );
  }

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          plan: payload.plan,
          coach_ids: coachIds.join(","),
          free_fixture_id: payload.freeFixtureId ?? "",
        },
      },
      payment_method_collection: "always",
      metadata: {
        plan: payload.plan,
        coach_ids: coachIds.join(","),
        free_fixture_id: payload.freeFixtureId ?? "",
      },
      customer_email: payload.email,
      success_url: `${appUrl}/start/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/start?plan=${payload.plan}&coaches=${coachIds.join(",")}${
        payload.freeFixtureId ? `&free=${payload.freeFixtureId}` : ""
      }`,
      locale: "fr",
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[checkout] Stripe error", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur Stripe" },
      { status: 500 },
    );
  }
}
