# 03/04 — Configure a project properly

## What `strict: true` actually turns on

Exactly eight flags:

| Flag | What it catches |
|---|---|
| `noImplicitAny` | Unannotated parameters silently becoming `any` |
| `strictNullChecks` | `null`/`undefined` treated as members of every type |
| `strictFunctionTypes` | Unsound **contravariant** parameter checking on function types |
| `strictBindCallApply` | `fn.call(this, wrongArgs)` going unchecked |
| `strictPropertyInitialization` | Class fields never assigned in the constructor |
| `noImplicitThis` | `this` being implicitly `any` in a standalone function |
| `alwaysStrict` | Emitting `"use strict"` and parsing in strict mode |
| `useUnknownInCatchVariables` | `catch (e)` where `e` was `any` — now `unknown` |

Being able to list these — and knowing there are eight — is a small thing that
sounds like a lot of experience.

## The valuable flags `strict` does NOT include

This is the more useful half of the answer.

| Flag | Why you want it |
|---|---|
| `noUncheckedIndexedAccess` | `arr[0]` becomes `T \| undefined` (see 03/02) |
| `exactOptionalPropertyTypes` | Absent ≠ present-and-undefined (see 03/03) |
| `noImplicitOverride` | `override` must be written; renaming a base method then breaks loudly |
| `noFallthroughCasesInSwitch` | A missing `break` becomes a compile error |
| `noUnusedLocals` / `noUnusedParameters` | Dead code; better handled by lint rules with autofix |
| `noPropertyAccessFromIndexSignature` | Forces `obj["key"]` for index signatures, so typos in dotted access are caught |

Why are they excluded? `strict` is curated to be **adoptable**. Flags that light
up a large amount of correct-in-practice code — every bounded loop, every JSX
optional prop — are kept opt-in so that upgrading TypeScript never becomes a
migration project. That reasoning is worth being able to state.

## Why each line of the recommended config

### `target: "ES2022"`

Determines both the JS output level and which lib types are available. ES2022
gives you `Array.prototype.at`, `Object.hasOwn`, error `cause`, and class fields
natively. Going lower means downlevelling for browsers nobody supports any more.

### `module: "ESNext"` + `moduleResolution: "bundler"`

`bundler` (TS 5.0+) matches how Vite, esbuild, webpack and friends actually
resolve: extensionless relative imports work, and `package.json` `exports` is
honoured. Use `"nodenext"` instead when Node itself resolves your imports —
that mode is stricter and requires explicit `.js` extensions.

### `strict: true` plus the four extras

Covered above. These five lines are the actual type-safety content of the file.

### `verbatimModuleSyntax: true`

Imports are emitted **exactly** as written. `import type { X }` is erased;
`import { X }` is kept. This kills a whole class of bug where a type-only import
was elided, and a module with side effects silently stopped being loaded. It
also forces the `import type` discipline that makes bundlers' lives easy.

### `isolatedModules: true`

Guarantees every file can be transpiled **on its own**, without type
information. That is exactly what esbuild, swc and Babel do, so this flag makes
the compiler reject the constructs they cannot handle (re-exporting a type
without `export type`, `const enum`, and so on). Non-negotiable with any modern
build tool.

### `skipLibCheck: true`

Skips type-checking `.d.ts` files, mostly in `node_modules`. Nearly everyone
enables it, and it is worth knowing the trade: you lose detection of genuine
conflicts between two libraries' type definitions, and you gain a large build
speedup and immunity to one dependency shipping broken types. Practical, not
free.

### `forceConsistentCasingInFileNames: true`

`import "./User"` vs `./user` works on Windows and macOS and fails on Linux CI.
Default `true` since TS 5.0, but stating it explicitly costs nothing.

## `as const satisfies T` — the idiom in TODO 1

Three ways to write that array, and only one is right:

```ts
const A: readonly CompilerFlag[] = ["noImplicitAny", …];
// checked, but element type is widened to the full CompilerFlag union

const B = ["noImplicitAny", …] as const;
// narrow literal tuple, but a typo like "noImplicitAnyy" compiles fine

const C = ["noImplicitAny", …] as const satisfies readonly CompilerFlag[];
// narrow literal tuple AND every entry verified
```

`satisfies` (TS 4.9+) checks a value against a type **without changing the
inferred type**. It is the answer to "I want this checked but I also want the
narrow inference", which is a surprisingly common need. Section 10 goes deeper.

## `Record<Problem, CompilerFlag>` beats a `switch`

```ts
const diagnosis: Record<Problem, CompilerFlag> = { … };
return diagnosis[problem];
```

Add a member to `Problem` and the object literal fails to compile because a key
is missing — the same exhaustiveness guarantee as `assertNever`, with less
ceremony and no runtime `throw`. Use the switch form when branches need logic;
use the record when they are a pure mapping.

## Common mistakes

| Mistake | What happens |
|---|---|
| Including `noUncheckedIndexedAccess` in the strict list | It is not in `strict` — the runtime test fails |
| Forgetting `useUnknownInCatchVariables` | Only seven flags; it is the one people miss |
| `const X: readonly CompilerFlag[] = [...]` | Element type widens; `_flagsNotWidened` fails |
| `STRICT_IMPLIED_FLAGS.includes(flag)` | Does not compile against a literal tuple |
| Adding extra keys to the config object | `toEqual` is exact — extras fail |

## Interview angle

> *"Walk me through your tsconfig."*

Structure the answer in three groups rather than reciting keys: **output**
(target/module/moduleResolution), **safety** (strict plus the four it misses),
**build compatibility** (isolatedModules, verbatimModuleSyntax). Then name one
trade-off you accepted — `skipLibCheck` is the honest example.

> *"A junior turns on `strict` and gets 2,000 errors. What do you tell them?"*

Not "fix them all". Enable the sub-flags one at a time — `noImplicitAny` first,
then `strictNullChecks` (which will be 80% of the errors) — and land each as its
own PR. This answer shows migration judgement, which is what the question is
really testing.
