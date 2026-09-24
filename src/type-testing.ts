/**
 * Compile-time assertion helpers.
 *
 * These have no runtime behaviour at all — they exist purely so that a wrong
 * TYPE becomes a red squiggle. Runtime tests prove your code works; these prove
 * your types are actually right, which is the half interviewers probe hardest.
 *
 * Usage:
 *   type _ = Expect<Equal<typeof result, string>>;
 *
 * If the type is wrong, `Equal<...>` resolves to `false`, which violates
 * `Expect<T extends true>` and tsc reports an error on that line.
 */

/** Passes only when T is exactly `true`. */
export type Expect<T extends true> = T;

/** Passes only when T is exactly `false`. */
export type ExpectFalse<T extends false> = T;

/**
 * Strict type equality.
 *
 * The deferred-conditional trick below is the standard way to compare types
 * *invariantly*. A naive `X extends Y ? true : false` would wrongly report
 * `any`/`never`/union subtypes as equal.
 */
export type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <
  T,
>() => T extends Y ? 1 : 2
  ? true
  : false;

/** Inverse of Equal. */
export type NotEqual<X, Y> = Equal<X, Y> extends true ? false : true;

/** Assignability check (looser than Equal): is A assignable to B? */
export type Extends<A, B> = A extends B ? true : false;

/** Detects an accidental `any` — the most common silent type bug. */
export type IsAny<T> = 0 extends 1 & T ? true : false;

/** Detects `never`, usually a sign a conditional type collapsed. */
export type IsNever<T> = [T] extends [never] ? true : false;
