# 04/03 — CHALLENGE: reporting

**Tier:** Challenge · **Time:** ~35 min · **Course section:** 04 — Essentials demo

---

## Where this fits

Part 3 of the expense tracker, and the section's boss fight. The domain types
are given; the work is aggregation, multi-key sorting, and exact output
formatting. Each TODO builds on the previous one — do them in order.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `formatCents(1250)` → `"12.50"` |
| 2 | `percentageOf(4500, 11000)` → `40.9` (one decimal). `whole = 0` → `0`, never `NaN`/`Infinity`. |
| 3 | `summarizeByCategory` — one row per **present** category, sorted by total **desc**, ties by category name **asc**. |
| 4 | `monthlyTotals` — totals per `"YYYY-MM"`, sorted ascending. |
| 5 | `formatReport` — the exact text below. |

### The report format

```
Total: 110.00
housing: 45.00 (40.9%, 1 item)
transport: 45.00 (40.9%, 1 item)
food: 20.00 (18.2%, 2 items)
```

- First line is always the grand total.
- Category lines follow in the order from TODO 3.
- `item` vs `items` is singular/plural on the count.
- Lines joined with `"\n"`.
- An empty ledger produces exactly `"Total: 0.00"` and nothing else.

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.

## Done when

```bash
npm run check 04/03
```

<details>
<summary>Hint 1 — rounding to one decimal place</summary>

`Math.round(x * 100) / 100` gives two decimals. Work out the multiplier for
one, remembering you are also converting a ratio to a percentage. Scaling by
`1000` and dividing by `10` does both at once.
</details>

<details>
<summary>Hint 2 — sorting on two keys</summary>

A comparator returns a negative number, zero, or a positive number. Zero means
"equal, defer to the next rule", so you can chain with `||`:

```ts
rows.sort((a, b) => primary(a, b) || secondary(a, b));
```

That works precisely because `0` is the only falsy value a comparator returns.
</details>

<details>
<summary>Hint 3 — grouping</summary>

A `Map` keyed by category (or month) keeps insertion order and gives you an
honest `V | undefined` from `.get`. Accumulate first, convert to an array
second, sort last. Trying to do all three at once is where this gets messy.
</details>

<details>
<summary>Hint 4 — categories with no expenses</summary>

Do not iterate `CATEGORIES` to build the rows — that would produce five rows
every time. Iterate the **expenses**, so only categories that actually occur
become keys.
</details>

<details>
<summary>Hint 5 — the month key</summary>

`"2026-01-20".slice(0, 7)` is `"2026-01"`. And `"YYYY-MM"` sorts
chronologically as a plain string, for the same reason full ISO dates do.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
comparator chaining, `Map` vs plain object for grouping, and why `localeCompare`
is a trap in sort keys.

**That completes the expense tracker.** Next up: [section 05 — modern JavaScript](../../05-modernjs/).
