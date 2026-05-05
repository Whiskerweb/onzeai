// Creates the three Onze.ai products + monthly prices on Stripe.
// Idempotent: re-running with the same product `metadata.onze_id` reuses existing products.
// Usage:
//   tsx --env-file=.env.local scripts/create-stripe-products.ts

import Stripe from "stripe";

type PlanSpec = {
  onzeId: "solo" | "squad" | "all";
  name: string;
  description: string;
  monthlyEUR: number;
  envName: "STRIPE_PRICE_SOLO" | "STRIPE_PRICE_SQUAD" | "STRIPE_PRICE_ALL";
};

const PLANS: PlanSpec[] = [
  {
    onzeId: "solo",
    name: "Onze.ai · Solo",
    description: "1 coach IA (foot, basket, tennis ou UFC). Tous ses paris sur Telegram. 3 messages chat / jour.",
    monthlyEUR: 14.9,
    envName: "STRIPE_PRICE_SOLO",
  },
  {
    onzeId: "squad",
    name: "Onze.ai · Squad",
    description: "2 coachs IA (foot, basket, tennis ou UFC). Tous leurs paris sur Telegram. 20 messages chat / jour.",
    monthlyEUR: 29.9,
    envName: "STRIPE_PRICE_SQUAD",
  },
  {
    onzeId: "all",
    name: "Onze.ai · All Access",
    description: "Les 4 coachs : foot, basket, tennis, UFC. Tous leurs paris. Chat illimité 24/7.",
    monthlyEUR: 49.9,
    envName: "STRIPE_PRICE_ALL",
  },
];

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY in env.");
  const stripe = new Stripe(key);
  const isLive = key.startsWith("sk_live_");
  console.log(`[stripe] mode = ${isLive ? "LIVE 🚨" : "TEST"}`);

  const results: { envName: string; priceId: string }[] = [];

  for (const plan of PLANS) {
    // Idempotency: search products by metadata
    const search = await stripe.products.search({
      query: `metadata['onze_id']:'${plan.onzeId}'`,
      limit: 1,
    });

    let product = search.data[0];
    if (!product) {
      product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: { onze_id: plan.onzeId },
      });
      console.log(`[stripe] created product ${plan.onzeId} → ${product.id}`);
    } else {
      console.log(`[stripe] reusing product ${plan.onzeId} → ${product.id}`);
    }

    // Look up an existing recurring monthly EUR price for this product
    const prices = await stripe.prices.list({
      product: product.id,
      active: true,
      limit: 100,
    });
    let price = prices.data.find(
      (p) =>
        p.recurring?.interval === "month" &&
        p.currency === "eur" &&
        p.unit_amount === Math.round(plan.monthlyEUR * 100),
    );
    if (!price) {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(plan.monthlyEUR * 100),
        currency: "eur",
        recurring: { interval: "month" },
        metadata: { onze_id: plan.onzeId, period: "monthly" },
      });
      console.log(`[stripe] created price ${plan.onzeId} (€${plan.monthlyEUR}/mo) → ${price.id}`);
    } else {
      console.log(`[stripe] reusing price ${plan.onzeId} → ${price.id}`);
    }

    results.push({ envName: plan.envName, priceId: price.id });
  }

  console.log("\n=== Add these to .env.local ===\n");
  for (const r of results) {
    console.log(`${r.envName}=${r.priceId}`);
  }
  console.log();
}

main().catch((e) => {
  console.error("[stripe] ERROR", e);
  process.exit(1);
});
