# 06/01 — Class fundamentals & access modifiers

**Tier:** Drill → Core · **Time:** ~20 min · **Course section:** 06 — Classes & interfaces

---

## Your task

Open `exercise.ts` and resolve all five TODOs. A `BankAccount` — the classic
encapsulation exercise, because every rule has an obvious reason.

| # | Requirement |
|---|---|
| 1 | Rewrite the constructor with **parameter properties**: `owner` public readonly, `balanceCents` private. Reject a negative or non-integer opening balance. |
| 2 | `deposit` — adds funds; throws `RangeError` unless the amount is a **positive integer**. |
| 3 | `withdraw` — returns `true` and deducts, or `false` and changes nothing. Still throws on an invalid amount. |
| 4 | `balance` — a **getter**. `account.balance = 1` must not compile. |
| 5 | `transferTo` — move money between accounts; `false` when funds are short. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.
- After TODO 1, there must be no explicit field declarations and no `this.x = x`
  assignments left in the constructor.

## Done when

```bash
npm run check 06/01
```

## A design decision to make deliberately

Notice that `withdraw` has **two** failure modes and they are handled
differently:

- An invalid amount (`-5`, `2.5`, `NaN`) **throws** — that is a programmer bug,
  and it should be loud.
- Insufficient funds **returns `false`** — that is an expected business
  outcome, and callers should handle it.

Deciding which failures are exceptions and which are return values is a real
design skill. Getting it backwards produces either try/catch soup or silently
swallowed bugs.

<details>
<summary>Hint 1 — parameter properties</summary>

An access modifier on a constructor parameter declares and assigns the field in
one go:

```ts
constructor(public readonly owner: string, private balanceCents: number) {}
```

That is TypeScript-specific syntax with no JavaScript equivalent — worth knowing
it exists, and worth knowing why some codebases avoid it (see the explanation).
</details>

<details>
<summary>Hint 2 — validating an amount</summary>

`Number.isInteger` is `false` for `NaN`, `Infinity` and `2.5`. Combine it with a
`> 0` check and you have covered everything the tests throw at you.

Since three methods need the same check, a `private static` helper avoids
repeating it.
</details>

<details>
<summary>Hint 3 — TODO 5, and a question worth sitting with</summary>

`private` in TypeScript is per-**class**, not per-instance, so
`other.balanceCents` compiles fine inside `BankAccount`.

Just because you *can* reach in, should you? Consider what happens to the
validation and insufficient-funds rules if `transferTo` manipulates balances
directly, and someone later changes the overdraft policy.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
`private` vs `#private` (a genuinely important difference), why parameter
properties are controversial, and when to throw versus return.
