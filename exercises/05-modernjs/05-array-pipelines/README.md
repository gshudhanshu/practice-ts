# 05/05 — CHALLENGE: array pipelines

**Tier:** Challenge · **Time:** ~30 min · **Course section:** 05 — Modern JavaScript

---

## Why this exercise exists

`map` / `filter` / `reduce` / `flatMap` composed into real reporting queries.
Every shape here is something you will write in your first week of a real job,
and "walk me through this data transformation" is a standard interview task.

The business rule to keep in mind: **cancelled orders never count** — not
towards revenue, quantities, or customer totals.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `activeOrders` — everything not cancelled, original order preserved. |
| 2 | `totalRevenue` — sum across active orders; `0` when there are none. |
| 3 | `skuQuantities` — total qty per SKU across active orders → `{ A: 3, B: 1, C: 3 }`. |
| 4 | `topCustomers(orders, limit)` — biggest spenders, total **desc**, ties by name **asc**, capped at `limit`. |
| 5 | `averageOrderValue` — mean order value rounded to a whole cent; `0`, not `NaN`, when empty. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.
- **No mutation of the input.** No `.sort()` or `.reverse()` on an array you
  were given — both mutate in place.

## Done when

```bash
npm run check 05/05
```

<details>
<summary>Hint 1 — write the rule once</summary>

TODOs 2–5 all need "active orders only". Call `activeOrders` from each of them
rather than repeating the `status !== "cancelled"` check five times. When the
rule changes, it should change in one place.
</details>

<details>
<summary>Hint 2 — items are nested one level down</summary>

`orders.map(o => o.items)` gives you `OrderItem[][]`. There is a single method
that maps **and** flattens one level, so you get `OrderItem[]` directly.
</details>

<details>
<summary>Hint 3 — the shape of TODO 4</summary>

Three separate phases, in this order:

1. **accumulate** into a `Map<string, number>` keyed by customer
2. **transform** into `{ customer, totalCents }` rows
3. **sort**, then **slice**

Trying to do them at once is where this gets tangled. `.slice(0, limit)` past
the end is safe — it just returns everything available.
</details>

<details>
<summary>Hint 4 — the mutation trap</summary>

`.sort()` and `.reverse()` mutate the array they are called on. Safe here
because `.map()` already produced a fresh array — but calling `orders.sort(…)`
directly would reorder your caller's data.

If you ever need to sort something you were handed: `[...input].sort(…)`, or the
newer non-mutating `input.toSorted(…)` (ES2023, Node 20+).
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
when `reduce` is the wrong tool, the mutating vs non-mutating array methods, and
the performance question interviewers like to ask about chained pipelines.

**That completes section 05.** Next: [section 06 — classes & interfaces](../../06-classes-interfaces/).
