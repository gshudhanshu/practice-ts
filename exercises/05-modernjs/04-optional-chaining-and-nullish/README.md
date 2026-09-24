# 05/04 — Optional chaining & the nullish operators

**Tier:** Core · **Time:** ~15 min · **Course section:** 05 — Modern JavaScript

---

## Why this exercise exists

`?.` `??` and `??=` collapse whole paragraphs of defensive code into single
expressions. The part worth drilling is **choosing between `??` and `||`** —
they are not interchangeable, and this exercise deliberately contains one case
where each is correct.

If you reflexively reach for the same one every time, TODO 5 will catch you.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `firstLabel` — the first item's label, or `"none"`. One expression. |
| 2 | `totalOf` — the total, defaulting to `0`; a **real** `0` stays `0`. |
| 3 | `callSafely` — call the optional callback, else `-1`. Use an **optional call**. |
| 4 | `bumpVisit` — increment a counter, initialising with **`??=`**. |
| 5 | `displayName` — nickname, falling back to username when it is absent **or empty**. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.
- TODO 1, 2 and 3 should each be a single expression — no `if` statements.

## Done when

```bash
npm run check 05/04
```

<details>
<summary>Hint 1 — optional chaining has three forms</summary>

```ts
obj?.prop     // optional property access
obj?.[key]    // optional index  <- note the dot before the bracket
fn?.()        // optional call   <- note the dot before the parenthesis
```

TODO 1 needs the first two; TODO 3 needs the third. The `.` is easy to forget
in the bracket and call forms.
</details>

<details>
<summary>Hint 2 — how many <code>?.</code> does TODO 1 need?</summary>

Count the ways it can fail: `data` absent, `items` absent, the array empty, and
`label` absent. That is four, and the array-empty one is covered by `?.[0]`
because `items[0]` is itself `| undefined` under `noUncheckedIndexedAccess`.
</details>

<details>
<summary>Hint 3 — TODO 5 is the trap</summary>

Re-read the requirement: `""` must be treated as "no nickname". `??` only
triggers on null and undefined, so it would return the empty string.

This is the one case in this repo where `||` is the **right** answer. The
lesson is not "always use `??`" — it is "pick the operator from the
requirement".
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
what short-circuiting actually means, why `a ?? b || c` is a syntax error, and
the full logical-assignment family (`??=`, `||=`, `&&=`).
