/**
 * Solution — 16/01 Declaration files
 */

import legacySlug from "./legacy-slug.js";

// The module's real shape. Note `tags`: the JavaScript returns `undefined` when
// there is nothing to split, so the declaration says so. Writing `string[]`
// here would compile everywhere and throw in `firstTag` — a declaration is a
// promise about code the compiler cannot see, and nothing checks it for you.
export type LegacySlug = {
  readonly slugify: (input: string) => string;
  readonly truncate: (input: string, max: number) => string;
  readonly tags: (csv: string) => string[] | undefined;
  readonly VERSION: string;
};

export function slugTitle(title: string, maxLength: number): string {
  return legacySlug.truncate(legacySlug.slugify(title), maxLength);
}

export function firstTag(csv: string): string | null {
  const list = legacySlug.tags(csv);
  // Two separate `undefined`s to survive: the absent array, and — thanks to
  // noUncheckedIndexedAccess — the absent element. `?.` handles both.
  return list?.[0] ?? null;
}

export type SlugRuntime = {
  readonly version: string;
  readonly installedAt: string;
};

// `declare global` re-opens global scope from inside a module. `var` is what
// puts the name on `globalThis`; `const`/`let` declare a global binding that
// `globalThis.x` cannot see.
declare global {
  var __LEGACY_SLUG__: SlugRuntime;
}

export function slugRuntime(): SlugRuntime {
  return globalThis.__LEGACY_SLUG__;
}

export type TypeSource =
  | "bundled-with-the-package"
  | "definitely-typed"
  | "your-own-declaration-file"
  | "none";

export type Situation =
  | "the-package-ships-its-own-declarations"
  | "the-package-is-javascript-only-and-@types-exists-on-npm"
  | "no-declarations-exist-anywhere-and-you-use-two-functions-from-it"
  | "noImplicitAny-is-off-and-the-import-silently-became-any";

export function typeSourceFor(situation: Situation): TypeSource {
  const sources: Record<Situation, TypeSource> = {
    "the-package-ships-its-own-declarations": "bundled-with-the-package",
    "the-package-is-javascript-only-and-@types-exists-on-npm":
      "definitely-typed",
    "no-declarations-exist-anywhere-and-you-use-two-functions-from-it":
      "your-own-declaration-file",
    "noImplicitAny-is-off-and-the-import-silently-became-any": "none",
  };

  return sources[situation];
}

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
  const causes: Record<Symptom, Cause> = {
    "the-import-is-typed-any-and-noImplicitAny-reports-it":
      "no-declaration-file",
    "tsc-is-happy-and-the-property-is-undefined-at-runtime":
      "the-declaration-does-not-match-the-runtime",
    "the-declarations-describe-an-older-major-version-of-the-package":
      "types-version-drift",
    "declare-module-compiles-but-node-cannot-resolve-the-import":
      "a-declaration-without-a-runtime-module",
    // Not a bug — the expected behaviour, and the whole point of `.d.ts`.
    "editing-the-d-ts-changed-nothing-in-the-bundle": "declarations-emit-nothing",
  };

  return causes[symptom];
}
