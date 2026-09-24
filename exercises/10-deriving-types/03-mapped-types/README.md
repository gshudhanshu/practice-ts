# 10/03 — Mapped types

**Tier:** Core · **Time:** ~25 min · **Course section:** 10 — Deriving types

---

## Why this exercise exists

A mapped type walks a type's keys and builds a new type:

```ts
{ [K in keyof T]: … }
```

There are exactly **four moves**, and between them they cover almost every type
transformation you will ever write:

| Move | Syntax |
|---|---|
| change the value type | `[K in keyof T]: NewType` |
| add / remove a modifier | `-readonly`, `-?`, `+?` |
| rename the key | `[K in keyof T as NewKey]` |
| drop the key | map it to `never` in the `as` clause |

`Partial`, `Required`, `Readonly`, `Pick` and `Record` are all one-liners built
from these — you rebuild them from scratch in the bonus sections.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `Nullable<T>` — every value may also be `null`. |
| 2 | `Mutable<T>` — strips `readonly`. `Mutable<Readonly<User>>` must equal `User`. |
| 3 | `Getters<T>` → `{ getId: () => string; getName: () => string; … }`. |
| 4 | `PickByType<User, string>` → `{ id: string; name: string }`. |
| 5 | `fillNulls` — the runtime side. No casts. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as` **in value position** (the `as` inside a mapped type is a
  different thing — that one you need).
- No `!`.

## Done when

```bash
npm run check 10/03
```

<details>
<summary>Hint 1 — removing a modifier</summary>

```ts
type Mutable<T> = { -readonly [K in keyof T]: T[K] };
type Concrete<T> = { [K in keyof T]-?: T[K] };
```

The minus sign removes; plain (or `+`) adds. `-?` strips optionality, which is
exactly how the built-in `Required<T>` is defined.
</details>

<details>
<summary>Hint 2 — renaming keys</summary>

```ts
{ [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] }
```

Two details: `Capitalize` is a built-in string-literal helper, and `string & K`
is needed because `keyof T` can include `number | symbol`, which template
literal types will not take.
</details>

<details>
<summary>Hint 3 — filtering keys</summary>

Mapping a key to `never` in the `as` clause **removes** it. So a conditional
there becomes a filter:

```ts
{ [K in keyof T as T[K] extends V ? K : never]: T[K] }
```

Keep the key when the condition holds; map to `never` to drop it.
</details>

<details>
<summary>Hint 4 — TODO 5 without a cast</summary>

Destructure into locals, check them all with `=== null`, then build the object
from the narrowed locals. Truthiness would wrongly reject `""`, `0` and `false`
— the test checks all three.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
homomorphic mapped types (why `Mutable<User>` keeps optionality), the two
meanings of `as`, and how the standard utility types are built.
