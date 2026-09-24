# 10/02 — Indexed access types

**Tier:** Drill → Core · **Time:** ~15 min · **Course section:** 10 — Deriving types

---

## Why this exercise exists

`T[K]` reads a property's type out of another type. It composes and nests, so
you can reach any type inside a structure without ever naming the intermediate
pieces.

That enables one rule worth internalising:

> **Never re-declare a type that already exists inside another one.** Reach in
> and take it.

## Your task

Open `exercise.ts` and resolve all five TODOs. Every one is a single line except
the last.

| # | Requirement |
|---|---|
| 1 | `UserId` → `string` |
| 2 | `NameOrAge` → `string \| number` (index with a **union** of keys) |
| 3 | `Geo` → `{ lat: number; lon: number }` (nested) |
| 4 | `OrderItem` — through **two** arrays |
| 5 | `allSkus` and `totalQty`, typed entirely from the derived types |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.
- **Declare no new object types.** Everything must be reached from `User`.

## Done when

```bash
npm run check 10/02
```

<details>
<summary>Hint 1 — the forms</summary>

```ts
T["key"]              // one property
T["a" | "b"]          // union of two property types
T["a"]["b"]           // nested
T["items"][number]    // an array's ELEMENT type
```

`[number]` is the same operator as `(typeof ROLES)[number]` from 10/01, applied
to an array type instead of a tuple.
</details>

<details>
<summary>Hint 2 — TODO 4 chains four steps</summary>

Read it left to right: the orders array → one order → its items array → one
item.

```ts
User["orders"][number]["items"][number]
```
</details>

<details>
<summary>Hint 3 — typing the return of <code>allSkus</code></summary>

You already have `OrderItem`. The sku's type is one more index away —
`OrderItem["sku"]` — so the return type is that, arrayed. No `string` written
anywhere.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
why indexed access beats extracting sub-interfaces, and the one case where
`T[keyof T]` is a trap.
