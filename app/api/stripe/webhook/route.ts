import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
// Stripe needs the raw body to verify the signature; opt out of any caching.
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return new NextResponse("Missing signature or secret", { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch (e) {
    console.error("[stripe-webhook] signature verification failed", e);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.trial_will_end": {
        const sub = event.data.object as Stripe.Subscription;
        await syncSubscription(sub);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await syncSubscription(sub, "canceled");
        break;
      }
      default:
        // Other events ignored for v1
        break;
    }
  } catch (e) {
    console.error(`[stripe-webhook] error handling ${event.type}`, e);
    return new NextResponse("Handler error", { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function syncSubscription(sub: Stripe.Subscription, overrideStatus?: string) {
  const periodEnd = sub.items?.data?.[0]?.current_period_end;
  const updates: Record<string, unknown> = {
    subscription_status: overrideStatus ?? sub.status,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    trial_ends_at: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
  };

  await getSupabaseAdmin()
    .from("users")
    .update(updates)
    .eq("stripe_subscription_id", sub.id);
}
