# 03/02 — `noUncheckedIndexedAccess`

**Tier:** Drill → Core · **Time:** ~20 min · **Course section:** 03 — The compiler & tsconfig

---

## Why this exercise exists

By default — even under `strict` — TypeScript tells you a comfortable lie:

```ts
const values: string[] = [];
const first = values[0];   // claims `string`
first.toUpperCase();       // compiles. Crashes.
```

`noUncheckedIndexedAccess` fixes this. Every indexed read becomes
`T | undefined`, for arrays *and* for records. It is not part of `strict`, it is
opt-in, and it is one of the highest-value lines you can add to a real
`tsconfig`.

It also has a reputation for being annoying. Half of this exercise is learning
the patterns that make it *not* annoying — mostly "stop indexing".

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `at(values, index)` — supports negative indexes, returns `string \| undefined`. |
| 2 | `sumAll` — total of the list, `0` when empty. |
| 3 | `tally(["a","b","a"])` → `{ a: 2, b: 1 }`. |
| 4 | `zip(["a","b"], [1,2,3])` → `[["a",1],["b",2]]` — stops at the shorter array. |
| 5 | `chunk([1,2,3,4,5], 2)` → `[[1,2],[3,4],[5]]`; a size `<= 0` yields `[]`. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, **no `!`**. Every one of these has a clean solution.

## Done when

```bash
npm run check 03/02
```

<details>
<summary>Hint 1 — TODO 1 needs no check at all</summary>

Normalise a negative index into a positive one, then just return the element
access. The flag has already given that expression the type
`string | undefined`, which is precisely what you promised to return.
</details>

<details>
<summary>Hint 2 — the three ways to stop fighting this flag</summary>

1. **Iterate instead of indexing** — `for...of` yields `T`, never `T | undefined`.
2. **Use array methods** — `.map`, `.filter`, `.slice`, `.reduce` never hand you
   an `undefined` element.
3. **Narrow once into a local** — pull `values[i]` into a `const`, check it, and
   use the local from then on.

TODO 2 and 5 want (1) and (2). TODO 4 wants (3).
</details>

<details>
<summary>Hint 3 — why doesn't <code>i &lt; length</code> narrow anything?</summary>

Because TypeScript does not track the relationship between a loop counter and
an array's length — that would need dependent types. So `left[i]` is still
`string | undefined` even inside a correctly-bounded loop. Pull both elements
into locals, check them, then push.
</details>

<details>
<summary>Hint 4 — TODO 3's accumulator</summary>

`counts[word]` is `number | undefined` when you *read* it. You already know an
operator that turns "possibly missing" into a default.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
what the flag does and does not catch (there is a notable gap), and how to
introduce it into an existing codebase without a thousand-error diff.
