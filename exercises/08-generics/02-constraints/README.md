# 08/02 — Generic constraints

**Tier:** Core · **Time:** ~25 min · **Course section:** 08 — Generics

---

## Why this exercise exists

An unconstrained `T` can be anything, so inside the function you can do almost
nothing with it. A constraint (`T extends …`) buys knowledge in the body while
still relating types at the call site.

`K extends keyof T` returning `T[K]` is **the** everyday generic pattern —
lodash's `get`, React's `useState` setters, every ORM's field selectors. TODO 1
and 2 are both that shape, and it is worth being able to write it from memory.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `pluck(user, "name")` → `string`; `pluck(user, "nope")` → compile error. |
| 2 | `pluckAll(users, "age")` → `number[]`. |
| 3 | `sortByKey(users, "age")` sorts numerically, `"name"` lexicographically, `"tags"` is a **compile error**. No mutation. |
| 4 | `maxBy(items, score)` → highest scorer, first on a tie, `undefined` when empty. |
| 5 | `merge({a:1}, {b:"x"})` → `{ a: number } & { b: string }`. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.
- `sortByKey` and `merge` must not mutate their arguments.

## Done when

```bash
npm run check 08/02
```

<details>
<summary>Hint 1 — the keyof pattern</summary>

```ts
function pluck<T, K extends keyof T>(item: T, key: K): T[K] {
  return item[key];
}
```

`K extends keyof T` checks the key against the object; `T[K]` is an indexed
access type, so the return type follows whichever key was passed.
</details>

<details>
<summary>Hint 2 — TODO 3's constraint, from the other direction</summary>

You want "T is an object with a property named K whose value is comparable".
Constraining `T[K]` directly is awkward. Constrain `T` instead:

```ts
function sortByKey<K extends PropertyKey, T extends Record<K, Comparable>>(
  items: readonly T[],
  key: K,
): T[]
```

Now `sortByKey(users, "tags")` fails because `User` does not extend
`Record<"tags", Comparable>` — `tags` is a `string[]`.
</details>

<details>
<summary>Hint 3 — comparing safely in the sort</summary>

`a - b` is right for numbers, but wrong for strings. `String(10) < String(9)` is
`true`, so stringifying everything breaks numeric order.

Branch: if both are numbers, subtract. Otherwise compare as strings.

Also: `.sort()` mutates. Copy first (`[...items]`), and note that
`Array.prototype.sort` has been **stable** since ES2019, so equal keys keep
their original order without any extra work — one of the tests checks that.
</details>

<details>
<summary>Hint 4 — TODO 4 has no constraint at all</summary>

`maxBy` does not constrain `T`. The caller supplies a `score` function, which is
strictly more flexible than requiring `T` to have a particular shape — the same
item type can be ranked different ways at different call sites.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
constraint-vs-callback as a design choice, why building a `Pick<T, K>` result
genuinely needs a cast, and how `extends object` differs from `extends {}`.
