/**
 * Exercise 08/02 — Generic constraints
 *
 * An unconstrained `T` can be anything, so you can do almost nothing with it.
 * A constraint (`T extends …`) buys you knowledge inside the function while
 * still relating the types at the call site.
 *
 * `K extends keyof T` returning `T[K]` is the single most useful generic
 * pattern in everyday code — TODO 1 and 2 are both that shape.
 *
 * Read README.md first. Replace every TODO.
 */

/** Values this exercise knows how to order. */
export type Comparable = string | number;

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Read one property, with the return type following the key:
//   pluck({ id: 1, name: "Ada" }, "name")  ->  string
//   pluck({ id: 1, name: "Ada" }, "id")    ->  number
//   pluck({ id: 1 }, "nope")               ->  compile error
export function pluck(item: unknown, key: unknown): unknown {
  throw new Error("TODO 1: implement pluck");
}

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// The same idea across a list:
//   pluckAll([{ age: 1 }, { age: 2 }], "age")  ->  number[]
export function pluckAll(items: readonly unknown[], key: unknown): unknown[] {
  throw new Error("TODO 2: implement pluckAll");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Sort by a property, WITHOUT mutating the input.
//
// The constraint has to say "T has a property named K, and its value is
// comparable". Numbers sort numerically; strings sort lexicographically.
//
//   sortByKey(users, "age")   ->  ascending by age
//   sortByKey(users, "name")  ->  A→Z by name
//   sortByKey(users, "tags")  ->  compile error (not comparable)
export function sortByKey(items: readonly unknown[], key: unknown): unknown[] {
  throw new Error("TODO 3: implement sortByKey");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// The item with the highest score, or undefined for an empty list.
// On a tie, return the one that appears FIRST.
//
// Here the "constraint" is supplied by the caller as a function, which is more
// flexible than constraining T itself.
export function maxBy(
  items: readonly unknown[],
  score: (item: unknown) => number,
): unknown {
  throw new Error("TODO 4: implement maxBy");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// Combine two objects. The result type must be the INTERSECTION of both, so
// every property of each is still visible.
//   merge({ a: 1 }, { b: "x" })  ->  { a: number } & { b: string }
export function merge(a: unknown, b: unknown): unknown {
  throw new Error("TODO 5: implement merge");
}
