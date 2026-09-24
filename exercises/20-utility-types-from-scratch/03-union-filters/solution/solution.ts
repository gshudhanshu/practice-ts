/**
 * Solution — 20/03 Union filters
 */

export type Level = "debug" | "info" | "warn" | "error";

export type Circle = { kind: "circle"; radius: number };
export type Square = { kind: "square"; side: number };
export type Shape = Circle | Square;

export type NaiveIsNever<T> = T extends never ? true : false;

// `T` is NAKED on the left of `extends`, so the conditional distributes: it
// runs once per union member and the results are unioned back together. Every
// member that matches U contributes `never`, and `never` vanishes from a union.
//
// Character-for-character the standard library's definition.
export type MyExclude<T, U> = T extends U ? never : T;

// The mirror image — keep the matches instead of dropping them.
export type MyExtract<T, U> = T extends U ? T : never;

// Distribution again: `string | null | undefined` is checked one member at a
// time, and the two nullish members are replaced by `never`.
//
// The standard library used to define it exactly like this. Since TS 4.8 it is
// `T & {}` instead — see the explanation for why.
export type MyNonNullable<T> = T extends null | undefined ? never : T;

// Distribution must be switched OFF here. `never` is the empty union, so a
// distributive conditional over it has no members to run on and collapses to
// `never` — which is why `NaiveIsNever` cannot answer the question.
//
// Wrapping both sides in a one-element tuple makes `T` non-naked, so the
// conditional is evaluated once, on the whole type (10/04).
export type HasMembers<T> = [T] extends [never] ? false : true;

export type MaybeTag = string | null | undefined;

export function compact(tags: readonly MaybeTag[]): MyNonNullable<MaybeTag>[] {
  // An explicit type predicate turns `filter` into a narrowing operation:
  // `filter<S extends T>(p: (v: T) => v is S): S[]`. TypeScript can infer this
  // predicate on its own since 5.5, but writing it makes the intent obvious
  // and survives being refactored into a named helper.
  //
  // `!= null` would also work (it catches both null and undefined, 05/04), but
  // never truthiness — the empty string is a tag, and the test says so.
  return tags.filter(
    (tag): tag is MyNonNullable<MaybeTag> => tag !== null && tag !== undefined,
  );
}
