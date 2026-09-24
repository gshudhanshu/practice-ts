# 20/02 — Key selection: `Pick`, `Omit`, `Record`

**Tier:** Core · **Time:** ~25 min · **Course section:** 20 — Utility types from scratch

---

## Why this exercise exists

20/01 kept every key and changed a modifier. These three change **which keys
exist**, and they are built three different ways:

| Utility | Maps over | Keys come from |
|---|---|---|
| `Pick<T, K>` | `K` | the keys you asked for |
| `Record<K, V>` | `K` | a key union, with no source object at all |
| `Omit<T, K>` | `keyof T` | everything except the keys you named |

The `Pick` line is the one people get wrong under pressure. `Pick` does **not**
map over `keyof T` — `keyof T` appears only in the constraint. Getting that
backwards produces a type that either keeps every key or rejects every key.

`Omit` is the odd one out in a second way: its constraint is `keyof any`, not
`keyof T`, so `Omit<User, "pasword">` compiles and removes nothing. That is a
deliberate design decision, and 20/05 is about undoing it.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `MyPick<T, K extends keyof T>` — modifiers on the picked keys survive. |
| 2 | `MyOmit<T, K extends keyof any>` — match the stdlib's loose behaviour. |
| 3 | `MyRecord<K extends keyof any, V>` — including the index-signature case. |
| 4 | `MyPartialBy<T, K>` — make only the named keys optional. |
| 5 | `toPublicUser(user)` — `Omit` at runtime. No casts, no `delete`. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.
- Do not implement these with the built-in `Pick` / `Omit` / `Record`.

## Done when

```bash
npm run check 20/02
```

<details>
<summary>Hint 1 — Pick is two characters different from what you expect</summary>

```ts
type MyPick<T, K extends keyof T> = { [P in K]: T[P] };
```

`K` in the body, `keyof T` in the constraint. Try writing `[P in keyof T]` and
watch `MyPick<User, "id">` come back with every key.
</details>

<details>
<summary>Hint 2 — Omit as a filter</summary>

A key-remapping `as` clause (10/03) turns a rename into a filter, because a key
mapped to `never` disappears:

```ts
{ [P in keyof T as P extends K ? never : P]: T[P] }
```

The standard library instead composes `Pick` with `Exclude` — you rebuild
`Exclude` in the next exercise. Both forms are homomorphic, so both keep
`readonly` and `?`.
</details>

<details>
<summary>Hint 3 — <code>MyPartialBy</code> is a composition</summary>

Two halves joined by `&`: everything *except* `K`, and `K` mapped to optional.
The second half is a two-line mapped type you write inline.

Then wrap the whole thing in the given `Prettify` — an intersection and a flat
object type accept the same values, but `Equal<>` can tell them apart, and so
can anyone reading your tooltips.
</details>

<details>
<summary>Hint 4 — TODO 5 is one line of JavaScript you already know</summary>

```ts
const { theKeyToDrop: _ignored, ...rest } = value;
```

Rest destructuring (05/02) produces an object whose type is precisely the
original minus the destructured key. `delete` would mutate the caller's object
and give you a worse type; building a fresh literal by hand would drift the
moment `User` gains a field.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
why `Pick` is still homomorphic, why `Omit` accepts nonsense keys, what
`Prettify` is really doing, and the `Omit`-on-a-union trap.
