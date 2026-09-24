/**
 * Exercise 20/03 — Union filters: Exclude, Extract, NonNullable
 *
 * These three are the shortest utility types in the standard library, and they
 * make no sense at all unless you know one rule:
 *
 *   A conditional type over a NAKED type parameter DISTRIBUTES — it runs once
 *   per union member, and the results are unioned back together.
 *
 * `Exclude<T, U>` is literally `T extends U ? never : T`. Read without
 * distribution it says "if T is assignable to U, nothing, else T", which for a
 * union would answer the whole union or nothing at all. Read *with*
 * distribution it says "for each member, drop it if it matches" — which is a
 * filter.
 *
 * Distribution is 10/04. This exercise is about what it buys you, and about the
 * two edge cases every interviewer probes: `boolean` (which is secretly a
 * union) and `never` (which is secretly the EMPTY union).
 *
 * Read README.md first. Replace every TODO.
 */

export type Level = "debug" | "info" | "warn" | "error";

export type Circle = { kind: "circle"; radius: number };
export type Square = { kind: "square"; side: number };
export type Shape = Circle | Square;

/**
 * Given — the specimen. The obvious way to ask "is T never?" does not work:
 * `never` is the union with no members, so a distributive conditional over it
 * has nothing to run on and short-circuits to `never`. Neither branch is ever
 * evaluated, and you get back `never` rather than `true` or `false`.
 *
 *   NaiveIsNever<never>   ->  never    (not true!)
 *   NaiveIsNever<string>  ->  false
 *
 * TODO 4 is the version that works.
 */
export type NaiveIsNever<T> = T extends never ? true : false;

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Remove from T every member assignable to U.
//   MyExclude<Level, "debug">           ->  "info" | "warn" | "error"
//   MyExclude<Level, "debug" | "info">  ->  "warn" | "error"
//   MyExclude<string | number, string>  ->  number
export type MyExclude<T, U> = unknown;

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// Keep from T only the members assignable to U — the mirror image.
//   MyExtract<Level, "debug" | "warn">  ->  "debug" | "warn"
//   MyExtract<Shape, { kind: "circle" }>  ->  Circle
//
// Note that it matches by ASSIGNABILITY, not by identity: a partial object
// shape is enough to select a member.
export type MyExtract<T, U> = unknown;

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Drop `null` and `undefined`.
//   MyNonNullable<string | null | undefined>  ->  string
//
// One conditional. (The standard library now defines this a completely
// different way — `T & {}`. The explanation covers why they changed it.)
export type MyNonNullable<T> = unknown;

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// The working version of the specimen above:
//   HasMembers<never>                    ->  false
//   HasMembers<MyExclude<"a", "a">>      ->  false
//   HasMembers<"a" | "b">                ->  true
//
// Useful whenever you filter a union and need to know whether anything is
// left. To answer, you must first switch distribution OFF — wrap both sides of
// the `extends` in a one-element tuple (10/04).
export type HasMembers<T> = unknown;

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// The runtime side. Drop the nulls and undefineds from an array of tags:
//
//   compact(["a", null, "b", undefined])  ->  ["a", "b"]
//
// Empty strings are values, not holes — they must survive. No casts: a
// well-typed filter is enough.
export type MaybeTag = string | null | undefined;

export function compact(tags: readonly MaybeTag[]): MyNonNullable<MaybeTag>[] {
  throw new Error("TODO 5: implement compact");
}
