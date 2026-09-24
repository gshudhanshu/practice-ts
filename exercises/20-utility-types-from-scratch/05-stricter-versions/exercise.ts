/**
 * Exercise 20/05 — CHALLENGE: stricter versions of the built-ins
 *
 * Three of the standard library's utilities are deliberately LOOSE, and all
 * three cost real money in real codebases:
 *
 *   Omit<User, "pasword">        compiles, removes nothing
 *   Extract<Level, "trace">      compiles, returns never
 *   Omit<Circle | Square, "id">  compiles, DESTROYS the union
 *
 * Each is a silent failure: nothing goes red, and the type you get back is
 * quietly wrong. The most common refactoring bug in TypeScript is renaming a
 * property and leaving an `Omit` behind that no longer omits anything.
 *
 * In this exercise you build the strict versions — and, just as importantly,
 * you find out what strictness COSTS. There is a reason the standard library
 * chose the loose behaviour, and after TODO 3 you will be able to state it.
 *
 * Read README.md first. Replace every TODO.
 */

export type User = {
  readonly id: string;
  name: string;
  email: string;
  passwordHash: string;
};

export type Level = "debug" | "info" | "warn" | "error";

export type Circle = { kind: "circle"; id: string; radius: number };
export type Square = { kind: "square"; id: string; side: number };
export type Shape = Circle | Square;

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// `Omit`, but a key that does not exist on T is a COMPILE ERROR.
//
//   StrictOmit<User, "passwordHash">  ->  User without passwordHash
//   StrictOmit<User, "pasword">       ->  error, not a silent no-op
//
// The body is the same as 20/02. The whole exercise is in the constraint.
export type StrictOmit<T, K> = unknown;

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// `Exclude`, but you may only exclude members that are actually in T.
//
//   StrictExclude<Level, "warn">   ->  "debug" | "info" | "error"
//   StrictExclude<Level, "trace">  ->  error
//
// Catches the other half of the same refactor: a union member gets renamed and
// every filter that mentions the old name keeps compiling.
export type StrictExclude<T, U> = unknown;

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// `Extract`, same treatment.
//
//   StrictExtract<Level, "warn" | "error">  ->  "warn" | "error"
//   StrictExtract<Level, "trace">           ->  error
//
// The test also pins down what this costs you: `Extract<Shape, { kind: "circle" }>`
// — selecting a union member by a PARTIAL shape, which is genuinely useful —
// stops compiling, because a partial shape is not assignable to the union.
// That trade-off is the answer to "why is the built-in loose?".
export type StrictExtract<T, U> = unknown;

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// The loose behaviour that costs the most. `Omit` over a union collapses it:
//
//   Omit<Shape, "id">             ->  { kind: "circle" | "square" }
//                                     …the radius and the side are gone.
//   DistributiveOmit<Shape, "id"> ->  { kind: "circle"; radius: number }
//                                   | { kind: "square"; side: number }
//
// `keyof` a union gives only the keys common to every member, which is why the
// built-in flattens it. Force the omit to happen once PER MEMBER instead
// (10/04 — distribution).
//
// Keep the loose `keyof any` constraint here: a distributive omit is most
// useful precisely on unions whose members do not all share the key.
export type DistributiveOmit<T, K extends keyof any> = unknown;

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// The runtime proof. Strip the id from a shape — and the result must still be a
// DISCRIMINATED UNION, so a `switch` on `kind` still narrows (02/04).
//
//   stripId({ kind: "circle", id: "c1", radius: 2 })  ->  { kind: "circle", radius: 2 }
//
// No casts, no mutation of the input.
export function stripId(shape: Shape): DistributiveOmit<Shape, "id"> {
  throw new Error("TODO 5: implement stripId");
}
