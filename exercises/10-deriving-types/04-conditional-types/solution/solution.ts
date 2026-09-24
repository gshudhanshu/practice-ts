/**
 * Solution — 10/04 Conditional types & `infer`
 */

// `readonly unknown[]` as the test covers both mutable and readonly arrays —
// `string[]` is assignable to `readonly unknown[]`, but not the other way round.
export type IsArray<T> = T extends readonly unknown[] ? true : false;

// `infer E` declares a type variable inside the pattern. If the pattern
// matches, E is bound to whatever sat in that position.
export type ElementOf<T> = T extends readonly (infer E)[] ? E : never;

// Conditional types may reference themselves, so this peels one Promise per
// step until the pattern stops matching.
export type DeepAwaited<T> = T extends Promise<infer U> ? DeepAwaited<U> : T;

// `T` is NAKED on the left of `extends`, so the conditional distributes:
// it runs once per union member and the results are unioned back together.
//   Distributed<string | number>  =  string[] | number[]
export type Distributed<T> = T extends unknown ? T[] : never;

// Wrapping BOTH sides in a one-element tuple defeats distribution, so the
// union is seen as a single type.
//   Collected<string | number>  =  (string | number)[]
export type Collected<T> = [T] extends [unknown] ? T[] : never;

export function firstElement<T extends readonly unknown[]>(
  items: T,
): T[number] | undefined {
  // `ElementOf<T> | undefined` would NOT compile here. Inside the function `T`
  // is still an unresolved type parameter, so `ElementOf<T>` is a DEFERRED
  // conditional — the compiler cannot evaluate it, and therefore cannot prove
  // `items[0]` is assignable to it.
  //
  // `T[number]` is an indexed access, which needs no evaluation. At every call
  // site the two resolve to the same thing.
  return items[0];
}
