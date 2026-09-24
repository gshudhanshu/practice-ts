import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  allSkus,
  totalQty,
  type Geo,
  type NameOrAge,
  type OrderItem,
  type User,
  type UserId,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _userId = Expect<Equal<UserId, string>>;
type _nameOrAge = Expect<Equal<NameOrAge, string | number>>;
type _geo = Expect<Equal<Geo, { lat: number; lon: number }>>;
type _orderItem = Expect<
  Equal<OrderItem, { sku: string; qty: number; unitPriceCents: number }>
>;

// The functions must be typed from the derived types.
type _allSkus = Expect<Equal<ReturnType<typeof allSkus>, string[]>>;
type _totalQty = Expect<Equal<ReturnType<typeof totalQty>, number>>;

/* ── Fixtures ───────────────────────────────────────────────────────────── */

const user: User = {
  id: "u1",
  name: "Ada",
  age: 45,
  address: {
    city: "London",
    country: "UK",
    geo: { lat: 51.5, lon: -0.1 },
  },
  orders: [
    {
      id: "o1",
      placedAt: "2026-01-05",
      items: [
        { sku: "A", qty: 2, unitPriceCents: 1000 },
        { sku: "B", qty: 1, unitPriceCents: 500 },
      ],
    },
    {
      id: "o2",
      placedAt: "2026-02-01",
      items: [{ sku: "A", qty: 3, unitPriceCents: 1000 }],
    },
  ],
};

const empty: User = { ...user, orders: [] };

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("allSkus", () => {
  it("flattens every order's items, in order", () => {
    expect(allSkus(user)).toEqual(["A", "B", "A"]);
  });

  it("keeps duplicates", () => {
    expect(allSkus(user).filter((sku) => sku === "A")).toHaveLength(2);
  });

  it("handles a user with no orders", () => {
    expect(allSkus(empty)).toEqual([]);
  });

  it("handles an order with no items", () => {
    const noItems: User = {
      ...user,
      orders: [{ id: "o3", placedAt: "2026-03-01", items: [] }],
    };
    expect(allSkus(noItems)).toEqual([]);
  });
});

describe("totalQty", () => {
  it("sums quantities across all orders", () => {
    expect(totalQty(user)).toBe(6);
  });

  it("is 0 with no orders", () => {
    expect(totalQty(empty)).toBe(0);
  });
});
