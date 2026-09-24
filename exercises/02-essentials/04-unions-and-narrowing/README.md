# 02/04 — Union types & narrowing

**Tier:** Core · **Time:** ~20 min · **Course section:** 02 — Essentials

---

## Scenario

Four small functions, four different narrowing techniques. Discriminated unions
in particular are the backbone of real TypeScript modelling — API responses,
Redux actions, form state, result types. If you internalise one thing from
section 02, make it TODO 2 and 3.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement | Narrowing tool |
|---|---|---|
| 1 | `formatValue` — strings trimmed (`"(empty)"` if blank), numbers to 2 decimals, booleans as `"yes"`/`"no"` | `typeof` |
| 2 | `Shape` is a discriminated union: circle/`radius`, rectangle/`width`+`height`, triangle/`base`+`height` | — |
| 3 | `area` returns the correct area with **no casts** inside the branches | `switch` on the discriminant |
| 4 | `withDefault` replaces only `null`/`undefined` — `0` and `""` survive | the right operator |
| 5 | `contactLabel` → `"email: …"` or `"phone: …"` for shapes with no shared property | `in` |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`. If you reach for a cast inside `area`, your union
  is not discriminated properly — fix TODO 2 instead.

## Done when

```bash
npm run check 02/04
```

<details>
<summary>Hint 1 — what makes a union "discriminated"?</summary>

Every member needs a property with the same **name** whose type is a distinct
**literal** (not `string`). `kind: "circle"` discriminates; `kind: string` does
not, which is exactly why the starter fails.
</details>

<details>
<summary>Hint 2 — TODO 4, the falsy trap</summary>

`value || fallback` fires for `0`, `""`, `NaN` and `false`, not just null and
undefined. There is a different operator, added in ES2020, that triggers on
**nullish** values only. The test pins `0` and `""` precisely to catch this.
</details>

<details>
<summary>Hint 3 — narrowing without a discriminant</summary>

`typeof contact` is `"object"` for both members, so it is useless here.
JavaScript has an operator that asks whether a property name exists on an
object, and TypeScript uses it to narrow.
</details>

<details>
<summary>Hint 4 — my switch says "not all code paths return a value"</summary>

That means your switch is not exhaustive from the compiler's point of view —
usually because `kind` is still `string` rather than a union of literals. Fix
TODO 2 and the error disappears without a `default` clause.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
why discriminated unions beat optional properties, the full list of narrowing
mechanisms, and the `??` vs `||` question that comes up constantly.
