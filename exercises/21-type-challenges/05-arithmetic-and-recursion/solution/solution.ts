/**
 * Solution — 21/05 Arithmetic & recursion
 */

// The accumulator pattern: push onto `Acc` until its length matches N, then
// return it. The recursive call IS the false branch — nothing wraps it — so the
// compiler can eliminate the tail call and allow ~1000 levels instead of ~48.
export type BuildTuple<
  N extends number,
  Fill = unknown,
  Acc extends unknown[] = [],
> = Acc["length"] extends N ? Acc : BuildTuple<N, Fill, [...Acc, Fill]>;

// Concatenate two fixed-length tuples and read the length. This is legal
// because at most one rest element may be unbounded — both of these are fixed
// by the time they are spread.
export type Add<A extends number, B extends number> = [
  ...BuildTuple<A>,
  ...BuildTuple<B>,
]["length"];

// "Does A's tuple start with B items?" If so, `Rest` is the remainder and its
// length is the difference. If not — B was larger — the pattern fails and the
// answer is `never`, which is the honest result for a system with no negatives.
export type Subtract<A extends number, B extends number> =
  BuildTuple<A> extends [...BuildTuple<B>, ...infer Rest]
    ? Rest["length"]
    : never;

// Whichever tuple runs out first is the smaller number. If B's tuple is at
// least as long as A's, then A is not greater than B.
export type GreaterThan<A extends number, B extends number> =
  BuildTuple<B> extends [...BuildTuple<A>, ...unknown[]] ? false : true;

// BuildTuple again, except the element pushed is the accumulator's CURRENT
// length — so each step records the index it was at.
export type Enumerate<
  N extends number,
  Acc extends number[] = [],
> = Acc["length"] extends N ? Acc : Enumerate<N, [...Acc, Acc["length"]]>;

// Drop the first `Start` items from `Enumerate<End>`, using the same
// prefix-matching move as `Subtract`.
export type Range<Start extends number, End extends number> =
  Enumerate<End> extends [...Enumerate<Start>, ...infer R] ? R : never;

export function range(start: number, end: number): number[] {
  const out: number[] = [];
  for (let n = start; n < end; n++) out.push(n);
  return out;
}
