# 10/04 — Conditional types & `infer`

**Tier:** Core → Challenge · **Time:** ~30 min · **Course section:** 10 — Deriving types

---

## Why this exercise exists

```ts
T extends U ? X : Y   // a type-level if/else
infer P               // capture a type from inside the pattern
```

Between them these build every derived type in the standard library —
`ReturnType`, `Awaited`, `Exclude`, `NonNullable` are all conditionals with an
`infer` or two.

The part that surprises everyone is **distribution**: a conditional over a naked
type parameter runs once per union member. TODO 4 exists to make that concrete,
and it is the single most common source of "why is my type a union?".

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `IsArray<string[]>` → `true`; `IsArray<string>` → `false`. |
| 2 | `ElementOf<string[]>` → `string`; `ElementOf<string>` → `never`. |
| 3 | `DeepAwaited<Promise<Promise<string>>>` → `string`. **Recursive.** |
| 4 | `Distributed<string \| number>` → `string[] \| number[]`, but `Collected<string \| number>` → `(string \| number)[]`. |
| 5 | `firstElement` — the runtime bridge. Read the comment first; there is a trap. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.

## Done when

```bash
npm run check 10/04
```

<details>
<summary>Hint 1 — `infer` placement</summary>

```ts
type ElementOf<T> = T extends readonly (infer E)[] ? E : never;
```

`infer E` sits **where the type you want appears** in the pattern. If the
pattern matches, `E` is bound to whatever was there; otherwise the false branch
runs.

Use `readonly (infer E)[]` rather than `(infer E)[]` so readonly arrays match
too — one of the assertions checks that.
</details>

<details>
<summary>Hint 2 — recursion</summary>

A conditional type may name itself:

```ts
type DeepAwaited<T> = T extends Promise<infer U> ? DeepAwaited<U> : T;
```

Each step peels one layer; the false branch is the base case.
</details>

<details>
<summary>Hint 3 — turning distribution on and off</summary>

**On** (the default) — `T` is *naked* on the left of `extends`:

```ts
type Distributed<T> = T extends unknown ? T[] : never;
```

**Off** — wrap **both** sides in a one-element tuple:

```ts
type Collected<T> = [T] extends [unknown] ? T[] : never;
```

Wrapping only one side does not work; it has to be both.
</details>

<details>
<summary>Hint 4 — TODO 5's trap</summary>

`ElementOf<T> | undefined` looks like the obvious return type and will not
compile. Inside the function `T` is still generic, so the conditional is
**deferred** — the compiler cannot evaluate it and so cannot prove `items[0]`
matches.

An indexed access (`T[number]`) needs no evaluation and resolves to the same
thing at every call site.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
why `never` distributes to nothing, why `boolean` splits into two, and when a
deferred conditional will block you.
