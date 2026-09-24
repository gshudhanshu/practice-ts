# 14/01 — Import & export forms

**Tier:** Drill → Core · **Time:** ~20 min · **Course section:** 14 — Modules & namespaces

---

## Why this exercise exists

Every import form exists for a reason, and picking the wrong one has costs you
only notice later — a name you cannot grep for, a barrel that drags a hundred
modules into a test, a default that quietly refuses to be re-exported.

This exercise is the whole surface, against three real neighbouring modules in
this directory:

```
shapes.ts   named exports — values and types
format.ts   a default export plus a named one
units.ts    constants only, used as a namespace
```

`exercise.ts` plays two roles at once: it is the module under test, and it is
the **barrel** that re-exports the other three.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | Named import — `summarise(shape)` uses `area` and `perimeter`. |
| 2 | Default import — `label(value, unit)` uses `./format`'s default. |
| 3 | Namespace import — `UnitName`, `unitNames()`, `toMetres(value, unit)`. |
| 4 | Re-export `area`/`perimeter`, the three types, and `./format`'s default as `formatLength`. |
| 5 | `export * from "./units"`, plus `PRECISION` re-exported as `FORMAT_PRECISION`. |

### The trap in TODO 5

`export *` forwards every **named** export and no default. That is why TODO 4
has to name `./format`'s default explicitly — and a test asserts the barrel has
no `default` key.

## Rules

- Do not edit `exercise.test.ts`, `shapes.ts`, `format.ts` or `units.ts`.
- No `any`, no `as`, no `!`.
- `UnitName` must be **derived** from the namespace, not hand-written.
- TODO 4 must use the `export … from` form — do not import a name just to
  export it again.

## Done when

```bash
npm run check 14/01
```

<details>
<summary>Hint 1 — a namespace import is an object, and its type is useful</summary>

```ts
import * as units from "./units";
```

`units` is one object with a key per named export, so `Object.keys(units)` is
the export list at runtime — and `keyof typeof units` is the same list at
compile time (10/01):

```ts
export type UnitName = keyof typeof units;   // "mm" | "cm" | "m" | "km"
```

Indexing with that union is not an index signature, so
`noUncheckedIndexedAccess` does not add `| undefined`.
</details>

<details>
<summary>Hint 2 — re-export without importing</summary>

```ts
import { area } from "./shapes";
export { area };            // works, but `area` is now a local binding
export { area } from "./shapes";   // forwards it; nothing enters this scope
```

The second form is what a barrel wants: no local bindings means no unused
imports, and the bundler can see straight through to the source module.
</details>

<details>
<summary>Hint 3 — types need <code>export type</code></summary>

```ts
export type { Circle, Rect, Shape } from "./shapes";
```

Under `isolatedModules` (and `verbatimModuleSyntax`, on for this section) each
file is transpiled on its own. The emitter never looks inside `./shapes`, so it
cannot know whether `Circle` is a type or a value — you have to say. 14/02 is
entirely about this.
</details>

<details>
<summary>Hint 4 — a default has no name</summary>

That is the whole difficulty with default exports. Importing one means inventing
a local name, and re-exporting one means the same:

```ts
export { default as formatLength } from "./format";
```

`export * from "./format"` will not do it, no matter how much it looks like it
should.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
when a barrel is worth it and when it is a liability — then move on to
[14/02](../02-import-type-and-verbatim/README.md).
