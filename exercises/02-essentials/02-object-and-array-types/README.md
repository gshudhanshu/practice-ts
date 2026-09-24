# 02/02 — Object & Array Types

**Tier:** Drill · **Time:** ~15 min · **Course section:** 02 — Essentials

---

## Scenario

A small library catalogue. Nothing here is algorithmically hard — the whole
exercise is about saying precisely what a shape is, and about surviving two
strict compiler flags most tutorials never turn on.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `Book` has `id`, `title`, `author` (all `string`), `tags` (a **non-mutable** string array), and an **optional** `publishedYear: number`. |
| 2 | `titlesOf` returns every title, and must accept a `readonly Book[]`. |
| 3 | `byTag` returns books carrying the tag (case-sensitive). |
| 4 | `firstBook` returns the first book **or `undefined`** when the list is empty. |
| 5 | `groupByAuthor` returns `Record<string, Book[]>`; an author with no books is simply not a key. |

## Rules

- Do not edit `exercise.test.ts`. It is the spec.
- No `any`, no `as`, and **no `!` non-null assertions** — every one of them is
  avoidable here, and avoiding them is the point.

## Done when

```bash
npm run check 02/02
```

## Two flags that will bite you

This repo enables `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.
They are *not* part of `strict`, and they change what compiles:

- `books[0]` has type `Book | undefined`, not `Book`.
- `record[key]` has type `V | undefined`.

That is deliberate. It is also what a well-configured production `tsconfig`
looks like.

<details>
<summary>Hint 1 — how do I stop <code>tags.push()</code> from compiling?</summary>

There is a modifier you can put directly in front of an array type. It is the
same keyword you would use to make a property immutable.
</details>

<details>
<summary>Hint 2 — <code>titlesOf</code> rejects my readonly array</summary>

Assignability only runs one way. A mutable array *is* a valid readonly array,
but a readonly array is not a valid mutable one. So which of the two should the
**parameter** be, if you want to accept both kinds of caller?
</details>

<details>
<summary>Hint 3 — "Object is possibly undefined" in groupByAuthor</summary>

Pull the bucket into a local first, then branch on it:

```ts
const bucket = grouped[author];
if (bucket) {
  // bucket is Book[] here
} else {
  // create it
}
```

The narrowing sticks to the local. Reaching back into `grouped[author]` inside
the branch would re-widen it to `Book[] | undefined`.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
why `readonly` parameters are strictly better, and what `exactOptionalPropertyTypes`
actually protects you from.
