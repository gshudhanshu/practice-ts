/**
 * Exercise 21/05 — Arithmetic & recursion
 *
 * The type system has no `+`. What it has is tuples that know their own length
 * (21/01), so all type-level arithmetic is the same joke told four ways:
 *
 *   to add          build two tuples and concatenate them
 *   to subtract     build a tuple and pattern-match a prefix off it
 *   to compare      see which tuple runs out first
 *   to count        keep pushing until the length matches
 *
 * It is genuinely useful — fixed-length APIs, index bounds, unit systems — and
 * it is also the clearest place to meet the compiler's recursion limits, which
 * this exercise makes you measure rather than guess.
 *
 * Read README.md first. Replace every TODO.
 */

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// A tuple of N elements.
//   BuildTuple<3>           ->  [unknown, unknown, unknown]
//   BuildTuple<0>           ->  []
//   BuildTuple<2, string>   ->  [string, string]
//
// Add a THIRD type parameter as an accumulator with a default of `[]`, push
// onto it until its length matches N, then return it. The recursive call must
// be the whole branch — see the README on why that matters.
export type BuildTuple<N extends number, Fill = unknown> = unknown;

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// Addition, by concatenation.
//   Add<2, 3>    ->  5
//   Add<0, 0>    ->  0
//   Add<64, 36>  ->  100
//
// Build a tuple for each operand, spread both into one tuple, read its length.
export type Add<A extends number, B extends number> = unknown;

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Subtraction, by pattern-matching a prefix off the longer tuple.
//   Subtract<5, 2>  ->  3
//   Subtract<3, 3>  ->  0
//   Subtract<2, 5>  ->  never   (no negatives — the prefix does not match)
//
// Ask the compiler "does A's tuple start with B items?" — a tuple pattern with
// B's tuple spread at the front and an `infer` for the remainder. If it
// matches, the remainder's length is the answer. If it does not, B was bigger.
export type Subtract<A extends number, B extends number> = unknown;

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Comparison, by seeing which tuple runs out first.
//   GreaterThan<3, 2>  ->  true
//   GreaterThan<2, 3>  ->  false
//   GreaterThan<3, 3>  ->  false
//
// One conditional, no recursion of your own: ask whether B's tuple is at least
// as long as A's.
export type GreaterThan<A extends number, B extends number> = unknown;

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// Counting, and the runtime twin.
//   Enumerate<3>   ->  [0, 1, 2]
//   Range<2, 5>    ->  [2, 3, 4]
//   Range<3, 3>    ->  []
//
// `Enumerate` is `BuildTuple` again, except the value pushed is the CURRENT
// length rather than a fixed filler.
//
// `Range` then drops the first `Start` items from `Enumerate<End>` — the same
// prefix-matching move as `Subtract`.
export type Enumerate<N extends number> = unknown;
export type Range<Start extends number, End extends number> = unknown;

// The runtime twin: `range(2, 5)` -> `[2, 3, 4]`. End is exclusive, and an
// empty or backwards range gives `[]`. The test asserts it agrees with `Range`.
export function range(start: number, end: number): number[] {
  throw new Error("TODO 5: implement range");
}
