export type PlanId = "solo" | "squad" | "all";

export const PLAN_CONFIG = {
  solo: {
    id: "solo" as const,
    name: "Solo",
    maxCoaches: 1,
    monthlyMessages: 3,
    monthlyEUR: 14.9,
    annualEUR: 11.9,
    priceEnv: "STRIPE_PRICE_SOLO" as const,
  },
  squad: {
    id: "squad" as const,
    name: "Squad",
    maxCoaches: 2,
    monthlyMessages: 20,
    monthlyEUR: 29.9,
    annualEUR: 23.9,
    priceEnv: "STRIPE_PRICE_SQUAD" as const,
  },
  all: {
    id: "all" as const,
    name: "All Access",
    maxCoaches: 4,
    monthlyMessages: Infinity,
    monthlyEUR: 49.9,
    annualEUR: 39.9,
    priceEnv: "STRIPE_PRICE_ALL" as const,
  },
} as const;

export const PLAN_IDS: PlanId[] = ["solo", "squad", "all"];

export function isPlanId(v: unknown): v is PlanId {
  return v === "solo" || v === "squad" || v === "all";
}

export function getStripePriceId(plan: PlanId): string {
  const key = PLAN_CONFIG[plan].priceEnv;
  const v = process.env[key];
  if (!v) {
    throw new Error(`Missing env ${key} — Stripe price ID for plan "${plan}" is not configured.`);
  }
  return v;
}

/** Reverse of getStripePriceId: maps a Stripe price ID back to its plan, or null if unknown. */
export function planFromPriceId(priceId: string | null | undefined): PlanId | null {
  if (!priceId) return null;
  for (const id of PLAN_IDS) {
    if (process.env[PLAN_CONFIG[id].priceEnv] === priceId) return id;
  }
  return null;
}
