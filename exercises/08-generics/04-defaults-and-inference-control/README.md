# 08/04 — Type-parameter defaults & controlling inference

**Tier:** Core · **Time:** ~25 min · **Course section:** 08 — Generics

---

## Why this exercise exists

Three features that let you shape what inference does — the second and third are
recent enough that most tutorials predate them:

| Feature | Since | Does |
|---|---|---|
| `T = Default` | TS 2.3 | callers may omit the type argument |
| `const T` | TS 5.0 | infer the narrowest type, as if the caller wrote `as const` |
| `NoInfer<T>` | TS 5.4 | exclude a position from inference entirely |

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `ApiResponse<TData, TError = string>` — a discriminated union with a **defaulted** error type. |
| 2 | `succeed(1)` → `ApiResponse<number>`; `failWith("nope")` → `ApiResponse<never, string>`. |
| 3 | `asTuple(["a","b"])` → `readonly ["a","b"]` — **without** `as const` at the call site. |
| 4 | `pickOne(["a","b"], 1)` must be a **compile error**, not `T = string \| number`. |
| 5 | `Store<TState = Record<string, unknown>>` — `get`, `set`, `update`. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.

## Done when

```bash
npm run check 08/04
```

<details>
<summary>Hint 1 — defaults</summary>

```ts
type ApiResponse<TData, TError = string> = …
class Store<TState = Record<string, unknown>> { … }
```

Same rule as default function parameters: defaulted type parameters must come
after all non-defaulted ones.
</details>

<details>
<summary>Hint 2 — `never` as a deliberate type argument</summary>

`failWith` carries no data, so its success branch can never occur. Saying
`ApiResponse<never, TError>` states exactly that — nothing is assignable to
`never`, so nobody can construct or read that branch.
</details>

<details>
<summary>Hint 3 — TODO 3's modifier</summary>

It goes on the type parameter itself, before the name:

```ts
function asTuple<const T extends readonly unknown[]>(values: T): T
```

Without it, `["a","b"]` widens to `string[]` and the tuple is gone.
</details>

<details>
<summary>Hint 4 — TODO 4</summary>

Wrap the fallback's type in the utility that removes a position from inference.
`T` is then decided by `options` alone, so a mismatched fallback is checked
against it instead of widening it.

Watch out for the consequence: `pickOne([], "z")` now infers `T = never` from
the empty literal, and fails. That is correct behaviour — annotate the array or
pass `pickOne<string>([], "z")`.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
what problem `NoInfer` was added to solve, when `const` type parameters help and
when they get in the way, and why defaults are not the same as constraints.
