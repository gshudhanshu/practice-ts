# 16/01 — Declaration files

## What a `.d.ts` is

A file that contains **types and nothing else**. No function bodies, no
initialisers, no emitted JavaScript. It is TypeScript's way of saying "somewhere
out there, at runtime, this exists and has this shape".

Which means the compiler has exactly one source of truth about an untyped
dependency: whatever you wrote. There is no verification step. `declare` is a
promise, and TypeScript will spend the rest of the project defending it.

That is why the interesting part of this exercise is `tags`:

```js
return parts.length === 0 ? undefined : parts;   // the JavaScript
```

```ts
readonly tags: (csv: string) => string[];              // a lie
readonly tags: (csv: string) => string[] | undefined;  // the truth
```

The lie compiles. Every call site compiles. `firstTag("")` throws
`Cannot read properties of undefined`, in production, and the type system was
never going to catch it — you told it not to.

## The three ways to describe a module

**1. A `.d.ts` next to the file** (what this exercise ships). TypeScript looks
for `legacy-slug.d.ts` when you import `./legacy-slug.js`, before it ever
considers the `.js`.

**2. `declare module "<specifier>"` in an ambient declaration file** — the usual
shape for a package with no types:

```ts
// src/types/legacy-slug.d.ts
declare module "legacy-slug" {
  export function slugify(input: string): string;
  export function tags(csv: string): string[] | undefined;
  export const VERSION: string;
}
```

The block must live in a file that is *not* a module (no top-level
`import`/`export`), or TypeScript reads it as a module *augmentation* — which is
16/02, and which requires the module to already exist.

The escape hatch is one line:

```ts
declare module "untyped-thing";   // everything from it is `any`
```

Honest as a temporary measure, and easy to grep for later.

**3. Types published by someone else** — either bundled with the package
(`"types": "./dist/index.d.ts"` in its `package.json`) or on DefinitelyTyped as
`@types/<name>`. TypeScript looks in that order, so a package that ships its own
types wins over a stale `@types` entry.

That ordering is why "types version drift" is its own failure mode: `@types/foo`
is versioned separately from `foo`, and nothing stops you installing `foo@5`
alongside `@types/foo@3`. The declarations will describe an API that no longer
exists, confidently.

## `declare global`

```ts
declare global {
  var __LEGACY_SLUG__: SlugRuntime;
}
```

Two rules, both of which cost people an afternoon:

**It only works inside a module.** A file with no top-level `import` or `export`
*is* the global scope, so re-opening it makes no sense; TypeScript says
"Augmentations for the global scope can only be directly nested in external
modules". Add `export {}` to the file if it has nothing else to export.

**It has to be `var`.** `var` in global scope creates a property on `globalThis`;
`const` and `let` create a binding that is *not* a property of it. So
`declare global { const X: T }` type-checks `X` but not `globalThis.X`, which
looks like a compiler bug until you remember it is exactly how JavaScript
behaves.

This is the pattern behind every `Window` extension you have seen —
`declare global { interface Window { dataLayer: unknown[] } }` — and behind
typed `process.env`. Which brings the same warning: declaring
`process.env.API_URL` as `string` rather than `string | undefined` is a lie in
exactly the way `tags` was. It is *true* only if something validates it at
startup.

## Typing a dependency incrementally

You almost never need the whole API surface. Start with the two functions you
call, get the project compiling, and add members when you use them. Three
practical notes:

- **`unknown` is a legitimate declaration.** If you do not know what a function
  returns, say `unknown` and narrow at the call site. It is honest, and it makes
  the compiler help you.
- **Do not copy the `@types` package if it exists** — install it, and pin it
  next to the package it describes.
- **Send the declarations upstream.** A `.d.ts` you keep to yourself has to be
  maintained by you forever.

## Common mistakes

| Mistake | What happens |
|---|---|
| `tags: (csv: string) => string[]` | Compiles; `firstTag("")` throws at runtime |
| `list[0] ?? null` without the optional chain | `Cannot read properties of undefined` when the array is missing |
| `declare global { const __LEGACY_SLUG__: … }` | `globalThis.__LEGACY_SLUG__` still does not type-check |
| `declare global` in a file with no import/export | "can only be directly nested in external modules" |
| Writing `declare module "./relative-path"` | Ambient module declarations cannot use a relative name |
| Expecting a `.d.ts` edit to change behaviour | It emits nothing. That is the design |

## Interview angle

> *"You need to use a JavaScript library with no types. What do you do?"*

Check for `@types/<name>` first, and check whether the package ships its own
declarations. If neither, write a local `declare module` block covering only the
API you actually use, keep it under `src/types/`, and use `unknown` where you are
unsure rather than guessing. Then the sentence that shows judgement: a
declaration file is unverified — nothing checks it against the runtime — so the
declarations should be as conservative as the real behaviour, not as convenient
as you would like.

> *"What's the difference between `declare module` and module augmentation?"*

Same syntax, different meaning depending on the file. In a non-module file it
*creates* an ambient module for a specifier that has no types. In a module file
it *augments* a module that already exists, and fails if the specifier does not
resolve. The mistake is writing an augmentation in a file that happens to have
an `import` at the top and wondering why the compiler is asking for a module it
cannot find.
