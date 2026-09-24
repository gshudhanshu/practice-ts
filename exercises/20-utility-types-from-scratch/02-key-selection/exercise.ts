/**
 * Exercise 20/02 — Key selection: Pick, Omit, Record
 *
 * 20/01 mapped over every key and changed a modifier. This exercise changes
 * WHICH KEYS EXIST — and that is where the standard library gets interesting,
 * because its three key-selection utilities are built three different ways:
 *
 *   Pick<T, K>   maps over K            — the keys you asked for
 *   Record<K, V> maps over K            — keys with no source object at all
 *   Omit<T, K>   maps over keyof T      — every key except the ones you named
 *
 * The `Pick` case is the one people get wrong in interviews: it does NOT map
 * over `keyof T`. It maps over `K`. `keyof T` only appears in the constraint.
 *
 * You know the machinery from 10/03 (mapped types, key remapping with `as`).
 *
 * Read README.md first. Replace every TODO.
 */

export type User = {
  readonly id: string;
  name: string;
  email: string;
  passwordHash: string;
  lastLogin?: Date;
};

export type Role = "admin" | "editor" | "viewer";

/**
 * Given — the flattening idiom. An intersection like `A & B` displays (and
 * compares) as an intersection, not as a single object type. Mapping over its
 * keys once forces the compiler to resolve it into one flat object.
 *
 * Every codebase has this type. It is usually called `Prettify`, `Simplify` or
 * `Compute`. See 07/01 for intersections themselves.
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
};

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Keep only the named keys.
//   MyPick<User, "id" | "name">  ->  { readonly id: string; name: string }
//
// The constraint matters as much as the body: an unknown key must be a
// compile error, and it must be `K` you map over.
export type MyPick<T, K extends keyof T> = unknown;

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// Drop the named keys, keep the rest.
//   MyOmit<User, "passwordHash">  ->  User without passwordHash
//
// Note the deliberately LOOSE constraint below — `keyof any`, not `keyof T`.
// That is what the standard library does, and it means a typo compiles. You
// fix that in 20/05; here, match the real behaviour exactly.
//
// Build it with a key-remapping `as` clause so the result stays homomorphic
// (20/01) — `readonly` and `?` on the surviving keys must be preserved.
export type MyOmit<T, K extends keyof any> = unknown;

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// An object type with the given keys, all holding the same value type.
//   MyRecord<Role, number>     ->  { admin: number; editor: number; viewer: number }
//   MyRecord<string, boolean>  ->  { [k: string]: boolean }
//
// There is no source object here at all — the keys come only from K.
export type MyRecord<K extends keyof any, V> = unknown;

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Make ONLY the named keys optional, leave the others alone:
//   MyPartialBy<User, "email">
//     ->  { readonly id: string; name: string; email?: string; … }
//
// Compose it from the pieces above plus one small mapped type of your own, and
// wrap the result in `Prettify` so it comes out as a single flat object rather
// than an intersection.
export type MyPartialBy<T, K extends keyof T> = unknown;

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// The runtime side: strip the secret before a user leaves the server.
//
//   toPublicUser({ id: "u1", name: "Ada", email: "a@b.c", passwordHash: "…" })
//     ->  { id: "u1", name: "Ada", email: "a@b.c" }
//
// No casts, no `delete`, no mutation of the input. Rest destructuring (05/02)
// produces exactly the right type — this is `Omit` at runtime.
export type PublicUser = MyOmit<User, "passwordHash">;

export function toPublicUser(user: User): PublicUser {
  throw new Error("TODO 5: implement toPublicUser");
}
