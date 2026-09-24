# 04/01 — Model the domain

**Tier:** Core · **Time:** ~20 min · **Course section:** 04 — Essentials demo

---

## The project

Section 04 is one small project — an **expense tracker** — built across three
exercises:

1. **04/01 (this one)** — model the domain. Pure types.
2. **04/02** — query operations: totals, filters, validation.
3. **04/03** — reporting: aggregation, sorting, formatting.

Parts 2 and 3 hand you the finished types, so you can do them out of order. But
doing this one first is the point: **good types make the next two easy.** That
is the actual lesson of the section.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `CATEGORIES` — `food`, `transport`, `housing`, `entertainment`, `other` — with `Category` derived from it. |
| 2 | `Payment` — a discriminated union on `method`: `cash` (no data), `card` (`last4`), `transfer` (`reference`). |
| 3 | `Expense` — `id`, `description`, `amountCents`, `category`, `date`, `payment`, optional `note`. |
| 4 | `isCategory` — a type predicate checked against `CATEGORIES`. |
| 5 | `describePayment` — exhaustive `switch` plus `assertNever` in `default`. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as` (except `as const`), no `!`.
- Do not write the five category strings twice.

## Done when

```bash
npm run check 04/01
```

## Two modelling decisions worth noticing

**Money is `amountCents: number`, an integer.** Not `amount: 12.50`. Binary
floating point cannot represent `0.1` exactly, so `0.1 + 0.2 !== 0.3`. Every
payment system in the world stores minor units as integers.

**Dates are ISO `"YYYY-MM-DD"` strings.** Not `Date`. Fixed-width ISO strings
sort chronologically as plain strings, carry no timezone, and survive JSON
round-trips unchanged — all of which 04/02 and 04/03 rely on.

<details>
<summary>Hint 1 — the category pattern</summary>

Straight from 02/03: `as const` on the array, then
`type Category = (typeof CATEGORIES)[number]`.
</details>

<details>
<summary>Hint 2 — cash has no extra data</summary>

`{ method: "cash" }` is a complete member. A union member does not need extra
properties — that is precisely what makes `last4` impossible to read on a cash
payment.
</details>

<details>
<summary>Hint 3 — assertNever's parameter</summary>

Its parameter type is `never`, not `unknown`. With `unknown` it accepts anything
and the exhaustiveness check silently stops working.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md), then move
on to [04/02](../02-query-operations/README.md).
