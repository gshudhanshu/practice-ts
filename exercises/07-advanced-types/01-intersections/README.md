# 07/01 — Intersection types

**Tier:** Drill → Core · **Time:** ~20 min · **Course section:** 07 — Advanced types

---

## Why this exercise exists

A union is a **choice** (`A | B`); an intersection is a **combination**
(`A & B`). The genuinely confusing part is that an intersection has *more*
properties but *fewer* valid values, and a union is the reverse.

TODO 4 is the one that pays off daily: using `Omit` + `&` to override a single
property's type without retyping the rest of the object.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `Store` combines `Readable`, `Writable` and `Clearable`. |
| 2 | `InMemoryStore implements Store` — back it with the `#data` Map. |
| 3 | `copyKey(source, target, key)` — copies if present, returns `true`/`false`. |
| 4 | `ClientUser` is `ApiUser` with `id` as a **string**, without retyping `name` or `email`. |
| 5 | `toClientUser` converts one to the other. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.
- In TODO 4, `name` and `email` must not appear in your type. If you add a
  field to `ApiUser` later, `ClientUser` should gain it automatically.

## Done when

```bash
npm run check 07/01
```

<details>
<summary>Hint 1 — combining capabilities</summary>

`A & B & C`. The result has every member of all three, so `keyof Store` is the
union of their keys — the opposite of what `keyof` does to a union.
</details>

<details>
<summary>Hint 2 — the override pattern</summary>

You cannot simply intersect a new `id` in: `ApiUser & { id: string }` gives
`number & string`, which is `never`, and nothing can satisfy it.

Remove the old property first, then intersect the replacement:

```ts
type Replaced = Omit<Original, "field"> & { field: NewType };
```
</details>

<details>
<summary>Hint 3 — the empty-string trap in TODO 3</summary>

`read()` returns `string | undefined`, and `""` is a legitimate stored value.
Check `=== undefined`, not truthiness — one of the tests stores `""` precisely
to catch this.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
why conflicting intersections become `never`, how `keyof` behaves differently
over unions and intersections, and when to prefer `extends` instead.
