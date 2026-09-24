/**
 * Solution — 05/05 Array pipelines
 */

export type OrderItem = {
  sku: string;
  qty: number;
};

export type Order = {
  id: string;
  customer: string;
  totalCents: number;
  status: "pending" | "shipped" | "cancelled";
  items: readonly OrderItem[];
};

export type CustomerTotal = {
  customer: string;
  totalCents: number;
};

export function activeOrders(orders: readonly Order[]): Order[] {
  // `.filter` always allocates a new array, so the input is never touched.
  return orders.filter((order) => order.status !== "cancelled");
}

export function totalRevenue(orders: readonly Order[]): number {
  // Reusing activeOrders keeps the "cancelled never counts" rule in ONE place.
  // If that rule changes, it changes once.
  return activeOrders(orders).reduce(
    (total, order) => total + order.totalCents,
    0,
  );
}

export function skuQuantities(orders: readonly Order[]): Record<string, number> {
  const quantities: Record<string, number> = {};

  // `.flatMap` maps and flattens one level in a single pass — exactly right for
  // "all the items across all the orders".
  for (const item of activeOrders(orders).flatMap((order) => order.items)) {
    // Reading an index signature gives `number | undefined`, so seed with 0.
    quantities[item.sku] = (quantities[item.sku] ?? 0) + item.qty;
  }

  return quantities;
}

function compareStrings(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export function topCustomers(
  orders: readonly Order[],
  limit: number,
): CustomerTotal[] {
  if (limit <= 0) return [];

  const totals = new Map<string, number>();
  for (const order of activeOrders(orders)) {
    totals.set(
      order.customer,
      (totals.get(order.customer) ?? 0) + order.totalCents,
    );
  }

  return [...totals]
    .map(([customer, totalCents]) => ({ customer, totalCents }))
    .sort(
      (a, b) =>
        b.totalCents - a.totalCents || compareStrings(a.customer, b.customer),
    )
    // `.slice` past the end is safe — it just returns everything.
    .slice(0, limit);
}

export function averageOrderValue(orders: readonly Order[]): number {
  const active = activeOrders(orders);
  // Guard before dividing: 0/0 is NaN, which would poison every downstream sum.
  if (active.length === 0) return 0;

  const total = active.reduce((sum, order) => sum + order.totalCents, 0);
  return Math.round(total / active.length);
}
