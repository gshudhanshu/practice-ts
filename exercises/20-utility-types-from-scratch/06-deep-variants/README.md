# 20/06 — CHALLENGE: deep variants

**Tier:** Challenge · **Time:** ~40 min · **Course section:** 20 — Utility types from scratch

---

## Why this exercise exists

The section finale, and the one type-level question most likely to come up in a
senior interview after "implement `Partial`":

> *"Now make it deep."*

The recursion itself is three lines. What separates a real answer from a
tutorial answer is knowing that **"recurse into objects" is a lie**:

- arrays and tuples are objects — but a homomorphic mapped type handles them
  correctly, for free, and knowing *that* saves you a special case;
- `Date`, `RegExp` and functions are objects — recurse into them and a `Date`
  becomes `{}` and a function loses its call signature;
- `Map` and `Set` are objects — recurse into them and you get a bag of readonly
  method properties whose mutators still work;
- and the recursion needs a way to terminate.

That is why `DeepPartial` is not in the standard library: there is no single
correct answer, only a set of trade-offs somebody has to choose.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `DeepReadonly<T>` — leaves stay leaves; arrays and tuples keep their shape. |
| 2 | `DeepMutable<T>` — the inverse; the round trip must give `Config` back. |
| 3 | `DeepPartial<T>` — including the array caveat the test pins down. |
| 4 | `DeepReadonlyUpTo<T, D>` — recursion with a depth budget. |
| 5 | `deepFreeze(config)` — the runtime half. Cycle-safe, no casts. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.
- `Atom` and `Depth` are given. Everything else is yours.

## Done when

```bash
npm run check 20/06
```

<details>
<summary>Hint 1 — the shape of all three deep types</summary>

```ts
type Deep<T> = T extends Atom ? T : { [K in keyof T]: Deep<T[K]> };
```

A conditional to stop at the leaves, a homomorphic mapped type to walk
everything else, and the recursive call on `T[K]`. TODOs 1 to 3 differ only in
the modifier slot.
</details>

<details>
<summary>Hint 2 — do not special-case arrays</summary>

You may be tempted to write `T extends readonly (infer E)[] ? readonly Deep<E>[] : …`.
You do not need it: a homomorphic mapped type over an array produces an array
and over a tuple produces a tuple. Adding the branch by hand is how people
accidentally turn `[number, number]` into `number[]`.
</details>

<details>
<summary>Hint 3 — counting down without arithmetic</summary>

There is no `D - 1` at the type level. Index a tuple instead:

```ts
type Prev = [never, 0, 1, 2, 3, 4];
// Prev[3] is 2
```

Check the budget **before** the leaf check, so `DeepReadonlyUpTo<X, 0>` returns
`X` untouched.
</details>

<details>
<summary>Hint 4 — TODO 5 needs no cast</summary>

`Object.freeze` is one level deep. Walk the graph yourself — `Object.values`
covers arrays and plain objects in one call — and return the same object. A
mutable value is already assignable to its deeply-readonly type, because
`readonly` is not checked across assignment.

Guard with `Object.isFrozen` *before* recursing. Without it, the cyclic-graph
test never returns.
</details>

<details>
<summary>Hint 5 — <code>typeof null</code></summary>

`typeof null === "object"` (02/04). Every recursive walk over unknown data needs
that check, and forgetting it is how `Cannot convert undefined or null to
object` reaches production.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
why the homomorphic array behaviour works, what `Map` and `Set` actually turn
into and how `type-fest` fixes them, and when the depth limiter earns its
keep.

**That completes section 20.** See the [section index](../README.md) for what
you should now be able to write from memory.
