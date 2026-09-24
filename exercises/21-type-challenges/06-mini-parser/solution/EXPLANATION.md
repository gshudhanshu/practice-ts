# 21/06 — A mini parser

## `Prettify` — the most useful four words in this repo

```ts
type Prettify<T> = { [K in keyof T]: T[K] };
```

Re-mapping every key onto itself produces a type that is *semantically*
identical and *practically* much better:

- tooltips show `{ a: string; b: number }` instead of
  `{ a: string } & { b: number }`;
- `Equal<Prettify<A & B>, { a: string; b: number }>` passes, where the
  unflattened version does not;
- error messages get shorter, which matters more than it sounds.

Any type that builds an object by intersecting pieces should be flattened once,
at the top. Note that it is **shallow** — nested objects keep their intersection
shape, and a recursive `DeepPrettify` costs depth for little benefit.

## `infer N extends number`, and the `"007"` quirk

```ts
S extends `${infer N extends number}` ? N : S
```

Since TS 4.8 an `infer` may carry a constraint, and for `number` the compiler
converts the captured string into a numeric literal type.

It only produces a **literal** when the string is the canonical spelling of that
number — when `String(Number(s)) === s`. Otherwise it widens to `number`:

| Input | Result |
|---|---|
| `"42"`, `"-3"`, `"1.5"` | `42`, `-3`, `1.5` |
| `"007"`, `" 12"`, `"0x10"`, `"1e3"` | `number` |
| `"asc"`, `"NaN"`, `"Infinity"` | unchanged string |

`"007"` and `7` are different strings, so keeping the literal would let the
compiler claim `"007" === "7"`. Widening to `number` is the conservative,
correct answer — and the runtime parser agrees, because `Number("007")` is `7`,
which is a `number`.

## Accumulating an object type

```ts
type ParsePairs<S extends string> =
  S extends `${infer Head}&${infer Rest}` ? ParsePair<Head> & ParsePairs<Rest> : ParsePair<S>;
```

There is no "add a property to this object type" operation, so intersection is
how accumulation is done. Each pair contributes a one-property object and `&`
piles them up; `Prettify` collapses the pile at the end.

`{ [P in K]: … }` is what turns a string *key* into an object. A string literal
type is a union of one member, so mapping over it behaves exactly as it would
over `"a" | "b"` — which is also how you would extend this to duplicate keys.

## `string extends S` — the widened-input guard

```ts
export type ParseQuery<S extends string> = string extends S
  ? Record<string, QueryValue>
  : Prettify<ParsePairs<S>>;
```

A literal like `"a=1"` is assignable to `string`; `string` is not assignable to
`"a=1"`. So `string extends S` is true **only** when `S` is the wide type — the
caller passed a runtime value and there is nothing to parse.

Without the guard, `parseQuery(someRuntimeString)` returns
`{ [x: string]: true }`: an index signature claiming every property exists and
every value is `true`. That is worse than useless, because it silently type-checks
code that will crash. Every library that infers from string literals needs this
check somewhere, and forgetting it is a common bug in home-grown versions.

## Where the two implementations can still drift

The test asserts they agree on the inputs it covers. They are not *proved*
equivalent, and there are gaps:

| Input | Type says | Runtime says |
|---|---|---|
| `"a=1&a=2"` | **`never`** — `{a: 1} & {a: 2}` is uninhabited | `{ a: 2 }` — last one wins |
| `"a=%20b"` | `{ a: "%20b" }` | `{ a: "%20b" }` — neither decodes; real parsing should |
| `"?a=1"` | `{ "?a": 1 }` | `{ "?a": 1 }` — neither strips the leading `?` |
| `"a=Infinity"` | `{ a: "Infinity" }` | `{ a: "Infinity" }` — the `isFinite` guard keeps these aligned |

The first row is a genuine divergence, and a good one to have found: a repeated
key makes the *whole* parsed type `never`, because an intersection with two
conflicting literal properties is uninhabited — while the runtime cheerfully
returns the last value. Fixing it means the recursion must overwrite keys rather
than intersect them (`Omit<Acc, K> & { [P in K]: V }`), which costs depth.
Knowing the failure exists is worth more than patching it here.

`Number.isFinite` is in the runtime code
*because* the type-level version cannot produce `Infinity`. Whenever you write a
type/runtime pair, the type usually dictates a slightly stricter runtime than
you would otherwise write, and that is a feature.

## The one cast

```ts
return out as ParseQuery<S>;
```

`ParseQuery<S>` is a deferred conditional while `S` is unresolved (10/04), so
nothing can be checked against it from inside the function. The alternatives are
worse: returning `Record<string, QueryValue>` throws away the entire point, and
an overload pair duplicates the signature without removing the assertion.

What makes this acceptable is containment: one line, commented, with everything
above it checked, and a public API that is precise for callers. That is the same
bargain as 08/05 and 10/06 — and it is the bargain nearly every inference-heavy
library makes internally.

## Is any of this a good idea in production?

Sometimes, in a narrow band:

- **Yes** for a library boundary where the string *is* the API — route paths,
  query keys, `select("id, name")` in an ORM, event names. The type is the
  documentation, and it catches typos at the call site.
- **No** for application code parsing data of unknown shape. Use a runtime
  validator (`zod`, `valibot`) and let it infer the type — same benefit, no
  recursion limits, and it validates the actual data rather than the literal
  someone typed.

The honest framing: this exercise teaches you to *read* the type-level code in
your dependencies and to reach for it deliberately at a boundary. It is not a
style to spread through a codebase.

## Common mistakes

| Mistake | What happens |
|---|---|
| No `Prettify` | Everything works, but `Equal` fails and tooltips are unreadable |
| Testing the number branch before the booleans | `"true"` parses fine, `ParseValue<"true">` is `"true"` |
| Bare `infer N` without `extends number` | `"42"` stays a string |
| Missing the `string extends S` guard | Runtime strings get an index signature of `true` |
| Forgetting `raw !== ""` at runtime | `Number("")` is `0`, so `"q="` becomes `{ q: 0 }` |
| Casting somewhere other than the return | More unsafety than the exercise needs |

## Interview angle

> *"How does a library like `zod` or a typed router know the shape of the thing
> it returns?"*

Generic inference plus type-level parsing: capture the caller's literal with a
`const` type parameter, take it apart with recursive template literal types, and
build the result object with mapped types. Then the honest part: the runtime
implementation is separate code, so the two are kept in step by tests, and the
public signature usually needs one contained assertion because the return type
is a deferred conditional.

> *"When would you not do this?"*

When the string is data rather than API. Type-level parsing only knows about
literals the developer typed; anything arriving from a network or a form needs a
runtime validator. Also name the ceilings — recursion depth (about 48 levels
non-tail-recursive) and compile time — because a type that makes the editor lag
is a type nobody will thank you for.
