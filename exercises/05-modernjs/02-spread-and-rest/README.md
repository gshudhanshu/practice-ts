# 05/02 — Spread & rest

**Tier:** Drill → Core · **Time:** ~20 min · **Course section:** 05 — Modern JavaScript

---

## Why this exercise exists

Spread is how you do immutable updates, which is how React, Redux, Zustand and
every other modern state library expect you to work. The trap that catches
everyone: **spread is shallow.** TODO 5 is entirely about that.

`...` also means two different things depending on where it appears — collecting
(rest) in a parameter list or binding pattern, expanding (spread) everywhere
else. Worth being deliberate about which one you are writing.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `sum(1, 2, 3)` → `6`, `sum()` → `0`, via a **rest parameter**. |
| 2 | `mergeUnique(["a","b"], ["b","c"], ["a"])` → `["a","b","c"]` — dedupe, first-seen order, any number of lists. |
| 3 | `withName` returns a **copy**; the original is untouched. |
| 4 | `maxOf` — largest value, `undefined` (not `-Infinity`) for an empty list. |
| 5 | `updateCity` — immutably change a deeply nested value and bump `version`. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.
- **No mutation.** No `push`, no assignment to an argument's properties, no
  `structuredClone` and no JSON round-trip.

## Done when

```bash
npm run check 05/02
```

<details>
<summary>Hint 1 — dedupe while keeping order</summary>

`Set` preserves insertion order and drops duplicates by itself. `lists.flat()`
collapses the array-of-arrays one level, and spreading the Set turns it back
into a plain array.
</details>

<details>
<summary>Hint 2 — override order</summary>

`{ ...user, name }` and `{ name, ...user }` are different. Later keys win, so
only one of them actually changes the name. Try both and read the result.
</details>

<details>
<summary>Hint 3 — <code>Math.max()</code> with no arguments</summary>

It returns `-Infinity` — the identity element for max, mathematically correct
and completely useless as an answer for "the largest of nothing". Handle the
empty case before spreading.

(For very large arrays, spreading also risks a stack overflow, since each
element becomes an argument. `reduce` is the safe alternative there.)
</details>

<details>
<summary>Hint 4 — TODO 5, the shallow-copy trap</summary>

`{ ...state }` gives a new top-level object, but `newState.user` is the **same
object** as `state.user`. So changing `newState.user.address.city` also changes
the original.

You need a fresh object at **every level you are changing** — state, then user,
then address. The levels you are not changing can stay shared.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
what shallow really means, when nested spreads stop scaling (and what teams use
instead), and how spread interacts with `undefined` values.
