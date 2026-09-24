/**
 * Solution — 20/01 Object modifiers
 */

export type Settings = {
  theme: "light" | "dark";
  fontSize: number;
  autosave?: boolean;
};

export type Draft = {
  readonly id: string;
  title?: string;
  wordCount: number;
};

export type LosesModifiers<T> = {
  [K in Extract<keyof T, string>]: T[K];
};

// `?` on the mapped property ADDS optionality. Because the key source is a bare
// `keyof T`, the mapped type is homomorphic: `readonly` on the source survives.
// This is character-for-character the standard library's definition.
export type MyPartial<T> = {
  [K in keyof T]?: T[K];
};

// `-?` REMOVES optionality. It also strips `undefined` from the property's
// type — for an optional property that is exactly what you want.
export type MyRequired<T> = {
  [K in keyof T]-?: T[K];
};

// Adding `readonly` says nothing about `?`, so optionality is carried across
// unchanged by the homomorphic mapping.
export type MyReadonly<T> = {
  readonly [K in keyof T]: T[K];
};

// The mirror image, and the one the standard library omits. `-readonly` is the
// only way to undo the modifier — there is no other syntax for it.
export type MyMutable<T> = {
  -readonly [K in keyof T]: T[K];
};

export function applyPatch(
  base: MyRequired<Settings>,
  patch: MyPartial<Settings>,
): MyRequired<Settings> {
  // Spreading a partial over a complete object is exactly the semantics we
  // want: a key absent from `patch` is not spread, so the base value survives.
  //
  // It typechecks with no cast for a reason worth noticing —
  // `exactOptionalPropertyTypes` (03/03) guarantees `patch.fontSize` is either
  // absent or a real number, never an explicit `undefined`. Without that flag
  // this spread could blow a hole in the result type at runtime while still
  // compiling.
  return { ...base, ...patch };
}
