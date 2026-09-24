/**
 * Exercise 03/02 — `noUncheckedIndexedAccess`
 *
 * This flag is NOT part of `strict`, and it is the difference between
 * "TypeScript says my array access is fine" and it actually being fine.
 *
 * With it on:
 *     values[0]      is  T | undefined
 *     record[key]    is  V | undefined
 *
 * Read README.md first. Replace every TODO.
 */

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Index safely, supporting negative indexes like Array.prototype.at():
//   at(["a","b","c"],  0) -> "a"
//   at(["a","b","c"], -1) -> "c"
//   at(["a","b","c"],  5) -> undefined
//
// Give it the honest return type. You should not need a single check —
// the flag hands you the right type already.
export function at(values: readonly string[], index: number): string {
  throw new Error("TODO 1: implement at");
}

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// Sum every number. Iterate with `for...of` (or reduce) rather than a
// C-style index loop, and notice that the flag never gets in your way.
export function sumAll(values: readonly number[]): number {
  throw new Error("TODO 2: implement sumAll");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Count occurrences: tally(["a","b","a"]) -> { a: 2, b: 1 }
// Reading `counts[word]` gives `number | undefined`. Handle it without `!`.
export function tally(words: readonly string[]): Record<string, number> {
  throw new Error("TODO 3: implement tally");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Pair up two arrays, stopping at the shorter one:
//   zip(["a","b"], [1,2,3]) -> [["a",1],["b",2]]
//
// Careful: checking `i < length` does NOT narrow `a[i]` for the compiler.
export function zip(
  left: readonly string[],
  right: readonly number[],
): [string, number][] {
  throw new Error("TODO 4: implement zip");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// Split into fixed-size chunks:
//   chunk([1,2,3,4,5], 2) -> [[1,2],[3,4],[5]]
//   chunk([1,2,3], 0)     -> []   (a non-positive size yields no chunks)
//
// Hint: one array method sidesteps indexed access entirely here.
export function chunk(values: readonly number[], size: number): number[][] {
  throw new Error("TODO 5: implement chunk");
}
