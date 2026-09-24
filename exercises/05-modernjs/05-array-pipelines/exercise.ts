/**
 * Exercise 05/05 — CHALLENGE: array pipelines
 *
 * map / filter / reduce / flatMap, composed into real reporting queries.
 * Every TODO here is a shape you will write in a real job in your first week.
 *
 * Read README.md first. Replace every TODO.
 */

export type OrderItem = {
  sku: string;
  qty: number;
};

export type Order = {
  id: string;
  customer: string;
  /** Integer cents. */
  totalCents: number;
  status: "pending" | "shipped" | "cancelled";
  items: readonly OrderItem[];
};

export type CustomerTotal = {
  customer: string;
  totalCents: number;
};

// Cancelled orders NEVER count towards revenue, quantities or customer totals.

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Every order that is not cancelled, in the original order.
export function activeOrders(orders: readonly Order[]): Order[] {
  throw new Error("TODO 1: implement activeOrders");
}

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// Total revenue across active orders. 0 when there are none.
export function totalRevenue(orders: readonly Order[]): number {
  throw new Error("TODO 2: implement totalRevenue");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Total quantity ordered per SKU, across active orders:
//   { A: 3, B: 1, C: 3 }
//
// The items are nested one level inside each order — reach for the array
// method that maps and flattens in one pass.
export function skuQuantities(orders: readonly Order[]): Record<string, number> {
  throw new Error("TODO 3: implement skuQuantities");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// The `limit` biggest-spending customers across active orders, sorted by
// total DESCENDING, ties broken by customer name ASCENDING.
//   topCustomers(orders, 2) -> [{ customer: "bob", totalCents: 2500 }, …]
//
// A limit of 0 or less yields [].
export function topCustomers(
  orders: readonly Order[],
  limit: number,
): CustomerTotal[] {
  throw new Error("TODO 4: implement topCustomers");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// Mean value of an active order, rounded to the nearest whole cent.
// 0 when there are no active orders — not NaN.
export function averageOrderValue(orders: readonly Order[]): number {
  throw new Error("TODO 5: implement averageOrderValue");
}
