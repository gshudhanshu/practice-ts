# 02/06 — `unknown`, type guards, exhaustiveness

## The three "top and bottom" types

| Type | Meaning | Assignable **to** it | Assignable **from** it |
|---|---|---|---|
| `any` | checking disabled | everything | everything |
| `unknown` | "some value, not yet proven" | everything | nothing (until narrowed) |
| `never` | no value can exist | nothing | everything |

`unknown` is the **safe** top type; `any` is the unsafe one. `never` is the
bottom type — the empty set.

### Why `any` is worse than it looks

`any` is not merely "unchecked here". It is **contagious**: assign it to a
variable, pass it to a function, spread it into an object, and everything it
touches stops being checked too. `JSON.parse` returning `any` means a single
unguarded parse can silently disable type safety across an entire module.

`safeJsonParse` is the containment pattern: `any` enters at exactly one line and
is immediately re-typed as `unknown`. Callers are then forced to prove what they
have. One annotation, and the blast radius drops to zero.

> The same trick applies to `catch (e)`. With `useUnknownInCatchVariables` (part
> of `strict`), `e` is already `unknown` — narrow before use.

## `isRecord` — the two JavaScript traps

```ts
typeof null === "object"   // true. A 1995 bug, permanent for compatibility.
typeof [] === "object"     // true. Arrays are objects.
```

So all three checks are load-bearing:

```ts
typeof value === "object" && value !== null && !Array.isArray(value)
```

And the return type must be the predicate `value is Record<string, unknown>`.
With plain `boolean`, `parseUser` cannot read a single property afterwards.

Note what you get back: `Record<string, unknown>`, so every property is
`unknown` and must be proven individually. That is correct — knowing something
is an object tells you nothing about its contents.

## `parseUser` — validation is where types meet reality

The type `User` is a **compile-time** claim. At runtime, `parseUser` is what
makes it true. This is why "parse, don't validate" is the phrase people use:
the function does not return a boolean and leave you holding `unknown`, it
returns a `User` or nothing.

Two details worth noticing:

**Extra properties are dropped, not copied.** Building a fresh object rather
than returning `input` means the result contains exactly the declared fields —
no accidental passthrough of a hostile `isAdmin` flag.

**`exactOptionalPropertyTypes` forces honesty about `age`.**

```ts
const user: User = { id, name, email };
if (typeof age === "number") user.age = age;
```

Writing `{ id, name, email, age }` when `age` is `undefined` is a compile error
under that flag, and rightly so: `{ age: undefined }` and `{}` behave
differently under `in`, `Object.keys`, and `JSON.stringify`.

## Exhaustiveness with `never`

```ts
default:
  return assertNever(event);
```

In `default`, every handled case has been eliminated, so `event` narrows to
`never` — and `never` is assignable to a `never` parameter. Handle one case
fewer and the leftover member is *not* assignable, so the line fails to compile.

This turns "add a case for the new event type" from a code-review comment into a
build error. It is the single highest-value pattern in this whole section, and
it scales: every new union member fails every non-exhaustive switch in the
codebase at once.

`assertNever` also throws at runtime, which covers the case where bad data
arrives from outside the type system — precisely what `parseUser` guards.

## A genuinely surprising bug: `ReturnType<>` and `never` parameters

This one caught out the test file for this very exercise.

```ts
declare function assertNever(value: never): never;
type R = ReturnType<typeof assertNever>;   // any (!) — not never
```

Why? `ReturnType` is defined as:

```ts
type ReturnType<T extends (...args: any) => any> =
  T extends (...args: any) => infer R ? R : any;
```

Matching requires `(...args: any)` to be assignable to `(value: never)`.
Parameters are checked **contravariantly**, so this asks whether `any` is
assignable to `never` — and `never` is the one type `any` is *not* assignable
to. The conditional fails, and it falls through to the `: any` branch.

So the assertion in the test compares the **whole signature** instead:

```ts
Expect<Equal<typeof assertNever, (value: never) => never>>
```

Useful for two reasons: it is a real trap, and it is a compact demonstration of
why `Equal<X, any>` silently passing is a thing to watch for. `IsAny<T>` exists
in `src/type-testing.ts` for exactly this.

## Common mistakes

| Mistake | What happens |
|---|---|
| `safeJsonParse(): any` | `_parseReturnsUnknown` fails; the `@ts-expect-error` on `parsed.anything` reports as unused |
| `isRecord(): boolean` | `parseUser` cannot read properties; narrowing assertion fails |
| Forgetting `!Array.isArray` | `isRecord([])` returns true |
| `parseUser` returning `input` directly | Extra properties leak through; the "ignores extras" test fails |
| `{ id, name, email, age }` unconditionally | Compile error under `exactOptionalPropertyTypes` |
| `default: throw new Error(...)` | Compiles forever — you lose the compile-time guarantee entirely |
| `assertNever(value: unknown)` | Accepts anything; the exhaustiveness check becomes decorative |

## Interview angle

> *"What is the difference between `any` and `unknown`?"*

Both accept any value. The difference is what you may **do** with one: `unknown`
permits nothing until you narrow, `any` permits everything and spreads that
permissiveness to anything it touches. Rule of thumb: `unknown` at boundaries,
`any` essentially never — and if you must, contain it on one line.

> *"How do you make sure a `switch` stays exhaustive?"*

The `assertNever` pattern. Then add the part that shows experience: it only
works if the union is discriminated by literal types, and it is a *compile-time*
guarantee — you still need the runtime `throw` for data that arrives from
outside the type system.

> *"Would you hand-write validators like `parseUser` in production?"*

For a couple of shapes, yes. Beyond that, a schema library — Zod, Valibot,
ArkType — because it derives the TypeScript type *from* the schema, so the
validator and the type cannot drift apart. Hand-written guards have exactly that
failure mode: someone adds a field to `User` and forgets `parseUser`. Knowing
*why* the tool exists is much better than just naming it.
