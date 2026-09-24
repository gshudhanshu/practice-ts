# Exercise authoring conventions

**Read this fully before writing anything.** Every exercise in this repo follows
it exactly. Deviating makes the suite inconsistent and will fail review.

Look at [`exercises/08-generics/02-constraints/`](exercises/08-generics/02-constraints/)
and [`exercises/10-deriving-types/04-conditional-types/`](exercises/10-deriving-types/04-conditional-types/)
as reference implementations before you start.

---

## 1. Directory layout

```
exercises/<NN>-<section-slug>/
├── README.md                       section index (one per section)
└── <NN>-<exercise-slug>/
    ├── README.md                   task, rules, collapsed hints
    ├── exercise.ts                 ← the learner edits this
    ├── exercise.test.ts            the spec. Learner must NOT edit.
    ├── tsconfig.json               see below
    │                               { "extends": "../../../tsconfig.base.json",
    │                                 "include": ["."], "exclude": ["solution"] }
    └── solution/
        ├── solution.ts             commented reference solution
        └── EXPLANATION.md          why / mistakes / interview angle
```

Numbering starts at `01` within each section. Slugs are lowercase-kebab.

Extra helper modules in the exercise directory are allowed (the verifier copies
the whole directory). Fixtures shared with the test go in the exercise dir, not
in `solution/`.

**`"exclude": ["solution"]` is mandatory.** `npm run check` typechecks the whole
exercise folder, so without it the learner sees errors from the reference
solution — a file they did not write. It also genuinely breaks any exercise with
helper modules: `solution/solution.ts` importing `./shapes` cannot resolve,
because the helper sits one level up. `verify:solutions` still typechecks every
solution, so nothing is lost.

## 2. The two-layer spec

Every `exercise.test.ts` has **both**:

```ts
import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import { thing } from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _returns = Expect<Equal<ReturnType<typeof thing>, string | null>>;

function _compileTimeOnly(): void {
  // @ts-expect-error — explain why this must not compile
  thing(123);
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("thing", () => {
  it("does the thing", () => {
    expect(thing("a")).toBe("A");
  });
});
```

A solution that returns correct values but has sloppy types **must** fail.

## 3. Hard-won rules — violating these breaks the suite

These were each discovered by a real bug in this repo. Do not rediscover them.

1. **`@ts-expect-error` silences the compiler but the statement STILL RUNS.**
   Put every negative assertion inside a function that is never called
   (`function _compileTimeOnly(): void { … }`). A `push` onto a `readonly` array
   at module scope really mutates it.

2. **Never call exercise functions at module or `describe()` scope.** The
   starter throws, which kills test *collection* and hides every other failure.
   Build fixtures lazily inside `it()`, or behind a factory function.

3. **A call to a `never`-returning function makes the rest of the block
   unreachable**, and narrowing is not computed there. Keep `assertNever`-style
   probes in their own uncalled function.

4. **`ReturnType<F>` is `any` when `F` has a `never` parameter.** Compare the
   whole signature instead: `Expect<Equal<typeof f, (v: never) => never>>`.

5. **`typeof x.prop` in *type* position ignores narrowing.** Read into a local
   first: `const v = x.prop; type _ = Expect<Equal<typeof v, T>>;`

6. **Deferred conditional types cannot be checked inside a generic function.**
   `function f<T>(): SomeConditional<T>` will not accept a return value. Use an
   indexed access, or permit one documented cast (see rule 8).

7. **An empty array literal infers `never`** when combined with `NoInfer` or a
   `const` type parameter. Annotate the fixture.

8. **`any`, `as` and `!` are banned in solutions.** `as const` is fine. If an
   exercise genuinely cannot be solved without one cast (heterogeneous stores,
   deferred conditionals), that is allowed **once**, must be commented
   explaining why, and the exercise README must say so explicitly.

## 4. Strict settings you are writing against

`tsconfig.base.json` enables, beyond `strict`:

- `noUncheckedIndexedAccess` — `arr[0]` is `T | undefined`, `record[k]` too
- `exactOptionalPropertyTypes` — `{a?: string}` may not hold an explicit `undefined`
- `noImplicitOverride` — `override` is mandatory on concrete overrides
- `noFallthroughCasesInSwitch`, `isolatedModules`, `verbatimModuleSyntax`

If your section needs different options (e.g. `experimentalDecorators`), write
them into that exercise's own `tsconfig.json` — the verifier honours it.

## 5. Difficulty tiers

Each section runs **Drill → Core → Challenge**, ending on one Challenge.

| Tier | Time | Shape |
|---|---|---|
| Drill | 10–15 min | mechanical, cements syntax |
| Core | 20–30 min | a realistic mini-feature |
| Challenge | 30–45 min | interview-grade; combines the section |

Aim for **5 numbered TODOs per exercise**, each independently testable.

## 6. Writing style

- **exercise.ts** — a file header explaining the concept and why it matters,
  then `// ─── TODO n ───` blocks with concrete examples of expected input →
  output. Starters compile where possible; bodies `throw new Error("TODO n: …")`.
- **README.md** — scenario, a requirements table, Rules, "Done when"
  (`npm run check NN/MM`), then 3–5 `<details><summary>Hint n</summary>` blocks
  that guide without giving the answer.
- **EXPLANATION.md** — why each answer is what it is, a **Common mistakes**
  table, and an **Interview angle** section with 2 real questions and how to
  answer them well.
- Prose is British-English, direct, no filler. Explain the *why*, and name the
  trade-off. Never claim something is verified unless you ran it.

## 7. Verifying your work — mandatory

All three of these must hold before you report done:

```bash
npm run verify:solutions NN          # every solution passes: MUST be green
npm run check:inplace NN             # solutions ALSO pass in place: MUST be green
npm run check NN                     # starters: MUST be red
```

`check:inplace` is the one that catches what the others cannot: it pastes each
solution into `exercise.ts` and runs the real `npm run check` path, with the
exercise's own tsconfig and its sibling modules resolving in place. Seven
exercises shipped broken on exactly that path before it existed.

`verify:solutions` is safe to run concurrently with other agents.

Also confirm no test file dies at collection time — a `FAIL` line ending in
`[ …exercise.test.ts ]` means rule 2 was violated.

Do **not** run `npm install`; dependencies are already in place
(`typescript`, `vitest`, `@types/node`, `@types/react`, `@types/express`).

## 8. No duplication

Check what already exists before choosing topics. Sections 02–10 already cover:
basic types, narrowing, discriminated unions, `unknown`/`never`, tsconfig flags,
destructuring/spread/`this`, array pipelines, classes, interfaces, intersections,
index signatures, overloads, `as`/`satisfies`, assertion functions, generics,
constraints, generic classes, `NoInfer`, `keyof`/`typeof`, indexed access,
mapped types, conditional types, template literal types.

Re-*applying* an earlier concept in a new context is good. Re-*teaching* it is
duplication — cross-link to the earlier exercise instead.
