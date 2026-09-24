import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  BuyOneGetOneFree,
  Cart,
  ClampedRule,
  PercentageOff,
  checkout,
  type CartItem,
  type PricingRule,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _ruleName = Expect<Equal<PricingRule["name"], string>>;
type _ruleMethod = Expect<
  Equal<
    PricingRule["discountCents"],
    (runningTotalCents: number, items: readonly CartItem[]) => number
  >
>;

type _percentageIsRule = Expect<PercentageOff extends PricingRule ? true : false>;
type _bogoIsRule = Expect<BuyOneGetOneFree extends PricingRule ? true : false>;
type _clampedIsRule = Expect<ClampedRule extends PricingRule ? true : false>;

function _compileTimeOnly(): void {
  // @ts-expect-error — ClampedRule is abstract.
  const _direct = new ClampedRule();

  const cart = new Cart();

  // @ts-expect-error — items is a read-only view.
  cart.items.push({ sku: "x", unitPriceCents: 1, qty: 1 });

  // @ts-expect-error — subtotalCents is a getter with no setter.
  cart.subtotalCents = 0;

  // Both rules are usable through the interface.
  const rules: PricingRule[] = [
    new PercentageOff("ten", 10),
    new BuyOneGetOneFree("bogo", "A"),
  ];
  void rules;
}

/* ── Fixtures ───────────────────────────────────────────────────────────── */

/** A: 3 x 1000 = 3000, B: 2 x 500 = 1000  ->  subtotal 4000 */
function stockedCart(): Cart {
  const cart = new Cart();
  cart.add({ sku: "A", unitPriceCents: 1000, qty: 3 });
  cart.add({ sku: "B", unitPriceCents: 500, qty: 2 });
  return cart;
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("Cart", () => {
  it("starts empty", () => {
    const cart = new Cart();
    expect(cart.subtotalCents).toBe(0);
    expect([...cart.items]).toEqual([]);
  });

  it("totals lines", () => {
    expect(stockedCart().subtotalCents).toBe(4000);
  });

  it("keeps insertion order", () => {
    expect([...stockedCart().items].map((line) => line.sku)).toEqual(["A", "B"]);
  });

  it("merges quantities for a repeated sku, keeping the first price", () => {
    const cart = new Cart();
    cart.add({ sku: "A", unitPriceCents: 1000, qty: 2 });
    cart.add({ sku: "A", unitPriceCents: 9999, qty: 3 });

    expect([...cart.items]).toEqual([
      { sku: "A", unitPriceCents: 1000, qty: 5 },
    ]);
    expect(cart.subtotalCents).toBe(5000);
  });

  it("removes a line", () => {
    const cart = stockedCart();
    cart.remove("A");
    expect([...cart.items].map((line) => line.sku)).toEqual(["B"]);
    expect(cart.subtotalCents).toBe(1000);
  });

  it("ignores removal of an unknown sku", () => {
    const cart = stockedCart();
    cart.remove("ZZZ");
    expect(cart.subtotalCents).toBe(4000);
  });
});

describe("PercentageOff", () => {
  it("discounts a percentage of the running total", () => {
    const rule = new PercentageOff("10% off", 10);
    expect(rule.discountCents(4000, [])).toBe(400);
  });

  it("rounds to the nearest cent", () => {
    const rule = new PercentageOff("33% off", 33);
    // 4001 * 0.33 = 1320.33
    expect(rule.discountCents(4001, [])).toBe(1320);
  });

  it("is clamped so it never exceeds the running total", () => {
    const rule = new PercentageOff("200% off", 200);
    expect(rule.discountCents(4000, [])).toBe(4000);
  });

  it("is clamped so it is never negative", () => {
    const rule = new PercentageOff("bad", -50);
    expect(rule.discountCents(4000, [])).toBe(0);
  });
});

describe("BuyOneGetOneFree", () => {
  const items: CartItem[] = [
    { sku: "A", unitPriceCents: 1000, qty: 3 },
    { sku: "B", unitPriceCents: 500, qty: 2 },
  ];

  it("makes every second unit free", () => {
    expect(new BuyOneGetOneFree("bogo A", "A").discountCents(4000, items)).toBe(
      1000,
    );
    expect(new BuyOneGetOneFree("bogo B", "B").discountCents(4000, items)).toBe(
      500,
    );
  });

  it("discounts nothing for a single unit", () => {
    const single: CartItem[] = [{ sku: "C", unitPriceCents: 700, qty: 1 }];
    expect(new BuyOneGetOneFree("bogo C", "C").discountCents(4000, single)).toBe(
      0,
    );
  });

  it("discounts nothing for an sku that is not in the cart", () => {
    expect(new BuyOneGetOneFree("bogo Z", "Z").discountCents(4000, items)).toBe(
      0,
    );
  });

  it("is clamped to the running total", () => {
    expect(new BuyOneGetOneFree("bogo A", "A").discountCents(300, items)).toBe(
      300,
    );
  });
});

describe("checkout", () => {
  it("returns the subtotal when there are no rules", () => {
    expect(checkout(stockedCart(), [])).toEqual({
      subtotalCents: 4000,
      discounts: [],
      totalCents: 4000,
    });
  });

  it("applies rules in order against the running total", () => {
    const result = checkout(stockedCart(), [
      new PercentageOff("10% off", 10),
      new BuyOneGetOneFree("bogo A", "A"),
    ]);

    expect(result.subtotalCents).toBe(4000);
    expect(result.discounts).toEqual([
      { name: "10% off", amountCents: 400 },
      { name: "bogo A", amountCents: 1000 },
    ]);
    expect(result.totalCents).toBe(2600);
  });

  it("omits rules that discount nothing", () => {
    const result = checkout(stockedCart(), [
      new PercentageOff("nothing", 0),
      new BuyOneGetOneFree("bogo Z", "Z"),
      new PercentageOff("10% off", 10),
    ]);

    expect(result.discounts).toEqual([{ name: "10% off", amountCents: 400 }]);
    expect(result.totalCents).toBe(3600);
  });

  it("never goes below zero", () => {
    const result = checkout(stockedCart(), [
      new PercentageOff("all of it", 100),
      new BuyOneGetOneFree("bogo A", "A"),
    ]);

    expect(result.totalCents).toBe(0);
    expect(result.discounts).toEqual([
      { name: "all of it", amountCents: 4000 },
    ]);
  });

  it("handles an empty cart", () => {
    const result = checkout(new Cart(), [new PercentageOff("10% off", 10)]);
    expect(result).toEqual({
      subtotalCents: 0,
      discounts: [],
      totalCents: 0,
    });
  });
});
