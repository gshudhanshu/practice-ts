import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  activeOrders,
  averageOrderValue,
  skuQuantities,
  topCustomers,
  totalRevenue,
  type CustomerTotal,
  type Order,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _topReturn = Expect<
  Equal<ReturnType<typeof topCustomers>, CustomerTotal[]>
>;
type _skuReturn = Expect<
  Equal<ReturnType<typeof skuQuantities>, Record<string, number>>
>;

/* ── Fixtures ───────────────────────────────────────────────────────────── */

const orders: Order[] = [
  {
    id: "o1",
    customer: "alice",
    totalCents: 1000,
    status: "shipped",
    items: [
      { sku: "A", qty: 2 },
      { sku: "B", qty: 1 },
    ],
  },
  {
    id: "o2",
    customer: "bob",
    totalCents: 2500,
    status: "pending",
    items: [{ sku: "A", qty: 1 }],
  },
  {
    id: "o3",
    customer: "alice",
    totalCents: 500,
    status: "shipped",
    items: [{ sku: "C", qty: 3 }],
  },
  {
    id: "o4",
    customer: "carol",
    totalCents: 9999,
    status: "cancelled",
    items: [{ sku: "A", qty: 100 }],
  },
];

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("activeOrders", () => {
  it("drops cancelled orders and keeps order", () => {
    expect(activeOrders(orders).map((o) => o.id)).toEqual(["o1", "o2", "o3"]);
  });
  it("handles an empty list", () => {
    expect(activeOrders([])).toEqual([]);
  });
  it("does not mutate the input", () => {
    activeOrders(orders);
    expect(orders).toHaveLength(4);
  });
});

describe("totalRevenue", () => {
  it("sums active orders only", () => {
    expect(totalRevenue(orders)).toBe(4000);
  });
  it("is 0 when nothing is active", () => {
    expect(totalRevenue([])).toBe(0);
    expect(totalRevenue(orders.filter((o) => o.status === "cancelled"))).toBe(0);
  });
});

describe("skuQuantities", () => {
  it("aggregates quantities across active orders", () => {
    expect(skuQuantities(orders)).toEqual({ A: 3, B: 1, C: 3 });
  });
  it("excludes cancelled orders entirely", () => {
    expect(skuQuantities(orders)["A"]).toBe(3);
  });
  it("is empty for no orders", () => {
    expect(skuQuantities([])).toEqual({});
  });
});

describe("topCustomers", () => {
  it("ranks by spend descending", () => {
    expect(topCustomers(orders, 2)).toEqual([
      { customer: "bob", totalCents: 2500 },
      { customer: "alice", totalCents: 1500 },
    ]);
  });

  it("respects the limit", () => {
    expect(topCustomers(orders, 1)).toEqual([
      { customer: "bob", totalCents: 2500 },
    ]);
    expect(topCustomers(orders, 99)).toHaveLength(2);
  });

  it("returns [] for a non-positive limit", () => {
    expect(topCustomers(orders, 0)).toEqual([]);
    expect(topCustomers(orders, -1)).toEqual([]);
  });

  it("breaks ties by customer name ascending", () => {
    const tied: Order[] = [
      { id: "t1", customer: "zoe", totalCents: 100, status: "shipped", items: [] },
      { id: "t2", customer: "adam", totalCents: 100, status: "shipped", items: [] },
    ];
    expect(topCustomers(tied, 2).map((c) => c.customer)).toEqual([
      "adam",
      "zoe",
    ]);
  });
});

describe("averageOrderValue", () => {
  it("averages active orders, rounded to a whole cent", () => {
    // (1000 + 2500 + 500) / 3 = 1333.33…
    expect(averageOrderValue(orders)).toBe(1333);
  });

  it("is 0 rather than NaN when there is nothing active", () => {
    expect(averageOrderValue([])).toBe(0);
    expect(
      averageOrderValue(orders.filter((o) => o.status === "cancelled")),
    ).toBe(0);
  });

  it("handles a single order", () => {
    const single = orders.filter((o) => o.id === "o2");
    expect(averageOrderValue(single)).toBe(2500);
  });
});
