/**
 * Solution — 21/01 Tuple basics
 */

// A tuple's `length` is already a numeric literal type, so an indexed access
// (10/02) is all this needs. `string[]` has `length: number`, which is exactly
// why `Length<string[]>` is `number` — the array has no fixed length to report.
export type Length<T extends readonly unknown[]> = T["length"];

// The variadic pattern. `readonly` on the pattern is what lets a readonly
// tuple match: `[1, 2]` is assignable to `readonly [1, 2]`, not the reverse.
export type Head<T extends readonly unknown[]> = T extends readonly [
  infer H,
  ...unknown[],
]
  ? H
  : never;

// Only the rest needs a name, so the head slot is a plain `unknown`. Using
// `infer` for a position you do not use costs nothing but reads worse.
export type Tail<T extends readonly unknown[]> = T extends readonly [
  unknown,
  ...infer R,
]
  ? R
  : [];

// A rest element may sit at the START of a tuple pattern (TS 4.0+), which is
// what makes "everything but the last" expressible at all.
export type Last<T extends readonly unknown[]> = T extends readonly [
  ...unknown[],
  infer L,
]
  ? L
  : never;

export type Pop<T extends readonly unknown[]> = T extends readonly [
  ...infer R,
  unknown,
]
  ? R
  : [];

// No conditional, no `infer`: spreading a tuple into a tuple literal type is a
// construction, not a pattern match. The result is mutable because the new
// tuple literal is written without `readonly`.
export type Push<T extends readonly unknown[], V> = [...T, V];
export type Unshift<T extends readonly unknown[], V> = [V, ...T];

export function unshift<const T extends readonly unknown[], const V>(
  items: T,
  value: V,
): Unshift<T, V> {
  // `const T` (08/03) stops `["b", "c"]` widening to `string[]`, so T infers as
  // the tuple `readonly ["b", "c"]` and the return type is `["a", "b", "c"]`.
  //
  // Note this compiles from INSIDE the generic function, unlike a conditional
  // return type (10/04). `[V, ...T]` needs no evaluation — the compiler can see
  // that the array literal below has exactly that shape.
  return [value, ...items];
}
