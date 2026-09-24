# 02/03 — Tuples, `as const`, and unions instead of enums

## Why each answer is what it is

### Named tuple members

```ts
type Coordinate = [latitude: number, longitude: number];
```

The labels are **pure documentation** — `[latitude: number, longitude: number]`
and `[number, number]` are the *same type*, which is why the test's
`Equal<Coordinate, [number, number]>` passes either way. What you gain is that
editors show `latitude` / `longitude` in tooltips and parameter hints instead of
`0` / `1`. Free readability, zero cost.

### Why a tuple, not `number[]`

Beyond rejecting `[1, 2, 3]`, there is a strict-mode payoff:

```ts
const [lat, lon] = coordinate;
// tuple    -> lat: number
// number[] -> lat: number | undefined   (noUncheckedIndexedAccess)
```

The compiler knows a tuple's length, so destructuring needs no guard. That is
why `formatCoordinate` is three clean lines while `parseCoordinate` — which
starts from `split()`, a genuine `string[]` — has to check.

### `as const`, the highest-leverage two words in TypeScript

```ts
const a = ["debug", "info"];             // string[]
const b = ["debug", "info"] as const;    // readonly ["debug", "info"]
```

A const assertion does three things at once:

1. every literal keeps its literal type (`"debug"`, not `string`)
2. arrays become **readonly tuples** — length and order fixed
3. object properties become `readonly`

Then indexing the type with `number` collapses a tuple into the union of its
elements:

```ts
type LogLevel = (typeof LOG_LEVELS)[number];  // "debug" | "info" | "warn" | "error"
```

This is the **single source of truth** pattern. The array is the value you
iterate at runtime; the union is the type you check against at compile time; and
because one is derived from the other they can never drift apart. Adding
`"trace"` to the array automatically widens the type — no second edit, no chance
of forgetting.

### The `includes` trap

```ts
LOG_LEVELS.includes(value);
//                  ^ Argument of type 'string' is not assignable to
//                    parameter of type '"debug" | "info" | "warn" | "error"'
```

Once `LOG_LEVELS` is a tuple of literals, `includes` only accepts a `LogLevel` —
the exact thing you are trying to determine. It is a real design wart in the lib
types, and it catches nearly everyone.

Three ways out, best first:

```ts
LOG_LEVELS.some((level) => level === value);        // no cast needed
(LOG_LEVELS as readonly string[]).includes(value);  // widen the receiver
new Set<string>(LOG_LEVELS).has(value);             // O(1), nice for big lists
```

`.some` works because comparing a literal type to `string` is legal whenever the
two overlap.

### Type predicates

```ts
function isLogLevel(value: string): value is LogLevel
```

`value is LogLevel` makes this a **type predicate**. Returning plain `boolean`
compiles and behaves identically at runtime, but tells the compiler nothing — so
the caller's variable stays `string` inside the `if`.

The compiler does **not** verify that your implementation actually matches the
predicate. `function isLogLevel(v: string): v is LogLevel { return true; }`
compiles happily. A predicate is a promise you make; keep it.

## Common mistakes

| Mistake | What happens |
|---|---|
| Forgetting `as const` | `LogLevel` collapses to `string`; both type asserts fail |
| Writing the four strings again in a union | Works today, drifts tomorrow — and `_levelsAreFrozen` still fails |
| `Coordinate = number[]` | `[1,2,3]` compiles; the `@ts-expect-error` lines report as unused |
| Returning `boolean` from `isLogLevel` | `_narrowed` fails — `raw` stays `string` |
| `Number(rawLat)` without an empty check | `Number("")` is `0`, so `"12.5,"` wrongly parses |
| `parts[0]!` to dodge `undefined` | Compiles, but you have thrown away the safety the flag bought you |

## Interview angle

> *"`enum`, or a union of string literals?"*

Default to the union. A TS `enum` emits a real JavaScript object (so it is not
erasable, and it survives into your bundle), is **nominally** typed — a plain
`"debug"` will not satisfy `LogLevel.Debug` — and `const enum` has its own
inlining problems across modules. The `as const` + `[number]` pattern gives you
the same autocomplete and exhaustiveness with none of that, plus a runtime array
you can actually iterate, which a union type alone cannot give you.

Worth knowing: `enum` is disallowed under `--erasableSyntaxOnly` (TypeScript
5.8+), the flag that makes TS files runnable directly by Node's built-in type
stripping. The ecosystem is moving away from it.

> *"What is the difference between `as const` and `as SomeType`?"*

Completely unrelated despite the shared keyword. `as SomeType` is a **type
assertion** — you overriding the compiler, the main way to lie in TypeScript.
`as const` is a **const assertion**, an instruction to infer the *narrowest*
possible type. One reduces safety; the other increases it.
