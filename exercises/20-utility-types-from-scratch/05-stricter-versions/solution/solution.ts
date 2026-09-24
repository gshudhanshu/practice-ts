/**
 * Solution — 20/05 Stricter versions of the built-ins
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

// Identical body to 20/02's MyOmit. The ONLY difference is `K extends keyof T`
// in place of the standard library's `K extends keyof any` — and that one
// clause turns a silent no-op into a compile error.
export type StrictOmit<T, K extends keyof T> = {
  [P in keyof T as P extends K ? never : P]: T[P];
};

// `U extends T` says "you may only subtract members that are actually there".
export type StrictExclude<T, U extends T> = T extends U ? never : T;

// Same constraint, opposite branch. Note what it costs: `U` must now be
// assignable to `T`, so `StrictExtract<Shape, { kind: "circle" }>` is rejected
// even though that is the single most useful thing `Extract` does.
export type StrictExtract<T, U extends T> = T extends U ? T : never;

// `T` is naked on the left of `extends`, so the conditional runs once per union
// member and the omit is applied to each member separately. Without this,
// `keyof (Circle | Square)` is only `"kind" | "id"` — the keys they share — and
// everything else is discarded.
//
// The constraint stays loose on purpose: on a union, a key that exists on only
// some members is exactly the case you want this for.
export type DistributiveOmit<T, K extends keyof any> = T extends unknown
  ? { [P in keyof T as P extends K ? never : P]: T[P] }
  : never;

export function stripId(shape: Shape): DistributiveOmit<Shape, "id"> {
  // Rest destructuring over a union value distributes too: the compiler works
  // out the rest type for each member, which lines up with `DistributiveOmit`
  // exactly — so no cast, and the discriminated union survives.
  const { id: _id, ...rest } = shape;
  return rest;
}
