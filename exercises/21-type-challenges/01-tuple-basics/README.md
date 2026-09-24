# 21/01 — Tuple basics

**Tier:** Core · **Time:** ~25 min · **Section:** 21 — Type challenges

---

## Why this exercise exists

Section 10 taught `infer`, recursion and indexed access. This section is
**practice** at using them, and tuples are where that practice starts: they are
the type system's only ordered, countable data structure, so every type-level
loop, counter and parser is built on one.

The pattern you are drilling is this:

```ts
T extends readonly [infer Head, ...infer Rest] ? … : …
```

Head/tail recursion over a list — the same shape as a Lisp `car`/`cdr`, and the
reason 21/05 can do arithmetic at all.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `Length<[1, 2, 3]>` → `3`; `Length<string[]>` → `number`. |
| 2 | `Head<[1, 2, 3]>` → `1`; `Tail<[1, 2, 3]>` → `[2, 3]`. |
| 3 | `Last<[1, 2, 3]>` → `3`; `Pop<[1, 2, 3]>` → `[1, 2]`. |
| 4 | `Push<[1, 2], 3>` → `[1, 2, 3]`; `Unshift<[2, 3], 1>` → `[1, 2, 3]`. |
| 5 | `unshift(["b", "c"], "a")` → `["a", "b", "c"]`, typed as that exact tuple. |

Empty tuples are part of the spec: `Head<[]>` is `never` (there is no element to
return) while `Tail<[]>` is `[]` (there is a list, it is just empty).

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.

## Done when

```bash
npm run check 21/01
```

<details>
<summary>Hint 1 — a tuple already knows its length</summary>

`length` is a real property, and on a tuple its type is a numeric literal:

```ts
type L = [1, 2, 3]["length"];   // 3
type M = string[]["length"];    // number
```

So TODO 1 is an indexed access (10/02), not a conditional.
</details>

<details>
<summary>Hint 2 — matching a readonly tuple</summary>

```ts
T extends readonly [infer H, ...unknown[]] ? H : never
```

Write `readonly` in the **pattern**. `[1, 2]` is assignable to
`readonly [1, 2]`, but a `readonly` tuple is not assignable to a mutable one —
so the readonly form matches both and the mutable form matches only one.

Positions you do not need can stay anonymous: `...unknown[]` rather than
`...infer _Rest`.
</details>

<details>
<summary>Hint 3 — a rest element may come first</summary>

Since TS 4.0 a rest element can sit anywhere in a tuple type, including the
front:

```ts
T extends readonly [...unknown[], infer L] ? L : never
```

That is the whole trick behind `Last` and `Pop`.
</details>

<details>
<summary>Hint 4 — building rather than matching</summary>

TODO 4 needs no conditional at all. Spreading a tuple type into a new tuple
literal constructs a longer one:

```ts
type Push<T extends readonly unknown[], V> = [...T, V];
```

The result is mutable because you wrote the new tuple without `readonly`.
</details>

<details>
<summary>Hint 5 — why TODO 5's types survive the call</summary>

Two features do the work, and both are already written for you:

- `const T` (08/03) infers `["b", "c"]` as `readonly ["b", "c"]` instead of
  widening it to `string[]`;
- `Unshift<T, V>` is a tuple construction, not a conditional, so — unlike
  10/04's `ElementOf<T>` — it is checkable from inside the generic function.

The body is one line.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
why `Head<[]>` is `never` rather than `undefined`, what a rest element in the
middle costs, and where variadic tuples show up in real library code.
