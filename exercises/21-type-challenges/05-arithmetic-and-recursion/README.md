# 21/05 — CHALLENGE: arithmetic & recursion

**Tier:** Challenge · **Time:** ~40 min · **Section:** 21 — Type challenges

---

## Why this exercise exists

The type system has no `+`. It has tuples that know their own length (21/01),
and that turns out to be enough:

| To do this | Do that |
|---|---|
| add | build two tuples, concatenate, read `["length"]` |
| subtract | pattern-match a prefix off the longer tuple |
| compare | see which tuple runs out first |
| count | keep pushing until the length matches |

This is also the clearest place to meet the compiler's **recursion limits** —
and you will meet them, because counting to 1,000 means a thousand type
instantiations. The exercise asks you to know the numbers rather than guess
them.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `BuildTuple<3>` → `[unknown, unknown, unknown]`; `BuildTuple<2, string>` → `[string, string]`. |
| 2 | `Add<64, 36>` → `100`. |
| 3 | `Subtract<5, 2>` → `3`; `Subtract<2, 5>` → `never`. |
| 4 | `GreaterThan<3, 2>` → `true`; `GreaterThan<3, 3>` → `false`. |
| 5 | `Enumerate<3>` → `[0, 1, 2]`, `Range<2, 5>` → `[2, 3, 4]`, plus the runtime `range`. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.

## Done when

```bash
npm run check 21/05
```

<details>
<summary>Hint 1 — the accumulator pattern</summary>

```ts
type BuildTuple<N extends number, Fill = unknown, Acc extends unknown[] = []> =
  Acc["length"] extends N ? Acc : BuildTuple<N, Fill, [...Acc, Fill]>;
```

A third type parameter with a default carries the state. Callers never pass it;
the recursion does.
</details>

<details>
<summary>Hint 2 — keep the recursive call in tail position</summary>

Write the recursive call as the **entire** branch:

```ts
… ? Acc : BuildTuple<N, Fill, [...Acc, Fill]>          // tail call — eliminated
… ? Acc : [...BuildTuple<N, Fill, [...Acc, Fill]>]     // wrapped — not eliminated
```

Since TS 4.5 the compiler eliminates the first form and allows about **1,000**
levels. The second must keep every frame alive and dies at about **48**. Same
answer, twenty times the headroom.
</details>

<details>
<summary>Hint 3 — subtraction is a prefix match</summary>

```ts
BuildTuple<A> extends [...BuildTuple<B>, ...infer Rest] ? Rest["length"] : never
```

"Does A's tuple start with B items?" If yes, `Rest` is what remains. If no, B
was bigger — and `never` is the right answer, because this arithmetic has no
negative numbers.
</details>

<details>
<summary>Hint 4 — comparison needs no recursion of its own</summary>

`BuildTuple` already did the recursing. One conditional decides the rest: if
B's tuple is at least as long as A's, then A is not greater.
</details>

<details>
<summary>Hint 5 — <code>Enumerate</code> and <code>Range</code></summary>

`Enumerate` is `BuildTuple` with one change: push `Acc["length"]` — the index
you are currently at — instead of a fixed filler.

`Range<Start, End>` is then `Enumerate<End>` with the first `Start` items
dropped, which is the prefix match from TODO 3 again.

The runtime `range` is an ordinary `for` loop. Keep `end` exclusive so it
matches the type.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it has
the measured recursion limits for this repo's compiler, why tail-recursion
elimination exists, and an honest account of when type-level arithmetic is worth
shipping (rarely) and when it is not (usually).
