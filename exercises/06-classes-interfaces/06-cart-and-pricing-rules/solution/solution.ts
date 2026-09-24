/**
 * Solution — 06/06 Cart & pricing rules
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

export interface PricingRule {
  readonly name: string;
  discountCents(
    runningTotalCents: number,
    items: readonly CartItem[],
  ): number;
}

export class Cart {
  // A Map keyed by sku: O(1) lookup for the merge, and guaranteed insertion
  // order for the `items` view.
  #lines = new Map<string, CartItem>();

  add(item: CartItem): void {
    const existing = this.#lines.get(item.sku);

    if (existing === undefined) {
      // Copy, so a later mutation of the caller's object cannot reach in.
      this.#lines.set(item.sku, { ...item });
      return;
    }

    // Merging keeps the ORIGINAL unit price — re-setting an existing Map key
    // also preserves its original position, so insertion order is stable.
    this.#lines.set(item.sku, { ...existing, qty: existing.qty + item.qty });
  }

  remove(sku: string): void {
    // Map.delete on a missing key is a harmless no-op.
    this.#lines.delete(sku);
  }

  get items(): readonly CartItem[] {
    return [...this.#lines.values()];
  }

  get subtotalCents(): number {
    let total = 0;
    for (const line of this.#lines.values()) {
      total += line.unitPriceCents * line.qty;
    }
    return total;
  }
}

/**
 * Implements the interface ONCE on behalf of every rule.
 *
 * This is the template-method pattern from 06/03 combined with the interface
 * from 06/05: `discountCents` is the fixed, safe algorithm; `rawDiscountCents`
 * is the single varying step subclasses supply.
 */
export abstract class ClampedRule implements PricingRule {
  constructor(public readonly name: string) {}

  protected abstract rawDiscountCents(
    runningTotalCents: number,
    items: readonly CartItem[],
  ): number;

  discountCents(
    runningTotalCents: number,
    items: readonly CartItem[],
  ): number {
    const raw = this.rawDiscountCents(runningTotalCents, items);

    // Clamp into [0, runningTotalCents]. Every subclass gets this guarantee for
    // free, so no individual rule can produce a negative discount or push the
    // total below zero — an invariant enforced in ONE place.
    if (!Number.isFinite(raw) || raw <= 0) return 0;
    return Math.min(raw, Math.max(runningTotalCents, 0));
  }
}

export class PercentageOff extends ClampedRule {
  constructor(
    name: string,
    private readonly percent: number,
  ) {
    super(name);
  }

  // Only the arithmetic. The clamping, the name, and the interface conformance
  // all live in the base class.
  protected rawDiscountCents(runningTotalCents: number): number {
    return Math.round((runningTotalCents * this.percent) / 100);
  }
}

export class BuyOneGetOneFree extends ClampedRule {
  constructor(
    name: string,
    private readonly sku: string,
  ) {
    super(name);
  }

  protected rawDiscountCents(
    _runningTotalCents: number,
    items: readonly CartItem[],
  ): number {
    const line = items.find((item) => item.sku === this.sku);
    if (line === undefined) return 0;

    // Every second unit is free: 3 units -> 1 free, 4 -> 2, 1 -> 0.
    return Math.floor(line.qty / 2) * line.unitPriceCents;
  }
}

export function checkout(
  cart: Cart,
  rules: readonly PricingRule[],
): PriceBreakdown {
  const subtotalCents = cart.subtotalCents;
  const items = cart.items;

  const discounts: AppliedDiscount[] = [];
  let runningTotalCents = subtotalCents;

  for (const rule of rules) {
    // Each rule sees what is left after the previous ones — sequential
    // discounts, which is how real promotions stack.
    const amountCents = rule.discountCents(runningTotalCents, items);

    // A rule that changes nothing does not belong in the breakdown.
    if (amountCents <= 0) continue;

    discounts.push({ name: rule.name, amountCents });
    runningTotalCents -= amountCents;
  }

  return { subtotalCents, discounts, totalCents: runningTotalCents };
}
