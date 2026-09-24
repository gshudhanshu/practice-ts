# 15/01 — isolatedModules: code a bundler can transpile

**Tier:** Core · **Time:** ~25 min · **Course section:** 15 — Build tools & Vite

---

## Why this exercise exists

Vite does not type-check your code. Neither does esbuild, swc or Babel. They
**transpile one file at a time**, with no knowledge of any other file in the
project — that is why they are two orders of magnitude faster than `tsc`.

Everything in this exercise follows from one question:

> Could a tool that has only ever seen **this file** emit correct JavaScript
> for this line?

`isolatedModules: true` makes `tsc` reject the cases where the answer is no —
and the interesting half is the cases it *cannot* see, which compile fine and
break in the bundle.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | Fix the import, re-export `Shape` as a type, implement `summarise` |
| 2 | `DIRECTION` + `Direction` — the const-enum replacement |
| 3 | `diagnose` — build failure → the construct that caused it |
| 4 | `flaggedByTheCompiler` — does tsc stop you, or does production? |
| 5 | `emitsAnImport` — which import forms survive into the emitted JS |

### TODO 3 — the mapping

| Problem | Meaning |
|---|---|
| `bundler-cannot-find-an-exported-name` | The bundle throws `does not provide an export named 'Shape'` |
| `enum-member-is-undefined-at-runtime` | A member of a dependency's enum reads as `undefined` |
| `enum-object-survives-into-the-bundle` | The enum you expected to vanish still ships an object |
| `half-the-namespace-members-vanished` | One namespace name, declared across two files |
| `require-is-not-defined-in-the-browser` | CommonJS syntax reached a browser bundle |

### TODO 5 — the five forms

Under `verbatimModuleSyntax`, imports are emitted **exactly as written**. Decide
for each form whether the emitted JavaScript still imports `"m"` — that is,
whether the module is still fetched and its side effects still run.

## Rules

- Do not edit `exercise.test.ts` or `shapes.ts`.
- `Direction` must be **derived** from `DIRECTION`, not typed out again.
- This exercise's `tsconfig.json` adds `verbatimModuleSyntax: true` on top of
  the repo defaults, so the import rules are enforced for real. The starter does
  **not** compile — that is the first thing to fix.

## Done when

```bash
npm run check 15/01
```

<details>
<summary>Hint 1 — the two import forms</summary>

`import type { X } from "m"` erases the whole statement. `import { X } from "m"`
keeps it. Under `verbatimModuleSyntax` you must say which you meant; the
compiler will not infer it, because a single-file transpiler could not.

Splitting the line in two is the clearest fix. The inline form
(`import { type Shape, area }`) also compiles — see TODO 5 for how it differs.
</details>

<details>
<summary>Hint 2 — re-exporting a type</summary>

`export { Shape } from "./shapes"` is TS1205. The re-export needs the same
type-only marker the import did: `export type { … } from "…"`.
</details>

<details>
<summary>Hint 3 — deriving the union</summary>

Same idiom as 02/03 and 10/01:

```ts
export const THING = { a: "a", b: "b" } as const;
export type Thing = (typeof THING)[keyof typeof THING];
```

`keyof typeof THING` is `"a" | "b"`; indexing with it gives the union of the
**values**. Without `as const` the values widen to `string` and the derived type
is useless.
</details>

<details>
<summary>Hint 4 — TODO 4, which three are errors</summary>

Two are errors the `isolatedModules` flag itself adds (TS1205 and TS2748). One
is rejected for a different reason entirely — CommonJS import/export syntax
cannot be emitted when `module` is `ESNext` (TS1202/TS1203). The remaining two
compile cleanly today and cost you an evening later.
</details>

<details>
<summary>Hint 5 — the surprising import form</summary>

Erasing a *name* and erasing a *statement* are different things. If the compiler
removes every name from an import list but the statement itself was never marked
type-only, what is left is still an import — and it still loads the module.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it shows
the actual emitted JavaScript for all five import forms, explains why `const
enum` is the one TypeScript feature nobody should use any more, and covers the
two failures `isolatedModules` cannot catch for you.

Next: [15/02 — module resolution](../02-module-resolution/).
