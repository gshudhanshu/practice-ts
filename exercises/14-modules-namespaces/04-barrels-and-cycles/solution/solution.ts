/**
 * Solution — 14/04 Barrels & cycles
 */

// The broken path, kept deliberately so the failure can be asserted.
import { DEFAULT_TIER, TIERS as BARREL_TIERS } from "./index-barrel";

// The fixed path: straight to the leaf. `pricing.ts` imports nothing that could
// point back here, so there is no cycle to be caught in. One statement carries
// the values and the type, with the inline `type` modifier (14/02).
import { TIERS, priceOf, type Tier } from "./pricing";

export type Plan = {
  tier: Tier;
  price: number;
};

// Typed `"free"`, valued `undefined`. The type is not wrong about what
// `TIERS[0]` is — it is wrong about WHEN the read happened.
export const brokenDefaultTier: Tier = DEFAULT_TIER;

// The identical read, at the identical moment, through an import that is not in
// a cycle. This is the fix you want in real code: depend on the module that
// owns the thing, not on a barrel that happens to forward it.
export const workingDefaultTier: Tier = TIERS[0];

export function lazyDefaultTier(): Tier {
  // Same binding as `DEFAULT_TIER` came from, read at CALL time. By now every
  // module has finished evaluating, so the live binding has its value.
  return BARREL_TIERS[0];
}

export function catalogue(): Plan[] {
  return TIERS.map((tier) => ({ tier, price: priceOf(tier) }));
}

// A public surface pointing at the leaves. A consumer that wants one price no
// longer evaluates `catalogue.ts`, `index-barrel.ts`, or the cycle between
// them.
export { TIERS, priceOf } from "./pricing";
export type { Tier } from "./pricing";
export { loadOrder } from "./load-order";
