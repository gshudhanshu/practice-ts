# 07/03 — Function overloads

## The anatomy

```ts
export function makeRange(count: number): number[];              // signature 1
export function makeRange(start: number, end: number): number[]; // signature 2
export function makeRange(a: number, b?: number): number[] {     // implementation
  …
}
```

The **implementation signature is not callable**. Callers only see signatures 1
and 2, which is why `makeRange(1, 2, 3)` is an error even though the
implementation would happily ignore a third argument.

The implementation must be *compatible with* every overload, which is why its
parameters widen to unions and its extra arguments become optional. TypeScript
checks that compatibility loosely — it will not verify that your implementation
returns `string` specifically for the string overload. Overloads are a promise
you make.

## Resolution order — first match wins

```ts
function describe(value: string | number): "mixed";   // broad first
function describe(value: string): "text";             // never reached for strings
```

TypeScript picks the **first signature that matches**, not the best one. With
the broad signature first, `describe("a")` matches it immediately and returns
`"mixed"`; the specific overload below is dead for that call.

**Rule: order overloads from most specific to most general.** This is the same
class of bug as ordering `catch` blocks or route handlers wrongly, and it is
silent — the code compiles and returns the wrong type.

## When overloads are the right tool

**Different arities meaning different things.** `makeRange(3)` and
`makeRange(2, 5)` genuinely take different arguments. A single
`(start: number, end?: number)` signature cannot express that one argument means
"count" while two mean "start and end".

**A return type that depends on the argument type.** `combine` must give
`string` for strings and `number[]` for arrays. A union parameter would return
`string | number[]`, forcing every caller to narrow a result they already know
the type of.

## When they are the wrong tool — TODO 3

```ts
function formatValue(value: string | number | boolean): string
```

Every input yields a `string`, so the return type does **not** depend on the
argument type. Overloading here would triple the line count and buy nothing.

The test: *does the return type change with the input type?* If no, use a union.

## When a generic beats both

```ts
function first<T>(items: readonly T[]): T | undefined
```

Overloads for `string[]`, `number[]`, `Item[]`… would be endless. A generic
relates input to output for *every* type at once.

Rough guidance:

| Situation | Reach for |
|---|---|
| Return type varies over an **open** set of types | generic |
| Return type varies over a **small fixed** set | overloads |
| Return type is always the same | union parameter |
| Different arities with different meanings | overloads |

`combine` is a fixed set of two (strings and number arrays) with different
*behaviour* per case, so overloads fit. Section 08 builds the generic side.

## Overloads do not narrow the implementation

Inside the implementation, TypeScript does **not** know which overload the
caller picked. `a` is `string | readonly number[]` regardless, so you still have
to narrow:

```ts
if (typeof a === "string" && typeof b === "string") return a + b;
if (typeof a !== "string" && typeof b !== "string") return [...a, ...b];
throw new TypeError("…");
```

The final `throw` is unreachable through the public overloads — they never allow
a mixed call. Keeping it means the function needs no cast, and it stays honest
for anyone calling from untyped JavaScript.

## Method overloads

Identical rules inside a class:

```ts
find(id: string): Item | undefined;
find(predicate: (item: Item) => boolean): Item | undefined;
find(idOrPredicate: string | ((item: Item) => boolean)): Item | undefined { … }
```

Normalising both entry points into one predicate keeps the body to a single
line of real work — the same "convert, then delegate" move as `fromFahrenheit`
in 06/02.

Note that overloads on an **interface** or object type are written as repeated
call signatures with no implementation, and constructors can be overloaded the
same way.

## Common mistakes

| Mistake | What happens |
|---|---|
| Broad overload listed first | The specific one never matches; `describe("a")` is `"mixed"` |
| Only writing the implementation signature | `combine` returns `string \| number[]`; the type assertions fail |
| Expecting the implementation signature to be callable | `makeRange(1,2,3)` should error, and does |
| Overloading `formatValue` | Compiles, but the exercise's point is that it is noise |
| `a.concat(b)` on the array branch without narrowing both | Compile error — `a` may still be a string |
| `(a as number[])` | Compiles, but casts are banned and unnecessary |

## Interview angle

> *"When would you use a function overload?"*

Two cases: different arities that mean different things, and a return type that
depends on the argument type. Then show judgement by naming the alternatives —
a union when the return type is constant, a generic when the type set is open.
Candidates who reach for overloads by default are flagged for it.

> *"What's the gotcha with overloads?"*

Two good answers. Resolution is **first match wins**, so ordering specific
before general is load-bearing and silently wrong if you get it backwards. And
the implementation signature is neither callable nor properly checked against
the overloads — TypeScript trusts you.
