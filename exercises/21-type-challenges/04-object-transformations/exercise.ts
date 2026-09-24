/**
 * Exercise 21/04 — Object transformations
 *
 * Four types you will actually reach for in a real codebase, each with one
 * non-obvious trick in it:
 *
 *   OptionalKeys        `{} extends Pick<T, K>` — the only reliable way to ask
 *                       "is this property optional?"
 *   PickByValue         key remapping with `as`, filtering on the VALUE type
 *   Merge               a mapped type over `keyof A | keyof B`
 *   RequireAtLeastOne   a union of "this one is required" variants
 *
 * Mapped types and key remapping were taught in 10/03 — this is practice.
 *
 * Read README.md first. Replace every TODO.
 */

export type Account = {
  id: string;
  name: string;
  age: number;
  active: boolean;
  nickname?: string;
  bio?: string;
};

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// The optional keys of a type, and the required ones, as unions.
//   OptionalKeys<Account>  ->  "nickname" | "bio"
//   RequiredKeys<Account>  ->  "id" | "name" | "age" | "active"
//
// `keyof T` cannot tell them apart, and neither can `T[K] extends undefined` —
// an optional property and a `| undefined` property are different things under
// `exactOptionalPropertyTypes` (03/04).
//
// The trick: `Pick<T, K>` is a one-property object type. If that property is
// optional, then `{}` is assignable to it. So `{} extends Pick<T, K>` is
// exactly the question "is K optional?".
//
// Build a mapped type whose VALUES are the keys you want to keep, then index it
// with `keyof T` to collapse it to a union — the 10/03 idiom. Remember `-?`, or
// the optional keys will come back as `… | undefined`.
export type OptionalKeys<T> = unknown;
export type RequiredKeys<T> = unknown;

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// Keep only the properties whose VALUE type matches.
//   PickByValue<Account, string>   ->  { id: string; name: string }
//   PickByValue<Account, number>   ->  { age: number }
//   PickByValue<Account, boolean>  ->  { active: boolean }
//
// Note what is NOT there: `nickname?: string` has type `string | undefined`,
// which does not extend `string`. That surprises people; the explanation covers
// why it is the right answer.
//
// Use key remapping — `as` in the key position, mapping to `never` to drop.
export type PickByValue<T, V> = unknown;

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Merge two object types, with the second winning on conflicts.
//   Merge<{ a: string; b: number }, { b: boolean; c: string }>
//     ->  { a: string; b: boolean; c: string }
//
// `A & B` is NOT the answer: an intersection of two conflicting `b` properties
// gives `number & boolean`, i.e. `never`, and it displays as two objects joined
// by `&` rather than one flat type.
//
// Map over `keyof A | keyof B` and choose per key.
export type Merge<A, B> = unknown;

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Take a type with several optional properties and demand at least one of them.
//
//   type Reachable = RequireAtLeastOne<Contact, "email" | "phone">;
//     { name: "a", email: "x@y.z" }                ok
//     { name: "a", phone: "123" }                  ok
//     { name: "a", email: "x@y.z", phone: "123" }  ok
//     { name: "a" }                                compile error
//
// The shape of the answer is a UNION: one variant per key in K, in which that
// key is required and the others stay optional. Everything outside K is
// untouched.
//
// `Omit`, `Pick`, `Required`, `Partial` and `Exclude` are all you need — plus
// the 10/03 idiom of building a mapped type and indexing it to get a union.
//
// K defaults to `keyof T` so `RequireAtLeastOne<T>` means "at least one of
// anything".
export type RequireAtLeastOne<T, K extends keyof T = keyof T> = unknown;

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// The runtime side. A contact can be reached if it has an email or a phone
// number; `notify` returns whichever it will use.
//
//   notify({ name: "Ada", email: "ada@example.com" })  ->  "ada@example.com"
//   notify({ name: "Ada", phone: "555" })              ->  "555"
//   notify({ name: "Ada" })                            ->  COMPILE ERROR
//
// Type the parameter with your `RequireAtLeastOne` so the last line cannot be
// written. Email wins when both are present.
export type Contact = {
  name: string;
  email?: string;
  phone?: string;
};

export function notify(contact: unknown): string {
  throw new Error("TODO 5: implement notify");
}
