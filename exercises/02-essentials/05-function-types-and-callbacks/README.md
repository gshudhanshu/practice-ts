# 02/05 — Function types, callbacks, `void` and `never`

**Tier:** Core · **Time:** ~20 min · **Course section:** 02 — Essentials

---

## Scenario

Functions are values, and values have types. This exercise covers the four
things people most often get wrong about function types: reusable function type
aliases, rest and default parameters, what `void` really means on a *callback
parameter*, and the difference between `void` and `never`.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `Transformer` is the type `(value: number) => number`. |
| 2 | `applyAll([1, 2], double, increment)` → `[3, 5]` — transformers applied left to right, any number of them via a **rest parameter**. |
| 3 | `slugify("  Hello   World!  ")` → `"hello-world"`; second parameter is optional with a **default** of `"-"`. |
| 4 | `forEachIndexed` calls back with `(item, index)`. The callback must be declared `=> void` so callers may pass a function that returns something. |
| 5 | `fail` is typed as never-returning; `getOrFail` then narrows `string \| null` to `string` **with no cast and no `!`**. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.

## Done when

```bash
npm run check 02/05
```

<details>
<summary>Hint 1 — rest parameters</summary>

`...args: T[]` collects every remaining argument into an array. It must be the
last parameter. Inside `applyAll`, folding a list of functions over one starting
value is exactly what `reduce` is for.
</details>

<details>
<summary>Hint 2 — slugify without fiddly trimming</summary>

Instead of replacing bad characters and then stripping the ends, invert it:
**split** on runs of non-alphanumeric characters, drop the empty pieces, then
`join` with the separator. Leading and trailing junk disappears for free.

`/[^a-z0-9]+/` after `.toLowerCase()` is the split pattern.
</details>

<details>
<summary>Hint 3 — the callback that returns a value</summary>

The test passes a callback that returns a `string` and another that returns a
`number` (from `.push()`). Both must compile. There is exactly one return type
you can declare on the *parameter* that allows this — and it is not `unknown`
or `any`.
</details>

<details>
<summary>Hint 4 — TODO 5 keeps saying "Type 'string | null' is not assignable"</summary>

That means the compiler still thinks `fail(...)` might return normally. Ask
what return type describes a function that *never* hands control back — and
note it is not `void`.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
the `void`-return rule (a rule with a genuinely surprising justification),
`void` vs `never`, and why default parameters beat `| undefined`.
