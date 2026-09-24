# 20/03 — Union filters: `Exclude`, `Extract`, `NonNullable`

**Tier:** Core · **Time:** ~25 min · **Course section:** 20 — Utility types from scratch

---

## Why this exercise exists

These are the shortest utility types in the standard library:

```ts
type Exclude<T, U> = T extends U ? never : T;
type Extract<T, U> = T extends U ? T : never;
```

Read them without knowing about **distribution** and they are nonsense — "if T
is assignable to U then nothing, otherwise T" would answer a whole union all at
once. Read them *with* distribution and they are filters: the conditional runs
once per union member, and a member that resolves to `never` disappears from the
result.

That is the entire exercise. Distribution itself you met in
[`10/04`](../../10-deriving-types/04-conditional-types/); here you use it to
rebuild three utilities and to meet the two edge cases interviewers always
probe:

- **`boolean`** is secretly `true | false`, so it distributes;
- **`never`** is secretly the *empty* union, so distributing over it runs
  nothing and returns `never` — which breaks the obvious way of asking "is this
  type `never`?"

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `MyExclude<T, U>` — drop the members assignable to `U`. |
| 2 | `MyExtract<T, U>` — keep them instead. |
| 3 | `MyNonNullable<T>` — drop `null` and `undefined`. |
| 4 | `HasMembers<T>` — `false` for `never`, `true` for anything else. |
| 5 | `compact(tags)` — the runtime filter. Empty strings survive. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.
- Do not use the built-in `Exclude` / `Extract` / `NonNullable`.

## Done when

```bash
npm run check 20/03
```

<details>
<summary>Hint 1 — TODOs 1 to 3 are one line each</summary>

```ts
T extends U ? A : B
```

with `never` in one of the two branches. Nothing else. If you find yourself
reaching for a mapped type or `keyof`, step back — these operate on unions, not
on objects.
</details>

<details>
<summary>Hint 2 — why the filter works at all</summary>

`T` alone on the left of `extends` is a *naked* type parameter, so the compiler
distributes: `Exclude<"a" | "b", "a">` is evaluated as
`("a" extends "a" ? never : "a") | ("b" extends "a" ? never : "b")`, which is
`never | "b"`, which is `"b"` — because `never` is absorbed by a union.
</details>

<details>
<summary>Hint 3 — TODO 4 needs distribution switched OFF</summary>

`never` is the union with zero members, so there is nothing to distribute over
and the conditional short-circuits to `never` without evaluating either branch.
Make `T` non-naked and the conditional is evaluated once, on the whole type:

```ts
[T] extends [never] ? … : …
```

The one-element tuple is the standard idiom (10/04). Any wrapper that puts `T`
somewhere other than bare on the left would do, but this is the one everyone
writes.
</details>

<details>
<summary>Hint 4 — TODO 5, filtering with a predicate</summary>

`Array.prototype.filter` has an overload that narrows:

```ts
filter<S extends T>(predicate: (value: T) => value is S): S[]
```

so `(tag): tag is string => …` gives you a `string[]` with no cast. Since
TypeScript 5.5 the predicate can be inferred, but writing it is clearer.

Check with `!== null && !== undefined` (or `!= null`), never with truthiness —
`""` is a tag.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
why `never` disappears from unions, why the standard library's `NonNullable` is
`T & {}` rather than a conditional, and the `boolean` trap.
