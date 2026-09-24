# 21/04 — CHALLENGE: object transformations

**Tier:** Challenge · **Time:** ~40 min · **Section:** 21 — Type challenges

---

## Why this exercise exists

Unlike most katas, these four types earn their keep in ordinary application
code:

- `OptionalKeys` / `RequiredKeys` — form generators, ORMs deciding which columns
  need a value on insert, "which fields must the caller supply?"
- `PickByValue` — "give me every `Date` column", "every callback prop"
- `Merge` — config layering, theme overrides, `defaultProps`
- `RequireAtLeastOne` — the classic API contract: *supply an email or a phone
  number, I do not mind which, but not neither*

Each has one trick in it. The one worth the money is `{} extends Pick<T, K>`.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `OptionalKeys<Account>` → `"nickname" \| "bio"`; `RequiredKeys` is the complement. |
| 2 | `PickByValue<Account, string>` → `{ id: string; name: string }`. |
| 3 | `Merge<A, B>` — one flat object, `B` winning conflicts. |
| 4 | `RequireAtLeastOne<Contact, "email" \| "phone">`. |
| 5 | `notify(contact)` — an unreachable contact must not compile. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.

## Done when

```bash
npm run check 21/04
```

<details>
<summary>Hint 1 — asking whether a property is optional</summary>

`keyof T` gives every key with no clue which are optional, and `T[K] extends
undefined` is wrong under `exactOptionalPropertyTypes` (03/04) — `a?: string`
and `a: string | undefined` are different types.

The reliable test is about **assignability of the empty object**:

```ts
{} extends Pick<T, K> ? "optional" : "required"
```

`Pick<T, "nickname">` is `{ nickname?: string }`, and `{}` is assignable to
that. `Pick<T, "id">` is `{ id: string }`, and it is not.
</details>

<details>
<summary>Hint 2 — turning "one thing per key" into a union</summary>

The 10/03 idiom:

```ts
type Keys<T> = { [K in keyof T]-?: SomeTest<K> }[keyof T];
```

Build a mapped type whose **values** are what you want, then index it with
`keyof T`. Without `-?`, optional keys contribute `undefined` to the union too.
</details>

<details>
<summary>Hint 3 — filtering by value type</summary>

Key remapping, with `never` as the "drop this one" key:

```ts
{ [K in keyof T as T[K] extends V ? K : never]: T[K] }
```

Then look hard at why `nickname?: string` does not survive
`PickByValue<T, string>`. The answer is in the explanation, and it is the right
behaviour.
</details>

<details>
<summary>Hint 4 — why <code>A & B</code> is not <code>Merge</code></summary>

```ts
type Bad = { b: number } & { b: boolean };   // b: never
```

An intersection *combines* conflicting properties instead of overriding them,
and it displays as two types joined by `&`. Map over `keyof A | keyof B` and
choose per key, checking `keyof B` first so `B` wins.
</details>

<details>
<summary>Hint 5 — RequireAtLeastOne is a union</summary>

For `K = "email" | "phone"` you want:

```ts
{ email: string; phone?: string } | { phone: string; email?: string }
```

So: for each `P` in `K`, `Required<Pick<T, P>>` plus
`Partial<Pick<T, Exclude<K, P>>>`, intersected with `Omit<T, K>` for everything
outside `K`. Build those variants as the values of a mapped type over `K`, then
index it with `[K]` to get the union.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
why `{} extends Pick<T, K>` is the only reliable optionality test, what `Merge`
quietly loses, and the alternative API design that makes `RequireAtLeastOne`
unnecessary.
