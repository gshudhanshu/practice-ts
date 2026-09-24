# 21/05 — Arithmetic & recursion

## Numbers are lengths

There is no `+` in the type system. There is `["length"]` on a tuple, which is a
numeric literal (21/01), and there is tuple construction. Everything here
follows from those two facts.

```ts
type BuildTuple<N extends number, Fill = unknown, Acc extends unknown[] = []> =
  Acc["length"] extends N ? Acc : BuildTuple<N, Fill, [...Acc, Fill]>;
```

The third parameter is an **accumulator**: callers never pass it, the recursion
threads it. Once you can build a tuple of length N, the rest is mechanical:

```ts
type Add<A, B>      = [...BuildTuple<A>, ...BuildTuple<B>]["length"];
type Subtract<A, B> = BuildTuple<A> extends [...BuildTuple<B>, ...infer R] ? R["length"] : never;
type GreaterThan<A, B> = BuildTuple<B> extends [...BuildTuple<A>, ...unknown[]] ? false : true;
```

`Subtract<2, 5>` is `never` because the prefix match fails — there is no
representation for a negative number here, and `never` says "no answer" honestly
rather than inventing one.

Concatenating `[...BuildTuple<A>, ...BuildTuple<B>]` is legal because a tuple
may contain at most **one** unbounded rest element, and both of these are
fixed-length by the time they are spread. `[...T, ...U]` with two open-ended
arrays is rejected.

## Tail-recursion elimination, measured

Write the recursive call as the entire branch and the compiler can reuse the
frame:

```ts
… ? Acc : BuildTuple<N, Fill, [...Acc, Fill]>        // tail position
… ? Acc : [...BuildTuple<N, Fill, [...Acc, Fill]>]   // wrapped in a tuple
```

The second form must keep every frame alive to build its result. Measured on
this repo's compiler (TypeScript 7.0.2):

| Form | Works at | Fails at |
|---|---|---|
| Tail-recursive (`BuildTuple`) | 999 | **1,000** |
| Non-tail-recursive (recursive call inside a tuple or template) | 48 | **49** |

The failure is `TS2589: Type instantiation is excessively deep and possibly
infinite` — a hard error, not a warning, and it appears at the *use* site rather
than the definition, which makes it confusing the first time.

TS 4.5 introduced the elimination precisely because these accumulator types were
already everywhere in libraries and were capping out at 45-ish. If you find
yourself near the limit, the first question is always "can this be rewritten in
tail position?".

## Cost, not just limits

Every step is a type instantiation, and instantiations are what make a build
slow. `Add<64, 36>` creates 100 intermediate tuples. `Range<0, 500>` creates 500
of them and then pattern-matches a 500-element prefix. Nothing about that is
free, and unlike runtime cost you pay it in every editor keystroke, not once per
request.

Use `--diagnostics` (or `--extendedDiagnostics`) to see instantiation counts if
a project's editor responsiveness falls off a cliff; a runaway recursive type is
one of the two usual culprits, the other being a large union.

## Where type-level arithmetic is genuinely worth it

Rarely, and always at a **boundary**:

- **Fixed-length APIs** — an RGB tuple, a 4×4 matrix, a fixed-arity callback:
  `BuildTuple<4, number>` beats writing `[number, number, number, number]` and
  keeps the size a parameter.
- **Index bounds** — `Range<0, Length<T>>` as the key type of a lookup, so an
  out-of-range index is a compile error.
- **Arity manipulation** — `curry`, `partial`, and middleware chains that drop
  or add parameters; these do arithmetic on `Parameters<F>` whether the author
  thought of it that way or not.

Where it is *not* worth it: business logic. If a type needs `Add` to express a
rule about money or dates, the rule belongs in a runtime check with a branded
type (see section 22) — the compiler is not a calculator, and a build that gets
30 seconds slower to prove `2 + 2 = 4` is a bad trade.

## `Enumerate` and `Range`

```ts
type Enumerate<N extends number, Acc extends number[] = []> =
  Acc["length"] extends N ? Acc : Enumerate<N, [...Acc, Acc["length"]]>;
```

One change from `BuildTuple`: push the accumulator's **current length** instead
of a filler, so each element records the index it was at.

```ts
type Range<Start extends number, End extends number> =
  Enumerate<End> extends [...Enumerate<Start>, ...infer R] ? R : never;
```

Drop the first `Start` items — the same prefix match as `Subtract`. Note what
this does not do: no step size, no negative direction, no bounds checking.
`Range<5, 2>` is `never`, matching the runtime `range(5, 2)` returning `[]` in
spirit if not in letter, and the test asserts the empty cases explicitly.

## Common mistakes

| Mistake | What happens |
|---|---|
| Wrapping the recursive call (`[...Rec<…>]`) | Depth limit drops from ~1,000 to ~48 |
| `Acc["length"] extends N` written as `N extends Acc["length"]` | Works for literals, breaks the moment N is `number` |
| No accumulator, recursing on `Subtract<N, 1>` | Needs subtraction to define subtraction |
| Expecting negatives from `Subtract` | There is no representation for them — `never` is the answer |
| `BuildTuple<A> extends [...BuildTuple<B>, ...infer R]` with the operands swapped | Silently computes B − A |
| Using this in application code for real sums | Slow builds, hard limits, no benefit |

## Interview angle

> *"Can TypeScript's type system do arithmetic?"*

Yes — by building tuples and reading their `length`, because a tuple type knows
its own length as a literal. Show `Add` in one line, then immediately name the
constraint: the recursion limit is about 1,000 levels with tail-call
elimination and about 48 without, so it is a boundary tool, not a calculator.

> *"What is tail-recursion elimination in TypeScript, and why does it matter?"*

Since 4.5, when a conditional type's recursive call is the *entire* branch, the
compiler reuses the frame instead of nesting, raising the practical depth limit
by roughly twenty times. It matters because the standard accumulator types —
counters, string splitters, path builders — are all naturally tail-recursive if
you write them that way, and accidentally wrapping the call in a tuple or
template literal is what turns a working type into `TS2589`.
