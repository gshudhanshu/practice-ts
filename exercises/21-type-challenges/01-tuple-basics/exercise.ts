/**
 * Exercise 21/01 — Tuple basics
 *
 * A tuple type is a fixed-length list the compiler can count. Once you can
 * take one apart with `[infer H, ...infer R]` and rebuild it with `[...T, V]`,
 * every "how does that library know the argument order?" trick becomes
 * readable.
 *
 * You already have the tools: `infer` and recursion (10/04) and indexed access
 * (10/02). This section is practice, not new mechanics.
 *
 * Read README.md first. Replace every TODO.
 */

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// The length of a tuple, as a NUMBER LITERAL type.
//   Length<[1, 2, 3]>          ->  3
//   Length<[]>                 ->  0
//   Length<readonly ["a"]>     ->  1
//   Length<string[]>           ->  number   (an array has no fixed length)
//
// No conditional needed — a tuple's `length` property is already a literal.
export type Length<T extends readonly unknown[]> = unknown;

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// The first element, and everything after it.
//   Head<[1, 2, 3]>  ->  1        Tail<[1, 2, 3]>  ->  [2, 3]
//   Head<[]>         ->  never    Tail<[]>         ->  []
//
// This is the variadic pattern the whole section is built on: a tuple pattern
// with `infer` in the position you want and a rest element for the remainder.
// Write `readonly` in the pattern, or readonly tuples will not match.
export type Head<T extends readonly unknown[]> = unknown;
export type Tail<T extends readonly unknown[]> = unknown;

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// The same, from the other end.
//   Last<[1, 2, 3]>  ->  3        Pop<[1, 2, 3]>  ->  [1, 2]
//   Last<[]>         ->  never    Pop<[]>         ->  []
//
// A rest element may sit at the START of a tuple pattern, which is what makes
// this possible at all.
export type Last<T extends readonly unknown[]> = unknown;
export type Pop<T extends readonly unknown[]> = unknown;

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Add an element at either end. Both results are MUTABLE tuples, even when the
// input was readonly.
//   Push<[1, 2], 3>              ->  [1, 2, 3]
//   Push<readonly [1, 2], 3>     ->  [1, 2, 3]
//   Unshift<[2, 3], 1>           ->  [1, 2, 3]
//
// No conditional and no `infer` — just spread the tuple into a new one.
export type Push<T extends readonly unknown[], V> = unknown;
export type Unshift<T extends readonly unknown[], V> = unknown;

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// The runtime twin of TODO 4. `unshift(["b", "c"], "a")` must return
// `["a", "b", "c"]` — and the type must be the exact tuple `["a", "b", "c"]`,
// not `string[]`.
//
// Two things make that work, and both are already on the signature:
//   - `const T` (08/03) makes the array argument infer as a tuple of literals
//     instead of widening to `string[]`;
//   - the return type is `Unshift<T, V>`, which — unlike a conditional type —
//     the compiler CAN check from inside a generic function (10/04).
//
// Replace the return type and the body.
export function unshift<const T extends readonly unknown[], const V>(
  items: T,
  value: V,
): unknown {
  throw new Error("TODO 5: implement unshift");
}
