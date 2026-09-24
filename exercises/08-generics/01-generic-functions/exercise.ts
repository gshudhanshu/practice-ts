/**
 * Exercise 08/01 — Generic functions
 *
 * A generic is a PARAMETER FOR A TYPE. Its purpose is to RELATE the input type
 * to the output type — not merely to accept anything.
 *
 * The test that matters: if a type parameter appears only ONCE in a signature,
 * it is relating nothing, and you probably wanted a constraint or `unknown`
 * instead. TODO 5 is exactly that mistake.
 *
 * Read README.md first. Replace every TODO.
 */

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Return the argument unchanged, preserving its type:
//   identity("a")  -> string
//   identity(1)    -> number
//
// The caller must never need to write identity<string>(…) — inference should
// do it.
export function identity(value: unknown): unknown {
  throw new Error("TODO 1: implement identity");
}

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// The first element, or undefined for an empty list. Works for any element
// type, and the return type must follow it.
export function first(items: readonly unknown[]): unknown {
  throw new Error("TODO 2: implement first");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Build a tuple from two values of INDEPENDENT types:
//   pair("a", 1)  ->  [string, number]
//
// Two type parameters, not one.
export function pair(a: unknown, b: unknown): [unknown, unknown] {
  throw new Error("TODO 3: implement pair");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Split a list in two by a predicate, keeping order:
//   partition([1,2,3,4], (n) => n % 2 === 0)  ->  [[2,4], [1,3]]
//                                                  ^matching ^rest
export function partition(
  items: readonly unknown[],
  predicate: (item: unknown) => boolean,
): [unknown[], unknown[]] {
  throw new Error("TODO 4: implement partition");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// This generic is POINTLESS: `T` appears once, so it relates nothing. It also
// silently accepts a string, which was probably not intended.
//
// Rewrite the signature with a plain parameter type instead of a type
// parameter. The behaviour stays the same; the signature gets honest.
export function totalLength<T extends { length: number }>(items: readonly T[]): number {
  let total = 0;
  for (const item of items) total += item.length;
  return total;
}
