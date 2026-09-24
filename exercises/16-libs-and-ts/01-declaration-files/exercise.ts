/**
 * Exercise 16/01 — declaration files: describing JavaScript you did not write
 *
 * A `.d.ts` file contains types and nothing else. It emits no JavaScript, it
 * changes no behaviour, and the compiler believes every word of it.
 *
 * That is its power and its danger. `declare` is not a check — it is a PROMISE
 * you make on behalf of code the compiler cannot see. Get it wrong and you have
 * not written a bug; you have written a bug that TypeScript will now defend.
 *
 * `legacy-slug.js` in this directory is the untyped dependency. Read it: its
 * behaviour is the only specification you have, and one of its functions does
 * not do what its name suggests.
 *
 * Read README.md first. Replace every TODO.
 */

import legacySlug from "./legacy-slug.js";

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Describe the module's default export — the object at the bottom of
// legacy-slug.js. Four members: `slugify`, `truncate`, `tags`, `VERSION`.
//
// `legacy-slug.d.ts` wires this type to the module specifier, so whatever you
// write here becomes the truth as far as the compiler is concerned.
//
// Describe what the JavaScript ACTUALLY does, not what you wish it did.
export type LegacySlug = {
  readonly TODO: never;
};

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// Use the module through your own declaration.
//
//   slugTitle("Hello, World!", 8) -> "hello-wo..."   (slugify, then truncate)
//   slugTitle("Hello", 20)        -> "hello"
//
//   firstTag("news, ts")          -> "news"
//   firstTag("")                  -> null            (tags() returns undefined!)
//
// If TODO 1 was honest, the compiler will force you to handle the `undefined`
// case here. If it was not, this compiles and blows up at runtime.
export function slugTitle(title: string, maxLength: number): string {
  throw new Error("TODO 2: implement slugTitle");
}

export function firstTag(csv: string): string | null {
  throw new Error("TODO 2: implement firstTag");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// The same script also assigns to a global:
//
//   globalThis.__LEGACY_SLUG__ = { version: "1.4.0", installedAt: "2019-04-02" };
//
// Declare that global so `globalThis.__LEGACY_SLUG__` type-checks, then read it
// in `slugRuntime`. No casts.
//
// A `declare global { … }` block belongs in a file that is already a module —
// this one is. Inside it, `var` (not `const`) is what puts a name on
// `globalThis`.
export type SlugRuntime = {
  readonly version: string;
  readonly installedAt: string;
};

export function slugRuntime(): SlugRuntime {
  throw new Error("TODO 3: implement slugRuntime");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Where do a package's types come from? Four situations, four answers.
export type TypeSource =
  /** The package ships `.d.ts` files and points at them from package.json. */
  | "bundled-with-the-package"
  /** Someone published `@types/<name>` on DefinitelyTyped. */
  | "definitely-typed"
  /** Nobody has typed it; you write the declarations yourself. */
  | "your-own-declaration-file"
  /** There are no types at all, and the import is `any`. */
  | "none";

export type Situation =
  | "the-package-ships-its-own-declarations"
  | "the-package-is-javascript-only-and-@types-exists-on-npm"
  | "no-declarations-exist-anywhere-and-you-use-two-functions-from-it"
  | "noImplicitAny-is-off-and-the-import-silently-became-any";

export function typeSourceFor(situation: Situation): TypeSource {
  throw new Error("TODO 4: implement typeSourceFor");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// Diagnose the failure. Each of these is a different way a declaration file
// can be wrong. README.md has the table.
export type Symptom =
  | "the-import-is-typed-any-and-noImplicitAny-reports-it"
  | "tsc-is-happy-and-the-property-is-undefined-at-runtime"
  | "the-declarations-describe-an-older-major-version-of-the-package"
  | "declare-module-compiles-but-node-cannot-resolve-the-import"
  | "editing-the-d-ts-changed-nothing-in-the-bundle";

export type Cause =
  | "no-declaration-file"
  | "the-declaration-does-not-match-the-runtime"
  | "types-version-drift"
  | "a-declaration-without-a-runtime-module"
  | "declarations-emit-nothing";

export function diagnose(symptom: Symptom): Cause {
  throw new Error("TODO 5: implement diagnose");
}
