# 18/03 — Typing hooks

**Tier:** Core · **Time:** ~30 min · **Course section:** 18 — React + TypeScript

---

## Why this exercise exists

A custom hook is a plain function. Take the `useState` call out of it and what
remains is pure logic — testable with no renderer, and where all the interesting
typing lives.

Three things bite people, in roughly this order:

1. **`SetStateAction<S>` does not narrow the obvious way.** It is
   `S | ((prev: S) => S)`, and

   ```ts
   if (typeof action === "function") return action(previous);   // does not compile
   ```

   because when `S` is generic TypeScript narrows to
   `((prev: S) => S) | (S & Function)` and the second half has no call
   signature. It is *right*: `S` could itself be a function type. That is also
   why React tells you to write `setState(() => fn)` to store a function.

2. **A hook that returns a tuple must say so.** `return [value, toggle]` infers
   `(boolean | (() => void))[]`, and then `const [open, toggle] = useToggle()`
   gives both names that union.

3. **The callbacks a hook accepts are its API.** Type them in terms of the
   hook's type parameter or the caller gets `unknown`.

React itself is not installed and nothing here renders. Where the spec needs
React's real types it reaches them through `import type { useState } from "react"`
plus `declare const useStateRef: typeof useState` — a type-only import, no
runtime import at all — so your hand-written types are checked against the
genuine article.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `applySetState` — the pure core of a setter; narrow `SetStateAction<S>`. |
| 2 | `SelectionApi<T>` — the readonly tuple a `useSelection` hook returns. |
| 3 | `makeToggleApi` — inferred return type must be a tuple, not an array. |
| 4 | `ListOptions<T>` — dependency-injected `onAdd`, `compare`, `limit`. |
| 5 | `addItem` — pure, non-mutating, sorts then limits, notifies once. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`. `as const` is fine and TODO 3 wants it.
- Type-only imports from `react`.

## Done when

```bash
npm run check 18/03
```

<details>
<summary>Hint 1 — narrowing SetStateAction</summary>

A user-defined type predicate (02/03) states the intent that `typeof` cannot:

```ts
const isUpdater = <S,>(action: SetStateAction<S>): action is (prev: S) => S =>
  typeof action === "function";
```

The `<S,>` trailing comma is only there because a bare `<S>` in a `.tsx` file
would be parsed as JSX. In a `.ts` file either spelling works — write it with
the comma out of habit.
</details>

<details>
<summary>Hint 2 — tuple, not array</summary>

```ts
return [value, toggle] as const;      // readonly [boolean, () => void]
return [value, toggle];               // (boolean | (() => void))[]
```

Annotating the return type explicitly is the other way to do it, and is what
you want when the tuple type has a name worth reusing (TODO 2).
</details>

<details>
<summary>Hint 3 — the updater form in TODO 3</summary>

```ts
setValue((current) => !current);
```

not `setValue(!value)`. `value` is the value this render closed over, so two
toggles in one React batch would both compute from the same stale boolean and
produce a single flip. The test proves the updater by running it from both
`false` and `true`.
</details>

<details>
<summary>Hint 4 — TODO 5, in order</summary>

Copy, sort the copy, slice the copy, then notify:

```ts
const next = [...items, item];
if (compare !== undefined) next.sort(compare);
```

`limit === undefined`, not `!limit` — one test passes `limit: 0`. And `onAdd?.(item)`
calls the callback only when one was given.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
why `S & Function` is not callable, when `useState` needs a type argument, and
the `as const` versus explicit-annotation choice for hook return values.

Next: [18/04 — generic & polymorphic components](../04-generic-and-polymorphic-components/).
