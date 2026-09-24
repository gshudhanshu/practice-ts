# 07/03 — Function overloads

**Tier:** Core · **Time:** ~25 min · **Course section:** 07 — Advanced types

---

## Why this exercise exists

Overloads let one function present several call signatures. They are the right
tool in exactly two situations:

1. **Different arities that mean different things** — `makeRange(3)` vs
   `makeRange(2, 5)`.
2. **A return type that genuinely depends on the argument type** — `combine`.

They are the wrong tool most other times, so TODO 3 is deliberately a case where
you should **not** overload. Knowing when to reach for them is the actual skill;
overusing them is the common failure.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `makeRange(3)` → `[0,1,2]`; `makeRange(2,5)` → `[2,3,4]`. Two overloads. |
| 2 | `combine("ab","cd")` → `string`; `combine([1,2],[3])` → `number[]`. Not a union return. |
| 3 | `formatValue` — **no overloads.** One union parameter and `typeof` narrowing. |
| 4 | `ItemRepository.find` — by id **or** by predicate. Method overloads. |
| 5 | Reorder the `describe` overloads so a string gets `"text"`. Do not touch the implementation. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.
- `combine` must not mutate its array arguments.

## Done when

```bash
npm run check 07/03
```

<details>
<summary>Hint 1 — the shape of an overloaded function</summary>

```ts
export function f(a: string): string;            // overload signature
export function f(a: number, b: number): number; // overload signature
export function f(a: string | number, b?: number): string | number {
  // implementation — NOT callable from outside
}
```

Callers only see the signatures above. The implementation signature must be
compatible with all of them, which is why its parameters end up as unions and
its optional arguments as `?`.
</details>

<details>
<summary>Hint 2 — distinguishing the arities in TODO 1</summary>

The implementation takes `(startOrCount: number, end?: number)`. If `end` is
`undefined` you were called with one argument, so the range is `0 → startOrCount`.
Otherwise it is `startOrCount → end`.

An inverted range needs no special case: the loop condition simply never holds.
</details>

<details>
<summary>Hint 3 — TODO 2 without a cast</summary>

After `typeof a === "string" && typeof b === "string"`, both are strings. Then
check `typeof a !== "string" && typeof b !== "string"` for the array branch —
narrowing both at once is what lets you spread them with no assertion.

The mixed case is unreachable through the public overloads, so a `throw` there
is honest rather than defensive.
</details>

<details>
<summary>Hint 4 — TODO 4, one predicate, two entry points</summary>

Turn the id case into a predicate, then run a single `.find`:

```ts
const predicate = typeof arg === "string" ? (item) => item.id === arg : arg;
```
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
why the implementation signature is invisible to callers, why overloads do not
narrow the *implementation*, and the cases where a generic beats both.
