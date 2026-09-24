# 21/01 — Tuple basics

## `length` is a property, not a computation

```ts
type Length<T extends readonly unknown[]> = T["length"];
```

A tuple type carries its length as a numeric **literal**; an array type carries
`number`. That single difference is what makes `Length<string[]>` be `number`
and not an error, and it is also the mechanism 21/05 uses to count: build a
tuple of the right size, then read `["length"]`.

## The variadic pattern

```ts
T extends readonly [infer H, ...infer R] ? … : …
```

Read it as *"if T is a list with at least one element, bind the first to `H` and
the rest to `R`"*. Everything else in this section is that pattern applied
repeatedly:

| Kata | Pattern |
|---|---|
| `Head` | `readonly [infer H, ...unknown[]]` |
| `Tail` | `readonly [unknown, ...infer R]` |
| `Last` | `readonly [...unknown[], infer L]` |
| `Pop` | `readonly [...infer R, unknown]` |

Two details are worth naming.

**Write `readonly` in the pattern.** A mutable tuple is assignable to the
readonly form, so `readonly [infer H, ...unknown[]]` matches both `[1, 2]` and
`readonly [1, 2]`. Drop the `readonly` and half the assertions fail.

**Do not `infer` positions you will not use.** `...unknown[]` says "anything, I
do not care" more clearly than `...infer _Rest`, and the compiler does less
work.

## Why `Head<[]>` is `never` and `Tail<[]>` is `[]`

`never` is the type with no values — the honest answer to "give me the first
element of a list that has none". `undefined` would be wrong: there is no
element, not an element whose value is missing.

`Tail<[]>`, on the other hand, is `[]`. Removing the first element of an empty
list still leaves you with a list. Getting these two base cases the right way
round is what stops a recursive type looping forever.

## Rest elements can go anywhere

Since TS 4.0 a rest element may sit at the start, middle or end of a tuple type:

```ts
type Last<T> = T extends readonly [...unknown[], infer L] ? L : never;
```

There is a limit: **one** rest element per tuple. `[...A, ...B]` where both are
unbounded arrays is rejected, because the compiler cannot know where one ends
and the other begins. It is fine when at most one of them is open-ended, which
is why `[...BuildTuple<A>, ...BuildTuple<B>]` in 21/05 works — both sides are
fixed-length by then.

## `const T` versus a plain type parameter

```ts
unshift([2, 3], 1);
```

Without `const`, `T` infers as `number[]` — array literals widen, so the tuple
information is gone before your type ever sees it, and `Unshift<T, V>` produces
`[number, ...number[]]`. With `const T` (08/03) the argument infers as
`readonly [2, 3]` and the result is the exact tuple `[1, 2, 3]`.

`const V` matters too: without it, `1` widens to `number`.

## A construction is checkable; a conditional is not

10/04 showed that a conditional return type cannot be verified inside a generic
function — the compiler cannot evaluate `ElementOf<T>` while `T` is unresolved.
`Unshift<T, V> = [V, ...T]` has no conditional in it, so there is nothing to
defer: the compiler compares `[value, ...items]` against `[V, ...T]`
structurally and accepts it.

That is a useful rule of thumb when designing type-level helpers you intend to
use in signatures: **prefer a form with no conditional at the top level**, and
you will not need a cast.

## Where this shows up in real code

- `Parameters<T>` is a tuple, so argument-manipulating helpers (`partial
  application`, `curry`, middleware pipelines) are all tuple surgery.
- `Promise.all` is typed with a mapped tuple: `{ [K in keyof T]: Awaited<T[K]> }`
  preserves position, which a plain array type could not.
- Typed SQL and route builders accumulate a tuple of parameters as you chain
  calls, then require exactly that tuple at execution.

## Common mistakes

| Mistake | What happens |
|---|---|
| `[infer H, ...unknown[]]` without `readonly` | `Head<readonly [1, 2]>` falls to the false branch |
| `Tail<[]>` returning `never` | Recursion built on it never terminates cleanly |
| `Head<[]>` returning `undefined` | Wrong — no element exists, so `never` |
| `T["length"]` written as `T.length` | `.` is value syntax; types use `[…]` |
| Forgetting `const T` on `unshift` | Argument widens to `number[]`, result loses the tuple |
| `readonly [...T, V]` for `Push` | Result is readonly; the assertions expect mutable |

## Interview angle

> *"How would you type a function that adds an element to a tuple and returns
> the longer tuple?"*

Variadic tuple types plus a `const` type parameter:
`function push<const T extends readonly unknown[], const V>(t: T, v: V): [...T, V]`.
The `const` half is the part most candidates miss — without it the argument
widens to an array and the whole point is lost.

> *"What is the difference between a tuple type and an array type?"*

Fixed, known length with per-position types, versus unbounded length with one
element type. The observable consequence: `T["length"]` is a literal for a tuple
and `number` for an array, and only a tuple can be destructured by pattern in a
conditional type. Mention that `as const` and `const` type parameters are the
two ways a value becomes a tuple rather than an array.
