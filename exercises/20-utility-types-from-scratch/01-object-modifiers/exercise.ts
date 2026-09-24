/**
 * Exercise 20/01 — Object modifiers: Partial, Required, Readonly, Mutable
 *
 * The standard library ships four utilities that do nothing but flip a
 * modifier on every property. Each one is a single line, and writing them from
 * memory is the most common opening question in a TypeScript interview.
 *
 * You already know the machinery (10/03 — mapped types). This exercise is
 * about the FAMILY: what each one is for, and the property that makes them
 * behave sensibly on types you did not write — HOMOMORPHISM.
 *
 * A mapped type written directly over `keyof T`:
 *
 *   { [K in keyof T]: … }
 *
 * is *homomorphic*: it copies the original modifiers across unless you
 * explicitly change them. Map over anything else — a computed key union, a
 * `keyof` that has been through `Extract` — and every `readonly` and `?` in the
 * source is silently discarded. `LosesModifiers` below is that mistake, kept as
 * a specimen.
 *
 * Read README.md first. Replace every TODO.
 */

export type Settings = {
  theme: "light" | "dark";
  fontSize: number;
  autosave?: boolean;
};

/** A type that carries BOTH modifiers, so you can see them survive. */
export type Draft = {
  readonly id: string;
  title?: string;
  wordCount: number;
};

/**
 * Given — the counter-example. Same body, but the key source is a computed
 * union rather than a bare `keyof T`, so the mapped type is NOT homomorphic:
 * `readonly` and `?` are both thrown away, and the optional property comes out
 * as `title: string | undefined`. Compare it against your `MyReadonly` below.
 */
export type LosesModifiers<T> = {
  [K in Extract<keyof T, string>]: T[K];
};

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Every property optional.
//   MyPartial<Settings>  ->  { theme?: "light" | "dark"; fontSize?: number; … }
//
// The workhorse of every "patch"/"update" API in existence.
export type MyPartial<T> = unknown;

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// Every property required.
//   MyRequired<MyPartial<Settings>>  ->  every key back, none optional
//
// Requires the modifier-REMOVING form, not the plain one.
export type MyRequired<T> = unknown;

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Every property readonly. Optionality must survive untouched:
//   MyReadonly<Draft>  ->  { readonly id: string; readonly title?: string; … }
export type MyReadonly<T> = unknown;

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// The inverse of TODO 3 — strip `readonly`.
//   MyMutable<MyReadonly<Settings>>  ->  Settings
//
// The standard library does NOT ship this one. The explanation covers why, and
// why nearly every codebase ends up writing it anyway.
export type MyMutable<T> = unknown;

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// The runtime pay-off: apply a patch to a fully-populated settings object.
//
//   applyPatch({ theme: "light", fontSize: 14, autosave: true }, { fontSize: 18 })
//     ->  { theme: "light", fontSize: 18, autosave: true }
//
// Keys absent from the patch keep their old value, and `base` must not be
// mutated. No casts — the modifier types do the work.
export function applyPatch(
  base: MyRequired<Settings>,
  patch: MyPartial<Settings>,
): MyRequired<Settings> {
  throw new Error("TODO 5: implement applyPatch");
}
