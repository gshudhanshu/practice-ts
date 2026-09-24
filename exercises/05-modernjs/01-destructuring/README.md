# 05/01 — Destructuring & default values

**Tier:** Drill · **Time:** ~15 min · **Course section:** 05 — Modern JavaScript

---

## Why this exercise exists

You already know destructuring syntax. What is worth drilling is where the
**types** land — especially the three-way difference between destructuring a
tuple, an array, and an object with defaults.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `greet` — destructure in the **parameter list**, defaulting `title` to `"friend"` inside the pattern. |
| 2 | `swap(["a", 1])` → `[1, "a"]`. |
| 3 | `headAndRest` — array destructuring with a **rest element**. |
| 4 | `toCoordinateLabel({x: 3, y: 4})` → `"lat 4, lon 3"`, using **renaming**. |
| 5 | `locationOf` — **nested** destructuring with defaults at both levels. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.
- In TODO 1 and 5 the defaults must live in the destructuring pattern, not as
  `??` in the body.

## Done when

```bash
npm run check 05/01
```

<details>
<summary>Hint 1 — defaults in a parameter pattern</summary>

```ts
function f({ a, b = "fallback" }: { a: string; b?: string }) { … }
```

The default fires when the property is absent **or** explicitly `undefined`, and
`b` is plain `string` inside the body.
</details>

<details>
<summary>Hint 2 — renaming is not annotating</summary>

`{ x: longitude }` means "read property `x`, bind it to a local named
`longitude`". The colon here is *renaming*, not a type annotation — a genuinely
common source of confusion, since the same punctuation means the opposite thing
one line down in the type.
</details>

<details>
<summary>Hint 3 — nested defaults need a default for the parent too</summary>

If `address` itself can be missing, destructuring into it will throw. Give the
whole object a fallback, and then its members their own:

```ts
{ address: { city = "unknown" } = {} }
```

Read it inside-out: default `address` to `{}`, then destructure `city` out of
whatever you ended up with, defaulting that too.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
tuple vs array destructuring under `noUncheckedIndexedAccess`, and when a default
fires versus when `??` would.
