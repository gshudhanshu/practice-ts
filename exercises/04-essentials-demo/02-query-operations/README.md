# 04/02 — Query operations

**Tier:** Core · **Time:** ~25 min · **Course section:** 04 — Essentials demo

---

## Where this fits

Part 2 of the expense tracker. The domain types from [04/01](../01-model-the-domain/README.md)
are given to you at the top of `exercise.ts`, so you can do this without having
finished part 1.

The theme: **working with a well-modelled domain**. Notice how little defensive
code these functions need.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `totalCents` — sum of all amounts, `0` when empty. |
| 2 | `byCategory` — filter, order preserved. |
| 3 | `inDateRange` — **inclusive** of both bounds. No `new Date()` needed. |
| 4 | `largest` — biggest expense, or `undefined`; **first** one wins a tie. |
| 5 | `createExpense` — validate a draft into an `Expense`, or `null`. |

### `createExpense` rules

- `description` non-blank, stored **trimmed**
- `amountCents` an integer and `>= 0` (`0` is valid; `3.5` and `NaN` are not)
- `category` must be one of `CATEGORIES`
- `date` must match exactly `YYYY-MM-DD`
- `note` trimmed if given; if blank or absent, the key must be **genuinely
  absent** (`exactOptionalPropertyTypes` is on)

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.

## Done when

```bash
npm run check 04/02
```

<details>
<summary>Hint 1 — TODO 3 without Date objects</summary>

`"2026-01-05" < "2026-02-03"` is `true`. Fixed-width, zero-padded, most
significant field first — so string order *is* date order. Two comparisons and
a `filter` finish this.

An inverted range (`from > to`) then returns `[]` for free, with no special case.
</details>

<details>
<summary>Hint 2 — TODO 4 and the tie-break</summary>

Track the winner in a local starting at `undefined`, and replace it only on
**strictly** greater. `>=` would keep the last tied item instead of the first.
</details>

<details>
<summary>Hint 3 — validating the number</summary>

`Number.isInteger` returns `false` for `NaN`, `Infinity` and `3.5`. One call
covers three of the bad cases; you only need to add the `>= 0` check.
</details>

<details>
<summary>Hint 4 — the optional note</summary>

Build the `Expense` **without** `note`, then attach it only when you have a
non-blank trimmed string. Writing `note: undefined` is a compile error here, and
would also make `"note" in expense` true — which the test checks.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md), then move
on to [04/03](../03-reporting/README.md).
