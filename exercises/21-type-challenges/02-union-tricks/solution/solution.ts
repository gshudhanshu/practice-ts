/**
 * Solution — 21/02 Union tricks
 */

// `1 & T` is `1` for every ordinary T, so `0 extends 1` is false. When T is
// `any`, `1 & any` is `any`, and `0 extends any` is true. `any` is the only
// type that flips this, which makes it a reliable detector.
export type IsAny<T> = 0 extends 1 & T ? true : false;

// `unknown extends T` is true for `unknown` — and for `any`, which is
// assignable in both directions. Ruling `any` out first is what makes this
// exact rather than approximately right.
export type IsUnknown<T> = IsAny<T> extends true
  ? false
  : unknown extends T
    ? true
    : false;

// Step 1: distribute the union into a union of functions taking T.
//           (arg: A) => void | (arg: B) => void
// Step 2: infer the parameter back out. Parameters are CONTRAVARIANT, so a
//         single function assignable to both must accept A and B — the only
//         parameter type that satisfies that is A & B.
export type UnionToIntersection<T> = (
  T extends unknown ? (arg: T) => void : never
) extends (arg: infer I) => void
  ? I
  : never;

// `U = T` keeps an undistributed copy. Inside the distributed branch, `T` is a
// single member while `U` is still the whole union, so `[U] extends [T]` asks
// "is the whole union just this one member?".
//
// The `[T] extends [never]` guard comes first because `never` would distribute
// to nothing and produce `never` rather than `false`.
export type IsUnion<T, U = T> = [T] extends [never]
  ? false
  : T extends unknown
    ? [U] extends [T]
      ? false
      : true
    : never;

// `() => T` puts T in RETURN position, which is covariant, so intersecting the
// functions produces an overloaded signature rather than merging the returns.
// `infer` on an overloaded type picks the LAST overload — which is how this
// extracts exactly one member of the union.
type LastOf<T> =
  UnionToIntersection<T extends unknown ? () => T : never> extends () => infer R
    ? R
    : never;

// Peel the last member off, recurse on what is left, and put it at the end.
// The base case is the empty union.
export type UnionToTuple<T> = [T] extends [never]
  ? []
  : [...UnionToTuple<Exclude<T, LastOf<T>>>, LastOf<T>];

export function mergeConfigs<A extends object, B extends object>(
  base: A,
  override: B,
): A & B {
  // TypeScript models a spread of two generic objects as their intersection,
  // so this needs no cast — the value and the declared type line up exactly.
  return { ...base, ...override };
}
