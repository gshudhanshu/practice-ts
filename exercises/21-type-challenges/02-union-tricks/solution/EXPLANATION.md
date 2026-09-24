# 21/02 — Union tricks

## `IsAny` — the only type assignable in both directions

```ts
type IsAny<T> = 0 extends 1 & T ? true : false;
```

`1 & T` is `1` for any ordinary `T` — intersecting a literal with something
unrelated leaves the literal (or `never`). And `0 extends 1` is false.

`any` breaks the rule: `1 & any` is `any`, and every type extends `any`. So the
conditional is true for `any` and false for everything else, including
`unknown` (`1 & unknown` is `1`).

Why care? Because an accidental `any` is the most expensive silent bug in a
typed codebase — it disables checking from that point outwards. `IsAny` lets a
test assert that a public API does *not* leak one, which is exactly what
`src/type-testing.ts` uses it for.

## `IsUnknown` — and why it has to ask `IsAny` first

```ts
type IsUnknown<T> = IsAny<T> extends true ? false : unknown extends T ? true : false;
```

`unknown extends T` is the natural test, and it is true for `unknown`. It is
also true for `any`, because `any` is assignable to everything *and* everything
is assignable to `any` — the two-way property from the previous section. So the
naive one-liner reports `any` as `unknown`, and every downstream decision built
on it is wrong in the most dangerous direction.

The fix is ordering: rule out the pathological type, then ask the ordinary
question. `IsUnion` in TODO 3 has the same shape — handle `never` before
distributing — and it is a habit worth generalising. When writing a type-level
predicate, ask what `any`, `unknown` and `never` each do to it *before* you
believe it.

Distinguishing the two matters at API boundaries: `unknown` is the safe "I do
not know yet, narrow me" type (02/05), while `any` is the unsafe "stop checking"
type. A lint rule cannot always tell them apart in an inferred position; a type
test can.

## `UnionToIntersection` — contravariance, in full

```ts
type UnionToIntersection<T> =
  (T extends unknown ? (arg: T) => void : never) extends (arg: infer I) => void
    ? I
    : never;
```

**Step 1** distributes: `A | B` becomes `((arg: A) => void) | ((arg: B) => void)`.

**Step 2** asks the compiler to find a single `(arg: I) => void` that the union
is assignable to.

Function parameters are **contravariant**: `(arg: Animal) => void` is assignable
where `(arg: Dog) => void` is expected, because a handler that copes with any
animal certainly copes with a dog. Reading that backwards — for one signature to
stand in for both members of the union, its parameter must accept everything
both of them accept, i.e. `A & B`.

`infer` in a contravariant position collects candidates by **intersecting**
them. In a covariant position (a return type) it unions them instead. That one
sentence is the whole trick, and it is a genuinely good thing to be able to say
out loud in an interview.

`UnionToIntersection<string | number>` being `never` follows directly: no value
is both a string and a number, so the intersection is uninhabited. That is a
correct answer, not a failure.

## `IsUnion` — one distributed copy, one not

```ts
type IsUnion<T, U = T> = [T] extends [never]
  ? false
  : T extends unknown
    ? [U] extends [T]
      ? false
      : true
    : never;
```

The second parameter is the whole idea. `T` is naked on the left of `extends`,
so the conditional distributes and `T` is one member inside the branch. `U`
never appears in that position, so it stays the entire original union.

`[U] extends [T]` therefore reads: *"is the whole union assignable to this one
member?"* — true only when there was exactly one member to begin with.

`never` is handled first, because a distributive conditional over `never`
produces `never`, and the answer we want is `false`.

`IsUnion<boolean>` is `true`, which surprises people: `boolean` is stored as
`true | false`. That is also why a distributive conditional applied to a
`boolean` yields two branches.

## `UnionToTuple` — and why it is the least trustworthy of these

```ts
type LastOf<T> =
  UnionToIntersection<T extends unknown ? () => T : never> extends () => infer R ? R : never;
```

Put `T` in **return** position and the intersection of the function types
behaves like a set of **overloads** rather than merging. When `infer` is applied
to an overloaded type, TypeScript resolves the **last** signature — so this
extracts a single member.

From there it is ordinary list-building: `Exclude<T, LastOf<T>>` is the rest,
recursion walks it, and the extracted member goes at the end.

**The honest caveat.** The order of members in a union is an *implementation
detail*. The specification treats a union as a set; the compiler happens to keep
declaration order, and `UnionToTuple` happens to reproduce it. It has been
stable for years and the assertions in this exercise pass — but a production
type whose correctness depends on union ordering is a type that can break on a
compiler upgrade. Use `UnionToTuple` to prove you understand the machinery, and
in real code prefer an explicit tuple (`["a", "b", "c"] as const`) with a
compile-time check that it covers the union.

## Where these actually earn their place

- **`UnionToIntersection`** — typing `Object.assign`-style merges, plugin
  systems where each plugin contributes properties to a shared context, and
  builder APIs that accumulate capabilities.
- **`IsAny`** — assertions in a library's own type tests, so a refactor that
  silently degrades an API to `any` fails CI.
- **`IsUnknown`** — distinguishing "the caller gave me something I must narrow"
  from "the type system has given up here", which a lint rule cannot always do
  for an inferred type.
- **`IsUnion`** — rare in application code; occasionally used by libraries to
  give a better error when a caller passes a union where one type is required.

## Common mistakes

| Mistake | What happens |
|---|---|
| `T extends any ? true : false` for `IsAny` | True for everything |
| `unknown extends T` for `IsAny` | Also true for `unknown` |
| `unknown extends T` alone for `IsUnknown` | Reports `any` as `unknown` |
| Wrapping only one side in a tuple | Distribution is still on |
| No `never` guard before distributing in `IsUnion` | `IsUnion<never>` is `never`, not `false` |
| `(arg: T) => void` written as `() => T` in TODO 2 | Returns are covariant — you get an overload, not an intersection |
| `IsUnion<T>` with one type parameter | Nothing to compare the member against |
| Relying on `UnionToTuple` order in production | Union order is unspecified |

## Interview angle

> *"Explain how `UnionToIntersection` works."*

Two steps: distribute the union into a union of functions that take `T` as a
parameter, then `infer` the parameter back out. The reason it inverts is that
parameters are contravariant, so the only signature assignable to all of them is
one whose parameter is the intersection. Add the contrast — `infer` in return
position unions the candidates instead — and you have said something most
candidates cannot.

> *"How would you detect an accidental `any` in a type test?"*

`0 extends 1 & T ? true : false`, and explain the mechanism: `1 & T` is `1` for
every type except `any`, which absorbs the intersection. Then say why it matters
— `any` propagates silently and disables checking downstream, so a library's own
type tests should assert its absence at the public boundary.
