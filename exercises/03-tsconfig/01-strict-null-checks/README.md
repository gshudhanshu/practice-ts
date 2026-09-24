# 03/01 — Living with `strictNullChecks`

**Tier:** Drill · **Time:** ~15 min · **Course section:** 03 — The compiler & tsconfig

---

## Why this exercise exists

`strictNullChecks` is the highest-value flag TypeScript has. Turn it **off** and
`null` and `undefined` become members of every type — `string` silently includes
`null`, and the compiler cannot see a single null dereference. Turn it **on** and
they must be handled explicitly.

Anders Hejlsberg has called null references the "billion dollar mistake" they
inherited; this flag is how TypeScript opts out of it. Every exercise in this
repo runs with it on (via `strict`).

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `safeLength` — string length, or `0` for nullish. |
| 2 | `firstNonEmpty` — first non-blank string, else `undefined`. Whitespace-only does not count. |
| 3 | `compact` — drop nullish values, return `string[]`, **with no type assertion**. |
| 4 | `getInitials("Ada Lovelace")` → `"AL"`; `null` when there is nothing usable. |
| 5 | `cityOf` — the city or `"unknown"`, using optional chaining and `??`. No nested `if`s, no `!`. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.

## Done when

```bash
npm run check 03/01
```

<details>
<summary>Hint 1 — one operator handles both null and undefined</summary>

`value?.length` is `undefined` when `value` is `null` *or* `undefined`. Pair it
with `??` for the fallback and TODO 1 is a single expression.
</details>

<details>
<summary>Hint 2 — TODO 3 without a cast</summary>

Write the plainest possible callback: `values.filter((v) => v != null)`.

Loose `!=` against `null` matches both `null` and `undefined` — the one place
where `==`/`!=` is idiomatic. Since TypeScript 5.5 the compiler **infers** the
type predicate `v is string` from a callback this simple, so the result is
already `string[]`. If you find yourself writing `as string[]`, you have written
a callback too complex for inference — simplify it instead.
</details>

<details>
<summary>Hint 3 — splitting names safely</summary>

`"  a   b ".trim().split(/\s+/)` handles runs of whitespace. Remember that
`word[0]` is `string | undefined` under `noUncheckedIndexedAccess`, so supply a
fallback rather than asserting.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
what the flag actually changes, the `?.` / `??` / `!` trio, and why `!` is the
one you should almost never reach for.
