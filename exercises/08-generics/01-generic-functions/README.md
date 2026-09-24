# 08/01 — Generic functions

**Tier:** Drill → Core · **Time:** ~20 min · **Course section:** 08 — Generics

---

## Why this exercise exists

A generic is a **parameter for a type**. Its purpose is to *relate* the input
type to the output type — not merely to accept anything.

That gives you a test you can apply to any signature:

> **If a type parameter appears only once, it relates nothing.**
> You wanted a constraint or `unknown` instead.

TODO 5 is exactly that mistake, and fixing it is the most useful thing in this
exercise.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `identity(value)` returns it unchanged, type preserved. No explicit type argument at the call site. |
| 2 | `first(items)` → the first element or `undefined`, element type preserved. |
| 3 | `pair("a", 1)` → `[string, number]`. Two **independent** type parameters. |
| 4 | `partition([1,2,3,4], n => n % 2 === 0)` → `[[2,4], [1,3]]`. |
| 5 | Rewrite `totalLength` **without** a type parameter — it appears only once. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.
- `partition` must not mutate its input, and must preserve order in both halves.

## Done when

```bash
npm run check 08/01
```

<details>
<summary>Hint 1 — the syntax</summary>

```ts
function identity<T>(value: T): T {
  return value;
}
```

`<T>` declares the parameter; using `T` in both the argument and the return type
is what relates them. Inference fills `T` in from the call site, so
`identity("a")` needs no `<string>`.
</details>

<details>
<summary>Hint 2 — one parameter or two?</summary>

`pair<T>(a: T, b: T)` would force both arguments to the same type, or widen them
to a shared supertype. `pair("a", 1)` should be `[string, number]`, so you need
two independent parameters.
</details>

<details>
<summary>Hint 3 — the callback in TODO 4</summary>

Type it as `(item: T) => boolean` and contextual typing does the rest — the test
calls `partition(["a","bb"], (word) => word.length > 1)` with no annotation on
`word`, and that must compile.
</details>

<details>
<summary>Hint 4 — TODO 5, what the signature should say</summary>

Count the appearances of `T` in the original: parameter only. It is not
connecting anything to anything, so inline the constraint:

```ts
function totalLength(items: readonly { length: number }[]): number
```

Bonus: the generic version silently accepted a bare `string` (strings have a
`length`). The rewrite does not.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
the "appears once" rule, why explicit type arguments are usually a smell, and
how inference actually picks `T`.
