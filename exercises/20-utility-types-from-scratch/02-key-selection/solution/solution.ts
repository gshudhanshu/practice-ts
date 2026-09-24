/**
 * Solution — 20/02 Key selection
 */

export type User = {
  readonly id: string;
  name: string;
  email: string;
  passwordHash: string;
  lastLogin?: Date;
};

export type Role = "admin" | "editor" | "viewer";

export type Prettify<T> = {
  [K in keyof T]: T[K];
};

// Maps over `K`, NOT `keyof T`. `keyof T` appears only in the constraint, and
// that constraint is what makes an unknown key a compile error.
//
// It is still homomorphic — the rule is "keys come from `keyof T` or from a
// type parameter constrained by `keyof T`" — which is why `readonly id` and
// `lastLogin?` survive being picked.
export type MyPick<T, K extends keyof T> = {
  [P in K]: T[P];
};

// The standard library writes this as `Pick<T, Exclude<keyof T, K>>`. The
// key-remapping form below is equivalent for every case the tests cover, and
// says what it means without a second utility type: keep the key unless it is
// in K, in which case map it to `never` and it disappears (10/03).
//
// The constraint is `keyof any` — deliberately loose, matching the real Omit.
// See 20/05 for what that costs and why the team chose it.
export type MyOmit<T, K extends keyof any> = {
  [P in keyof T as P extends K ? never : P]: T[P];
};

// No source object: the keys come from K and every value has the same type.
// `keyof any` is `string | number | symbol`, so a non-literal key type such as
// `string` produces an index signature rather than named keys.
export type MyRecord<K extends keyof any, V> = {
  [P in K]: V;
};

// Composition: everything except K, intersected with K made optional.
//
// `Prettify` matters here. Without it the type is an intersection, which is
// assignable to the same values but displays as `A & B` in tooltips and fails
// a strict `Equal<>` comparison against a flat object type.
export type MyPartialBy<T, K extends keyof T> = Prettify<
  MyOmit<T, K> & { [P in K]?: T[P] }
>;

export type PublicUser = MyOmit<User, "passwordHash">;

export function toPublicUser(user: User): PublicUser {
  // Rest destructuring (05/02) IS `Omit` at runtime: the named key is bound to
  // a local and everything else lands in `rest`, whose type the compiler
  // computes as exactly the omitted shape. No cast, no `delete`, and `user`
  // itself is untouched.
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}
