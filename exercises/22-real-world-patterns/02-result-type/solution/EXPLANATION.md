# 22/02 — `Result<T, E>`

## What the type system can and cannot see

```ts
function parseAge(raw: string): number;              // can fail; type says nothing
function parseAge(raw: string): Result<number, ParseError>;  // says everything
```

TypeScript has no checked exceptions and no `throws` clause — a deliberate
decision, and mostly the right one, since Java's checked exceptions are widely
regarded as a failed experiment. The consequence is that a thrown error is
**invisible**: it does not appear in the signature, it does not appear at the
call site, and `catch (e)` hands you `unknown` because JavaScript permits
`throw "oops"`.

Moving the failure into the return type puts it back under the compiler's
supervision. Three concrete wins:

1. You **cannot read the value** without discriminating — `result.value` is a
   compile error on a bare `Result`.
2. The error type is **exhaustive and refactorable**: add a variant to
   `ParseError` and every `switch` on it that is not exhaustive fails to build.
3. The failure is **visible at the call site**, in the signature, without
   reading the implementation.

## `flatMap` unions the error types

```ts
flatMap<T, E, U, F>(r: Result<T, E>, fn: (value: T) => Result<U, F>): Result<U, E | F>
```

This is the line to understand. Chain a parse (`ParseError`) with a range check
(`RangeError`) and the result is `Result<number, ParseError | RangeError>` —
the type of the pipeline now lists everything that can go wrong in it, derived
automatically.

Compare with exceptions, where the equivalent knowledge exists only in the
implementation of every function you happen to call, and goes stale silently.

The corresponding trap is a growing union nobody wants to handle. The escape
hatch is `mapErr`, which collapses several error types into one at a layer
boundary — deliberately, in one visible place, rather than by accident.

## `ok` returns `Ok<T>`, not `Result<T, never>`

Both compile. `Ok<T>` is the useful one:

- `ok(1)` should not claim an error type it does not have.
- `Result<T, never>` makes `flatMap`'s `E | F` infer `never | F`, which works,
  but the narrower constructor keeps inference honest in longer chains and
  reads better in tooltips.

## `unwrapOr` with a third type parameter

```ts
unwrapOr<T, E, U>(result: Result<T, E>, fallback: U): T | U
```

`unwrapOr(result, null)` is the commonest call, and forcing `U = T` would reject
it. Returning `T | U` costs nothing and the tests pin both `number | string` and
`number | null`.

One TypeScript wrinkle worth knowing: `unwrapOr(result, "none")` infers
`U = "none"`, the literal, not `string` — literal types survive inference into
an unconstrained parameter here. Pass a `string`-typed variable if you want the
wider type. That is why the test uses a declared `fallbackString` rather than a
bare literal.

## `fromThrowing` is the adapter, not the pattern

You cannot make `JSON.parse` return a `Result`, and you should not try to
convert an entire codebase. `fromThrowing` is the boundary:

```ts
fromThrowing((): unknown => JSON.parse(raw), (reason) => ({ kind: "bad-json", reason }))
```

`reason` is `unknown` — the only honest type for a `catch` binding — and
`onThrow` is where it becomes your union. Everything downstream deals in domain
errors.

## Where NOT to use it

Being able to say this is what separates a considered answer from a fashion:

- **Programmer errors.** An index out of range, an unreachable branch, a broken
  invariant — those should throw. Wrapping a bug in a `Result` invites a caller
  to "handle" it and carry on with corrupt state.
- **Anything a framework already handles.** An Express route or a React error
  boundary that turns a throw into a 500 or a fallback UI is doing the right
  thing already.
- **Deep chains with a single failure mode.** If every layer just propagates,
  `try/catch` at the top is less ceremony. `Result` pays off when the caller has
  something *specific* to do.
- **Mixed styles in one module.** Half-`Result`, half-throw is worse than either.
  Pick a boundary — usually "the domain returns, the edges throw" — and hold it.

## `map` on the error branch returns the same object

```ts
return result.ok ? ok(fn(result.value)) : result;
```

`Err<E>` is a valid `Result<U, E>` for *any* `U`, because `U` does not appear in
it — so no rebuilding is needed and no information is lost. Same reasoning in
`flatMap` and `all`, and it is why `all` returns the original `Err` rather than
`err(result.error)`.

## Common mistakes

| Mistake | What happens |
|---|---|
| `ok: boolean` instead of `true` / `false` | The union stops narrowing entirely |
| `map` returning `Result<U, unknown>` | Error types stop surviving a pipeline |
| `flatMap` returning `Result<U, F>` | The input's own errors vanish from the type |
| `unwrapOr(result, fallback: T)` | `unwrapOr(result, null)` no longer compiles |
| Calling `fn` before checking `ok` | The "does not call the function" tests fail |
| `all` collecting every error | The first failure usually causes the rest |
| `onThrow(reason: any)` | Re-introduces the `any` the pattern exists to remove |

## Interview angle

> *"Would you throw, or return an error value?"*

Draw the line explicitly: **expected outcomes are returned, bugs throw.** Then
argue it from the type system — TypeScript has no checked exceptions, so a
thrown error is invisible in the signature and `catch` gives you `unknown`,
while a `Result` puts the failure where the compiler can insist on it. Finish
with the costs, because they are real: ceremony at every call site, error unions
that grow, and interop with an ecosystem that throws. Someone who lists only
the benefits has not shipped it.

> *"How does `Result` compose?"*

`map` transforms the value, `mapErr` the error, `flatMap` chains a step that can
itself fail — and `flatMap`'s error type is the **union** of both, which is the
part worth showing on a whiteboard. Add that `all` turns a list of Results into
a Result of a list, short-circuiting on the first failure, and you have
described the whole algebra in four sentences.
