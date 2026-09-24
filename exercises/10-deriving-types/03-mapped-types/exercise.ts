/**
 * Exercise 10/03 — Mapped types
 *
 * A mapped type walks a type's keys and builds a new type from them:
 *
 *   { [K in keyof T]: … }
 *
 * You can change the VALUE type, add or remove MODIFIERS, rename the KEY, or
 * drop a key entirely. Those four moves cover almost every type transformation
 * you will ever need.
 *
 * Read README.md first. Replace every TODO.
 */

export type User = {
  id: string;
  name: string;
  age: number;
  active: boolean;
};

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Every property, but its value may also be null:
//   Nullable<User>  ->  { id: string | null; name: string | null; … }
export type Nullable<T> = unknown;

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// Strip `readonly` from every property.
//   Mutable<Readonly<User>>  ->  User
//
// A mapped type can REMOVE a modifier with a minus sign.
export type Mutable<T> = unknown;

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Turn every property into a getter method, RENAMING the key:
//   Getters<User>  ->  { getId: () => string; getName: () => string; … }
//
// Renaming uses an `as` clause inside the mapped type, plus a template literal
// type and the built-in `Capitalize`.
export type Getters<T> = unknown;

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Keep only the properties whose value type is assignable to V:
//   PickByType<User, string>   ->  { id: string; name: string }
//   PickByType<User, number>   ->  { age: number }
//
// Mapping a key to `never` in the `as` clause REMOVES it.
export type PickByType<T, V> = unknown;

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// The runtime side: turn a draft where anything may be null into a real User,
// or null if any field is missing.
//
// No casts — narrowing each field is what makes the result assignable.
export function fillNulls(draft: Nullable<User>): User | null {
  throw new Error("TODO 5: implement fillNulls");
}
