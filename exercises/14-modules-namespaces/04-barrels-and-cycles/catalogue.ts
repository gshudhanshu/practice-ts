import { record } from "./load-order";

// THE BUG. `TIERS` lives in ./pricing, but this module reaches for it through
// the barrel — and the barrel re-exports this very file. That is the cycle.
import { TIERS } from "./index-barrel";

record("catalogue");

/**
 * Read at MODULE-INIT time. Its type says `Tier`; at runtime it is `undefined`,
 * because the barrel is only half-built when this line runs.
 */
export const DEFAULT_TIER = TIERS?.[0];

/** The same read, deferred to CALL time — by then the cycle has resolved. */
export function firstTier(): string {
  return TIERS[0];
}

export const CATALOGUE_NAME = "plans";
