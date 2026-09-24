/**
 * Solution — 10/02 Indexed access types
 */

export type User = {
  id: string;
  name: string;
  age: number;
  address: {
    city: string;
    country: string;
    geo: {
      lat: number;
      lon: number;
    };
  };
  orders: {
    id: string;
    placedAt: string;
    items: {
      sku: string;
      qty: number;
      unitPriceCents: number;
    }[];
  }[];
};

// The simplest form: read one property's type.
export type UserId = User["id"];

// Indexing with a UNION of keys yields the union of those property types.
export type NameOrAge = User["name" | "age"];

// Indexed access nests, so you can reach any depth without naming the levels
// in between. `Address` and `Geo` never had to be declared separately.
export type Geo = User["address"]["geo"];

// `[number]` on an array type gives its ELEMENT type — the same operator as
// `(typeof ROLES)[number]` in 10/01, applied to a real array rather than a
// tuple. Chained twice here: orders -> one order -> items -> one item.
export type OrderItem = User["orders"][number]["items"][number];

// Typed entirely from the derived types: no new declarations, so a change to
// `User` flows straight through.
export function allSkus(user: User): OrderItem["sku"][] {
  // flatMap maps and flattens one level in a single pass (05/05).
  return user.orders.flatMap((order) => order.items.map((item) => item.sku));
}

export function totalQty(user: User): number {
  return user.orders.reduce(
    (total, order) =>
      total + order.items.reduce((sum, item) => sum + item.qty, 0),
    0,
  );
}
