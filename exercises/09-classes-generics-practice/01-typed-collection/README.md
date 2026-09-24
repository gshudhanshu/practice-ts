# 09/01 — A typed collection

**Tier:** Core · **Time:** ~25 min · **Course section:** 09 — Classes & generics practice

---

## The project

Section 09 is one small project across three exercises, combining section 06's
classes with section 08's generics:

1. **09/01 (this one)** — `Collection<T>`, a chainable immutable wrapper
2. **09/02** — `Validator<T>`, composable field validation
3. **09/03** — `Table<T>`, the two ideas together

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | Private constructor, `Collection.from(items)`, `toArray()`, `size`. |
| 2 | `filter(predicate)` → a new `Collection<T>`. |
| 3 | `map(transform)` → a `Collection<U>` — a **different** element type. |
| 4 | `sort(compare)` and `take(count)`, both non-mutating. |
| 5 | `first()` and `reduce(fold, seed)`. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.
- **Nothing may mutate**: not the collection, not the array it was built from,
  and not the array `toArray()` handed out earlier. The tests check all three.

## Done when

```bash
npm run check 09/01
```

<details>
<summary>Hint 1 — the method-level type parameter</summary>

```ts
map<U>(transform: (item: T) => U): Collection<U>
```

`T` belongs to the class; `U` belongs to this call. That is what lets
`Collection<number>.map(String)` produce a `Collection<string>`.

`reduce<U>` is the same idea, with `U` coming from the seed.
</details>

<details>
<summary>Hint 2 — three places a copy is needed</summary>

- `from` copies its input, so a later `source.push(…)` cannot reach in.
- `toArray` copies its output, so a caller cannot mutate your storage.
- `sort` copies before sorting, because `.sort()` mutates in place.

Each has its own test.
</details>

<details>
<summary>Hint 3 — <code>take</code> at the edges</summary>

`.slice(0, n)` past the end is harmless, but a **negative** `n` slices from the
end instead of returning nothing. Clamp it: `Math.max(count, 0)`.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md), then move
on to [09/02](../02-composable-validators/README.md).
