/**
 * Solution — 10/03 Mapped types
 */

export type User = {
  id: string;
  name: string;
  age: number;
  active: boolean;
};

// The basic form: walk every key, keep it, transform the VALUE.
// `T[K]` is the indexed access from 10/02 — the original property's type.
export type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};

// `-readonly` REMOVES the modifier. `+readonly` (or plain `readonly`) adds it.
// The same applies to optionality: `-?` removes, `+?`/`?` adds.
export type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};

// An `as` clause RENAMES the key. Combined with a template literal type and
// the built-in `Capitalize`, that turns `id` into `getId`.
//
// `string & K` is needed because `keyof T` may include `number | symbol`, and
// template literal types only accept string-like keys.
export type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

// Mapping a key to `never` in the `as` clause DROPS it, which turns the rename
// clause into a filter.
export type PickByType<T, V> = {
  [K in keyof T as T[K] extends V ? K : never]: T[K];
};

export function fillNulls(draft: Nullable<User>): User | null {
  // Pull each field into a local so the narrowing sticks (03/02).
  const { id, name, age, active } = draft;

  // `=== null` rather than truthiness: "", 0 and false are all valid values,
  // which the test checks explicitly.
  if (id === null || name === null || age === null || active === null) {
    return null;
  }

  // Every local is now narrowed to its non-null type, so this object literal
  // is a User with no cast.
  return { id, name, age, active };
}
