# Understanding TypeScript — Exercises

Hands-on exercises for Maximilian Schwarzmüller's
[Understanding TypeScript](https://www.udemy.com/course/understanding-typescript/)
course, plus job-prep sections the course does not cover.

You are watching the videos but not typing along. That is fine — watching builds
recognition, and these build **recall**, which is what interviews and real work
actually test.

---

## How it works

Every exercise is a **problem statement with a failing spec**. You write code
until it goes green. Nothing here asks you to retype what Max typed.

Two things must pass, and they check different skills:

| Layer | Question it answers |
|---|---|
| **Runtime tests** (Vitest) | Does your code produce the right values? |
| **Compile-time assertions** (`Expect<Equal<A, B>>`) | Are your **types** actually right? |

A solution that returns correct values but has sloppy types still fails. That is
deliberate — the second layer is the half that TypeScript interviews probe
hardest, and the half you cannot practise by watching.

## Getting started

```bash
npm install
```

Then open the first exercise and read its `README.md`:

```
exercises/02-essentials/01-primitives-and-inference/README.md
```

Edit `exercise.ts` only. Check your work:

```bash
npm run check 02/01
```

Green means done. Then read `solution/EXPLANATION.md` — it covers *why*, the
mistakes people make, and the interview question the exercise is really about.

## Commands

| Command | What it does |
|---|---|
| `npm run check 02/01` | One exercise: typecheck + tests |
| `npm run check 02` | A whole section |
| `npm run check` | Everything (red until you have finished it all) |
| `npm run check 02/01 --types` | Typecheck only, skip the test runner |
| `npm run test:watch` | Vitest in watch mode |
| `npm run verify:solutions` | Proves every provided solution passes its own spec |
| `npm run check:inplace` | Proves each solution also passes via the real `check` path, then restores your starters |
| `npm run check:cheatsheet` | Typechecks all 53 code snippets in `CHEATSHEET.md` |
| `npm run audit` | Checks every exercise against `CONVENTIONS.md` (structure, banned constructs, docs) |

Section and exercise numbers are prefixes — `03/2` works as well as
`03/02-unchecked-indexed-access`.

## Layout

```
exercises/<section>/<exercise>/
├── README.md            the task, the rules, and collapsed hints
├── exercise.ts          ← you edit this
├── exercise.test.ts     the spec. Do not edit.
├── tsconfig.json        scoped so your editor checks one exercise at a time
└── solution/
    ├── solution.ts      a commented reference solution
    └── EXPLANATION.md   why, common mistakes, and the interview angle
```

## House rules

Each exercise repeats them, but in general:

- **Do not edit `exercise.test.ts`.** It is the specification.
- **No `any`, no `as`, no `!`.** Every exercise is solvable without them. `as
  const` is fine — a const assertion is a different thing entirely.
- Get stuck for 15 minutes, then open the hints. Get stuck for 30, read the
  solution — but re-solve it from scratch afterwards.

## This repo is deliberately stricter than the course

`tsconfig.base.json` turns on flags that are **not** part of `strict`:

```jsonc
"noUncheckedIndexedAccess": true,   // arr[0] is T | undefined
"exactOptionalPropertyTypes": true, // absent ≠ present-and-undefined
"noImplicitOverride": true,         // `override` is mandatory
"noFallthroughCasesInSwitch": true
```

This will surprise you early — `books[0]` is not a `Book`. That is the point:
these are the settings a well-run production codebase uses, and section 03 is
entirely about why.

Individual exercises may add their own options — section 12 needs
`experimentalDecorators`, section 16 needs `types: ["node"]`. Each exercise's
`tsconfig.json` is honoured by both `check` and `verify:solutions`.

## One piece of runtime infrastructure

`vitest.config.ts` carries a small `standard-decorators` plugin. Vitest
transforms TypeScript with Oxc, which implements **only** the legacy
(`experimentalDecorators`) decorator transform — standard TC39 decorator syntax
is passed straight through and V8 rejects it. The plugin routes any decorator-
bearing file whose nearest `tsconfig.json` does *not* set
`experimentalDecorators` through `tsc` first. It is a no-op for every other
file, and it is what makes sections 11 and 13 runnable.

---

## Roadmap

Sections mirror the folder names in the
[course resources repo](https://github.com/mschwarzmueller/understanding-typescript-resources).

### ✅ Phase 1 — available now (24 exercises)

| Section | Exercises | Focus |
|---|---|---|
| [02 — Essentials](exercises/02-essentials/) | 6 | Types, unions, narrowing, `unknown`, exhaustiveness |
| [03 — Compiler & tsconfig](exercises/03-tsconfig/) | 4 | The flags that matter, and why |
| [04 — Essentials demo](exercises/04-essentials-demo/) | 3 | Expense tracker: model → query → report |
| [05 — Modern JavaScript](exercises/05-modernjs/) | 5 | Destructuring, spread, `this`, nullish, pipelines |
| [06 — Classes & interfaces](exercises/06-classes-interfaces/) | 6 | OOP, abstract classes, interfaces, polymorphism |

### ✅ Phase 2 — available now (19 exercises)

| Section | Exercises | Focus |
|---|---|---|
| [07 — Advanced types](exercises/07-advanced-types/) | 5 | Intersections, index signatures, overloads, `satisfies`, `asserts` |
| [08 — Generics](exercises/08-generics/) | 5 | Constraints, generic classes, `const T`, `NoInfer`, typed event emitter |
| [09 — Classes & generics practice](exercises/09-classes-generics-practice/) | 3 | Collection → validators → validated table |
| [10 — Deriving types](exercises/10-deriving-types/) | 6 | `keyof`/`typeof`, mapped, conditional, template literal, typed deep paths |

### ✅ Phase 3 — available now (10 exercises)

| Section | Exercises | Focus |
|---|---|---|
| [11 — Decorators](exercises/11-decorators/) | 4 | Standard TC39 decorators: methods, fields, `accessor`, class decorators, factories |
| [12 — Experimental decorators](exercises/12-experimental-decorators/) | 3 | The legacy flavour Angular/NestJS still require, and migrating between them |
| [13 — Decorators practice](exercises/13-decorators-practice/) | 3 | Autobind, validation decorators, an observable model |
| [14 — Modules & namespaces](exercises/14-modules-namespaces/) | 4 | Import/export forms, `import type`, augmentation, barrels & cycles |

### ✅ Phase 4 — available now (17 exercises)

| Section | Exercises | Focus |
|---|---|---|
| [15 — Build tools](exercises/15-build-tools/) | 3 | `isolatedModules`, module resolution, configuring for a bundler |
| [16 — Libs & TypeScript](exercises/16-libs-and-ts/) | 4 | Writing `.d.ts`, augmenting library types, taming an untyped dependency |
| [17 — Libs practice](exercises/17-libs-practice/) | 3 | A typed client over an untyped module, validation boundary, caching + retry |
| [18 — React & TypeScript](exercises/18-react-ts/) | 5 | Props, discriminated-union props, hooks, generic/polymorphic components, typed reducer |
| [19 — Node & TypeScript](exercises/19-node-ts/) | 5 | Middleware, request augmentation, typed handlers, async errors, a typed router |

### ✅ Phase 5 — available now (17 exercises)

The gap between "finished a course" and "passes a TypeScript interview".

| Section | Exercises | Focus |
|---|---|---|
| [20 — Utility types from scratch](exercises/20-utility-types-from-scratch/) | 6 | Rebuild `Partial`/`Pick`/`Omit`/`ReturnType`/`Awaited` by hand, and beat them |
| [21 — Type challenges](exercises/21-type-challenges/) | 6 | Tuples, union tricks, string types, type-level arithmetic, a mini parser |
| [22 — Real-world patterns](exercises/22-real-world-patterns/) | 5 | Branded types, `Result<T, E>`, state machines, typed API client, a domain layer |

---

**94 exercises · 1,153 assertions · 21 sections.** Every solution is verified
against its own spec, every starter is verified to fail, and every exercise is
audited against [`CONVENTIONS.md`](CONVENTIONS.md).

## Reference

**[`CHEATSHEET.md`](CHEATSHEET.md)** covers the **whole language**, not just the
exercises built so far — a quick-reference layer of syntax tables followed by
detailed sections with worked examples. Topics with no exercises yet are marked
*Phase 2/3/5*, so it is usable as a standalone reference while you watch the
course.

Every one of its 53 code snippets is compiled under this repo's strict config by
`npm run check:cheatsheet`, so nothing in it is pseudo-code that does not
actually work.

- [`src/type-testing.ts`](src/type-testing.ts) — the compile-time assertion helpers
- [devsheets.io/sheets/typescript](https://devsheets.io/sheets/typescript) — external cheat sheet
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) — the official reference
# practice-ts
