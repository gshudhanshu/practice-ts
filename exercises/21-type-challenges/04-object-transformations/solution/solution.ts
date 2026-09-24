/**
 * Solution — 21/04 Object transformations
 */

export type Account = {
  id: string;
  name: string;
  age: number;
  active: boolean;
  nickname?: string;
  bio?: string;
};

// `Pick<T, K>` is a one-property object. If that property is optional then the
// empty object satisfies it, so `{} extends Pick<T, K>` is precisely "is K
// optional?".
//
// `-?` on the mapped type strips optionality from the VALUES, so an optional
// key contributes `"nickname"` rather than `"nickname" | undefined` when the
// whole thing is indexed with `keyof T`.
export type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

// The same question, opposite branches.
export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

// Key remapping (10/03): a key mapped to `never` disappears. `T[K] extends V`
// tests the value type, so `nickname?: string` — whose type is
// `string | undefined` — is correctly excluded from PickByValue<T, string>.
export type PickByValue<T, V> = {
  [K in keyof T as T[K] extends V ? K : never]: T[K];
};

// Map over the union of both key sets and pick per key, B first so it wins.
// The result is one flat object type rather than an intersection.
export type Merge<A, B> = {
  [K in keyof A | keyof B]: K extends keyof B
    ? B[K]
    : K extends keyof A
      ? A[K]
      : never;
};

// A union with one variant per key in K:
//   { email: string; phone?: string } | { phone: string; email?: string }
// plus everything outside K, unchanged.
//
// The mapped type builds those variants as VALUES, and `[K]` indexes it to
// collapse the object into the union — the same idiom as OptionalKeys.
export type RequireAtLeastOne<T, K extends keyof T = keyof T> = Omit<T, K> &
  {
    [P in K]-?: Required<Pick<T, P>> & Partial<Pick<T, Exclude<K, P>>>;
  }[K];

export type Contact = {
  name: string;
  email?: string;
  phone?: string;
};

export function notify(
  contact: RequireAtLeastOne<Contact, "email" | "phone">,
): string {
  // Both properties are visible on every variant of the union — one required,
  // one optional — so `??` narrows without a cast. The type has already proved
  // at least one of them is there; TypeScript cannot see that through `??`,
  // which is why `contact.name` remains as the final fallback.
  return contact.email ?? contact.phone ?? contact.name;
}
