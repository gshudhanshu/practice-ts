# 14/02 — `import type` and `verbatimModuleSyntax`

**Tier:** Core · **Time:** ~25 min · **Course section:** 14 — Modules & namespaces

---

## Why this exercise exists

An import does two things at once: it binds a name, and it makes a module
**run**. The second half is invisible in the source, which is why it is where
the bugs are.

The modules beside this one each announce themselves when they are evaluated,
so the tests do not only check your types — they check which modules your
imports actually loaded:

```
registry.ts    the recorder — `loaded` lists whatever ran
telemetry.ts   exports a TYPE only, and must never run
audit.ts       exports NOTHING, and must run
formatter.ts   a type and a value together
codec.ts       a class — a type and a value under one name
```

### The flag

Every exercise in section 14 sets `verbatimModuleSyntax` in its own
`tsconfig.json`. It means what it says: TypeScript emits your import and export
statements **exactly as written**, minus anything marked `type`. No guessing, no
elision — and therefore it insists you say `type` when you mean it.

Without it, the compiler decides for you: an import whose bindings are only used
in type positions is deleted, and the module it named never runs. That is
convenient right up to the moment the module was doing something.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | Import `TelemetryEvent` so `./telemetry` never runs. Delete the placeholder. |
| 2 | Make `./audit` run, even though it exports nothing. |
| 3 | One import statement for `./formatter`'s type **and** value. Delete the placeholder. |
| 4 | Import `Codec` so it works in both type and value position. |
| 5 | Re-export `TelemetryEvent`, `Format` and `Codec` — two of them type-only. |

## Rules

- Do not edit `exercise.test.ts` or any of the neighbouring modules.
- No `any`, no `as`, no `!`.
- Do not change `tsconfig.json`.
- TODO 3 must be **one** statement, not a value import plus a type import.
- Exactly three modules may end up in `loaded`, and `telemetry` is not one of
  them.

## Done when

```bash
npm run check 14/02
```

<details>
<summary>Hint 1 — the four import forms this exercise needs</summary>

```ts
import type { T } from "./m";          // erased whole: ./m never runs
import "./m";                          // run ./m, bind nothing
import { value, type T } from "./m";   // keeps `value`, erases `T`
import { C } from "./m";               // a class: type AND value
```

Each TODO is one of these, in order.
</details>

<details>
<summary>Hint 2 — why the placeholder types have to go</summary>

They exist so the starter compiles. Leaving one in place and adding the import
gives you a duplicate-identifier error, which is the compiler telling you the
same thing the TODO does.
</details>

<details>
<summary>Hint 3 — the export side is the same problem</summary>

```ts
export { TelemetryEvent } from "./telemetry";       // emits a real re-export
export type { TelemetryEvent } from "./telemetry";  // erased
```

Under `verbatimModuleSyntax` the first one is an error — and if it were not, it
would load `./telemetry` and break the "telemetry never runs" test from an
*export* line. Getting caught by that once is the point of TODO 5.
</details>

<details>
<summary>Hint 4 — a class is not a type</summary>

It is both, which is why `import type` on one is a trap:

```ts
import type { Codec } from "./codec";
const c: Codec = new Codec("|");
//                   ^ 'Codec' cannot be used as a value because it was
//                     imported using 'import type'.
```

The annotation compiles; the construction does not.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
the elision bug this flag prevents, why `isolatedModules` alone is not enough,
and what happens when a bundler and `tsc` disagree — then move on to
[14/03](../03-declaration-merging-and-augmentation/README.md).
