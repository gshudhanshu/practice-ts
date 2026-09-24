# 20/01 — Object modifiers: `Partial`, `Required`, `Readonly`, `Mutable`

**Tier:** Drill → Core · **Time:** ~20 min · **Course section:** 20 — Utility types from scratch

---

## Why this exercise exists

> *"Implement `Partial<T>` yourself."*

It is the single most-asked TypeScript interview question, and the answer is one
line. What separates a good answer from a passable one is the word
**homomorphic** — and being able to say what breaks without it.

A mapped type written directly over `keyof T` copies the source's `readonly` and
`?` across unless you explicitly change them. Map over a *computed* key union
instead and every modifier is silently discarded. `LosesModifiers<T>` in
`exercise.ts` is that mistake, preserved as a specimen so you can see the
difference in the assertions.

You wrote the mechanics in [`10/03`](../../10-deriving-types/03-mapped-types/).
This section is about rebuilding the standard library with them.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `MyPartial<T>` — every property optional. `readonly` must survive. |
| 2 | `MyRequired<T>` — every property mandatory. |
| 3 | `MyReadonly<T>` — every property `readonly`. `?` must survive. |
| 4 | `MyMutable<T>` — strips `readonly`. The stdlib has no such type. |
| 5 | `applyPatch(base, patch)` — the runtime side. No mutation, no casts. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.
- Do not use the built-in `Partial`, `Required` or `Readonly` to implement your
  own — the point is the mapped type, not the alias.

## Done when

```bash
npm run check 20/01
```

<details>
<summary>Hint 1 — the four one-liners share one shape</summary>

```ts
{ [K in keyof T] <modifier> : T[K] }
```

All four differ only in what sits in the modifier positions. There are two
slots: one before `[K in keyof T]` (`readonly`) and one after (`?`).
</details>

<details>
<summary>Hint 2 — the minus sign</summary>

`-` removes a modifier, `+` (the default, always omitted) adds it:

```ts
-readonly [K in keyof T]      // strip readonly
[K in keyof T]-?              // strip optional
```

`-?` also removes `undefined` from the property's type, which is why
`MyRequired<{ a?: string }>` is `{ a: string }` and not `{ a: string | undefined }`.
</details>

<details>
<summary>Hint 3 — TODO 5 without a loop</summary>

Object spread already has the semantics the patch needs: a key that is absent
from the patch object is not spread, so the base value stays. One `return`,
one object literal, two spreads.

Spreading into a **new** literal is also what stops `base` being mutated — the
test checks that.
</details>

<details>
<summary>Hint 4 — why the spread typechecks</summary>

`exactOptionalPropertyTypes` (03/03) means `MyPartial<Settings>` cannot hold an
explicit `undefined`. So every key the patch *does* carry has a real value, and
the spread cannot punch a hole in the required result type. Turn that flag off
and the same code is a lie the compiler accepts.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
homomorphism in detail, why `Required` and `Partial` are not exact inverses, and
why the standard library refuses to ship `Mutable`.
