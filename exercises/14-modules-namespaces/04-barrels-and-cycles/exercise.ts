/**
 * Exercise 14/04 — Barrels & cycles — CHALLENGE
 *
 * A circular import is not a compile error. TypeScript resolves the types
 * happily, the bundler builds, and then a value is `undefined` at runtime with
 * a type that swears it cannot be.
 *
 * Four modules sit beside this one. You cannot edit any of them.
 *
 *   load-order.ts    a recorder with no imports — it can never be in a cycle
 *   pricing.ts       the leaf: TIERS, Tier, priceOf
 *   catalogue.ts     reaches for TIERS through the BARREL — the bug
 *   index-barrel.ts  `export *` from both of the above — the cycle
 *
 * Importing `index-barrel` evaluates `catalogue` first, and `catalogue` imports
 * `index-barrel` back before `pricing` has been reached. So `catalogue`'s
 * top-level read of `TIERS` sees a half-built module and gets `undefined` —
 * while its type still says `"free"`.
 *
 * Your job is to demonstrate the failure, then route around it. Read README.md
 * first, and read `catalogue.ts` before you start.
 */

import type { Tier } from "./pricing";

export type Plan = {
  tier: Tier;
  price: number;
};

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Expose the broken value so the failure is visible.
//
// Import `DEFAULT_TIER` from "./index-barrel" and re-export it here as
// `brokenDefaultTier`. Its TYPE is `"free"`; at runtime the test asserts it is
// `undefined`. Both of those are true at once, which is the whole exercise.
//
// Replace the placeholder below.
export const brokenDefaultTier: Tier = "team";

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// Fix it by routing around the barrel. Import `TIERS` DIRECTLY from "./pricing"
// — the leaf, which imports nothing that could point back here — and take the
// first entry at module-init time, exactly as `catalogue.ts` tried to.
//
//   workingDefaultTier === "free"
//
// Same read, same moment, no cycle. Replace the placeholder below.
export const workingDefaultTier: Tier = "team";

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Fix it a second way: keep the barrel, move the read.
//
// Import `TIERS` from "./index-barrel" as well (rename it — you already have a
// `TIERS` in scope) and read it inside a FUNCTION. By the time anyone calls it,
// every module has finished evaluating and the binding is live.
//
//   lazyDefaultTier() === "free"
//
// The point of the pair: a cycle does not corrupt a binding, it only makes the
// binding late. Reading at module-init time is what turns that into a bug.
export function lazyDefaultTier(): Tier {
  throw new Error("TODO 3: implement lazyDefaultTier");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Build the real thing the barrel was in the way of. Using `TIERS` and
// `priceOf` imported directly from "./pricing":
//
//   catalogue()
//   // [{ tier: "free", price: 0 },
//   //  { tier: "pro",  price: 12 },
//   //  { tier: "team", price: 40 }]
//
// In TIERS order, and a fresh array every call.
export function catalogue(): Plan[] {
  throw new Error("TODO 4: implement catalogue");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// Give this module a public surface that does not drag anyone through the
// cycle. Re-export, straight from the leaf modules:
//
//   * `TIERS` and `priceOf`, and the type `Tier`, from "./pricing"
//   * `loadOrder` from "./load-order"
//
// Not from "./index-barrel" — a consumer importing one price should not have to
// evaluate the whole cycle to get it.
