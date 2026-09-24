# 20/05 — CHALLENGE: stricter versions of the built-ins

**Tier:** Challenge · **Time:** ~35 min · **Course section:** 20 — Utility types from scratch

---

## Why this exercise exists

Rebuilding the standard library teaches you how it works. This exercise is about
where it is **wrong for you**, which is the more senior conversation.

```ts
Omit<User, "pasword">          // compiles. Removes nothing.
Extract<Level, "trace">        // compiles. Returns never.
Omit<Circle | Square, "id">    // compiles. Destroys the union.
```

None of these go red. All three produce a type that is quietly not what you
meant, and the first is the most common refactoring bug in TypeScript: rename a
property, and every `Omit` mentioning the old name keeps compiling while
silently omitting nothing.

You will build the strict versions — and then find out what strictness costs,
because the loose behaviour is a deliberate design decision, not an oversight.
Being able to argue both sides is the point.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `StrictOmit<T, K>` — an unknown key is a compile error. |
| 2 | `StrictExclude<T, U>` — you may only subtract real members. |
| 3 | `StrictExtract<T, U>` — same, and the test pins down what it costs. |
| 4 | `DistributiveOmit<T, K>` — omit per union member, keeping the union. |
| 5 | `stripId(shape)` — the result must still narrow on `kind`. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.
- The bodies are all things you have already written. Every TODO here is about
  the **constraint** or about **distribution** — not about new syntax.

## Done when

```bash
npm run check 20/05
```

<details>
<summary>Hint 1 — TODO 1 changes four characters</summary>

The body is 20/02's `MyOmit`. The stdlib constrains `K extends keyof any`;
yours constrains `K extends keyof T`. That is the entire difference, and it
turns a silent no-op into a red squiggle at the call site.
</details>

<details>
<summary>Hint 2 — constraining a union filter</summary>

"Only members that are actually in `T`" is written `U extends T`. Then the body
is the same distributive conditional as 20/03.

Try `StrictExtract<Shape, { kind: "circle" }>` afterwards and watch it fail —
that is the trade-off the test asserts, and the reason the built-in is loose.
</details>

<details>
<summary>Hint 3 — why <code>Omit</code> flattens a union</summary>

`keyof (Circle | Square)` is only the keys they have in common. `Omit` maps over
that, so everything unique to a member is thrown away before the omit even
happens.

The fix is to make the conditional distribute so the omit is applied once per
member (10/04):

```ts
T extends unknown ? …one member at a time… : never
```
</details>

<details>
<summary>Hint 4 — TODO 5 needs no special handling</summary>

Rest destructuring over a union-typed value distributes as well: the compiler
computes the rest type per member, which is exactly what `DistributiveOmit`
produces. One destructure, one return, no cast.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
why the TypeScript team chose the loose behaviour, when a strict version is
wrong, and where `DistributiveOmit` earns its keep in React codebases.
