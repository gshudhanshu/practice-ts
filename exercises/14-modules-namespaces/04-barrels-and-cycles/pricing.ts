import { record } from "./load-order";

record("pricing");

/** The leaf: this module imports nothing but the recorder. */
export const TIERS = ["free", "pro", "team"] as const;

export type Tier = (typeof TIERS)[number];

const PRICES: Record<Tier, number> = { free: 0, pro: 12, team: 40 };

export function priceOf(tier: Tier): number {
  return PRICES[tier];
}
