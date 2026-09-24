/**
 * Exercise 10/02 — Indexed access types
 *
 * `T[K]` reads a property's type out of another type. It composes and nests,
 * which means you can reach any type inside a structure without ever naming
 * the intermediate pieces.
 *
 * The rule this enables: NEVER re-declare a type that already exists inside
 * another one. Reach in and take it.
 *
 * Read README.md first. Replace every TODO.
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

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// The type of a user's id. One indexed access.
export type UserId = unknown;

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// The union of the `name` and `age` property types: string | number
//
// Indexing with a UNION of keys gives the union of their types.
export type NameOrAge = unknown;

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// The nested geo coordinates: { lat: number; lon: number }
// Indexed access nests — reach all the way in.
export type Geo = unknown;

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// A single line item, reaching through TWO arrays.
//   { sku: string; qty: number; unitPriceCents: number }
//
// `SomeArrayType[number]` gives the element type.
export type OrderItem = unknown;

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// Two functions typed entirely with the derived types above — no new type
// declarations.
//
//   allSkus(user)      every sku across every order, in order, duplicates kept
//   totalQty(user)     the sum of every item's qty
export function allSkus(user: User): unknown[] {
  throw new Error("TODO 5: implement allSkus");
}

export function totalQty(user: User): number {
  throw new Error("TODO 5: implement totalQty");
}
