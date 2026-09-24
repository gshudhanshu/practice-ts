# 20/05 — Stricter versions of the built-ins

## The four types

```ts
type StrictOmit<T, K extends keyof T>  = { [P in keyof T as P extends K ? never : P]: T[P] };
type StrictExclude<T, U extends T>     = T extends U ? never : T;
type StrictExtract<T, U extends T>     = T extends U ? T : never;
type DistributiveOmit<T, K extends keyof any> =
  T extends unknown ? { [P in keyof T as P extends K ? never : P]: T[P] } : never;
```

Three of the four bodies are unchanged from earlier exercises. The difference
lives entirely in the constraints — which is the lesson: **a utility type's
constraint is half its behaviour.**

## Why `Omit` is loose, in the team's own terms

`Pick<T, K extends keyof T>` is strict. `Omit<T, K extends keyof any>` is not.
That inconsistency is documented and intentional; the arguments for it are:

1. **Generic call sites.** In `function f<T>(x: T): Omit<T, "id">`, `keyof T` is
   unresolved. A strict constraint makes a great deal of reasonable generic code
   fail to compile, for no safety gain the caller can act on.
2. **Unions.** `Omit<Circle | Square, "radius">` is a legitimate thing to write.
   With a strict constraint it is an error, because `"radius"` is not a key of
   the union.
3. **Optional and partial shapes.** Omitting a key that *may* not be there is a
   normal thing to want when composing types.
4. **Compatibility.** `Omit` was standardised in TypeScript 3.5 after years of
   everyone hand-rolling it. Tightening it would break working code across the
   ecosystem, and the team weighs that heavily.

So the standard library optimises for *composability*; your application code
usually wants to optimise for *catching typos*. Both are right, in their own
context, which is why the practical advice is: use `StrictOmit` in application
code where `T` is a concrete type you own, and leave library-facing generic code
on the built-in.

## What strictness costs — `StrictExtract`

```ts
Extract<Shape, { kind: "circle" }>        // Circle  ✅
StrictExtract<Shape, { kind: "circle" }>  // ❌ error
```

Selecting one member of a discriminated union by a **partial shape** is the most
useful thing `Extract` does — it is how you write `Extract<Action, { type:
"submit" }>` without naming the variant's type. `U extends T` forbids it,
because `{ kind: "circle" }` is not assignable to `Shape`.

This is the honest trade-off and worth stating plainly: `StrictExtract` is right
for unions of **literals** (statuses, keys, event names), where a typo is the
only realistic mistake. For unions of **object types** the loose version is
strictly more useful, and the "error" you are protecting against is not one that
happens.

`StrictExclude` has a milder version of the same problem, so the same rule
applies.

## `DistributiveOmit` — the one that costs the most

```ts
type Shape = { kind: "circle"; id: string; radius: number }
           | { kind: "square"; id: string; side: number };

Omit<Shape, "id">              // { kind: "circle" | "square" }
DistributiveOmit<Shape, "id">  // { kind: "circle"; radius: number }
                               // | { kind: "square"; side: number }
```

`keyof` a union is the **intersection** of its members' keys — only what they
all have. `Omit` maps over that, so `radius` and `side` are gone before the omit
even runs, and what comes back is a single object type with a union-typed
discriminant. Narrowing on `kind` no longer produces anything useful, and the
failure is completely silent.

`T extends unknown ? … : never` fixes it by forcing the conditional to
distribute (10/04): the mapped type is applied to each member on its own and the
results are re-unioned. `T extends unknown` is not a real test — everything
extends `unknown` — it exists purely to make `T` naked so distribution kicks in.
`T extends T ? … : never` is the same trick written differently.

Where you will meet this:

- **React**: `Omit<ComponentProps<typeof Button>, "onClick">` where the props
  are a union of variants. The union collapses and every variant-specific prop
  disappears.
- **Reducers**: `Omit<Action, "meta">` over an action union.
- **API layers**: stripping `id` from a create-payload union.

`type-fest` ships this as `DistributedOmit`; several codebases call it
`UnionOmit`. Recognising the symptom — "my discriminated union turned into one
object after an `Omit`" — is the valuable part.

## The runtime half distributes too

```ts
const { id: _id, ...rest } = shape;   // shape: Circle | Square
return rest;                          // typed per member, no cast
```

Rest destructuring over a union-typed value is computed per member, so the
result lines up with `DistributiveOmit<Shape, "id">` exactly. It is a neat
demonstration that the type-level operation and the value-level one really are
the same operation: `Omit` is rest destructuring with the keys named up front.

## Common mistakes

| Mistake | What happens |
|---|---|
| `K extends keyof any` in `StrictOmit` | You have rebuilt the built-in, typos and all |
| `U extends T` on `Extract` for object unions | Partial-shape selection stops compiling |
| `[T] extends [unknown]` in `DistributiveOmit` | Distribution off — the union collapses again |
| Applying `DistributiveOmit` to a single object | Works, but identical to `Omit`; the point is unions |
| Assuming `keyof (A \| B)` gives every key | It gives only the shared ones |
| Using `StrictOmit` inside generic library code | Fails to compile where `keyof T` is unresolved |

## Interview angle

> *"Is there anything wrong with the standard `Omit`?"*

Two things, and say them in this order because the second is the one that costs
money: its constraint is `keyof any`, so a typo silently omits nothing; and it
is not distributive, so applying it to a discriminated union collapses the union
to its common keys. Then give the fixes — a `keyof T` constraint, and
`T extends unknown ? Omit<T, K> : never` — and finish with why the team chose
the loose version: generic call sites, union inputs and backwards compatibility.

> *"Would you replace `Omit` with your strict version everywhere?"*

No, and the reason matters. Strict constraints break generic code where `keyof
T` is not yet resolved, and `StrictExtract` gives up partial-shape selection,
which is the main reason to use `Extract` at all. The right answer is a strict
alias used deliberately in application code over concrete types, not a
project-wide ban on the built-in.
