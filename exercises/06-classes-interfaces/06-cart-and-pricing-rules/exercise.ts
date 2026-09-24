/**
 * Exercise 06/06 — CHALLENGE: cart & pricing rules
 *
 * The section-06 boss fight, and the last exercise of Phase 1. It combines
 * an interface as a contract, an abstract class supplying shared behaviour,
 * two concrete subclasses, and polymorphic aggregation.
 *
 * Read README.md first. Replace every TODO.
 */

export type CartItem = {
  sku: string;
  unitPriceCents: number;
  qty: number;
};

export type AppliedDiscount = {
  name: string;
  amountCents: number;
};

export type PriceBreakdown = {
  subtotalCents: number;
  discounts: readonly AppliedDiscount[];
  totalCents: number;
};

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// The contract every pricing rule satisfies:
//   readonly name: string
//   discountCents(runningTotalCents: number, items: readonly CartItem[]): number
//
// It returns the discount AMOUNT (a positive number to subtract), not the new
// total.
export interface PricingRule {}

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// The cart.
//   add(item)              adding an existing sku increases its qty;
//                          the unit price of the existing entry is kept
//   remove(sku)            removes that line entirely; unknown skus are a no-op
//   get items()            a READ-ONLY view, in insertion order
//   get subtotalCents()    sum of unitPriceCents * qty
export class Cart {
  #lines = new Map<string, CartItem>();
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// An ABSTRACT base that implements PricingRule once, for every rule:
//
//   - it implements `discountCents` by calling an abstract
//     `rawDiscountCents(...)` that subclasses provide, then CLAMPING the
//     result into the range [0, runningTotalCents]
//   - so no rule can ever produce a negative discount, or one bigger than
//     what is left to pay
//
// Subclasses therefore only ever write the interesting arithmetic.
export abstract class ClampedRule {}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Two concrete rules, both extending ClampedRule.
//
// PercentageOff(name, percent)
//   raw discount = percent% of the running total, rounded to the nearest cent
//
// BuyOneGetOneFree(name, sku)
//   raw discount = for the matching line, every SECOND unit is free:
//   floor(qty / 2) * unitPriceCents. An sku not in the cart discounts nothing.
export class PercentageOff {}

export class BuyOneGetOneFree {}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// Apply every rule IN ORDER, each one seeing the running total left by the
// previous rules.
//
//   - a rule that discounts 0 must NOT appear in `discounts`
//   - the total can reach 0 but must never go below it
//   - `subtotalCents` always reports the pre-discount figure
//
// Note the parameter type: this function knows nothing about the concrete
// rule classes.
export function checkout(
  cart: Cart,
  rules: readonly PricingRule[],
): PriceBreakdown {
  throw new Error("TODO 5: implement checkout");
}
