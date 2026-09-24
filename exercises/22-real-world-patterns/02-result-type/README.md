# 22/02 — `Result<T, E>`

**Tier:** Core · **Time:** ~30 min · **Course section:** 22 — Real-world patterns

---

## The problem with `throw`

```ts
function parseAge(raw: string): number;
```

That signature is a lie by omission. It can fail four ways, the compiler will
not mention any of them at the call site, and TypeScript has no `throws` clause
to declare them. Worse, `catch (e)` gives you `unknown`, because JavaScript can
throw anything — a string, `undefined`, a symbol.

Put the failure in the return type instead:

```ts
function parseAge(raw: string): Result<number, ParseError>;
```

Now the compiler will not let you read the number without checking, the error
type is documented and exhaustive, and adding a fifth failure mode is a compile
error at every call site that cared. Rust's `Result`, Kotlin's `Result`,
Haskell's `Either` and Go's `(value, err)` are all this shape.

This is [06/01](../../06-classes-interfaces/01-class-fundamentals/)'s
throw-vs-return question, answered properly. The line to hold:

> **Expected failures are returned. Bugs and impossible states throw.**

A missing user is expected. An unreachable branch in your own code is not.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `Ok<T>`, `Err<E>`, `Result<T, E>`, and the `ok` / `err` constructors. |
| 2 | `isOk` / `isErr` — type predicates, so they work in `.filter()`. |
| 3 | `map` (changes `T`, keeps `E`) and `mapErr` (the reverse). |
| 4 | `flatMap` (errors **union**) and `unwrapOr`. |
| 5 | `fromThrowing` and `all`. |

### Signatures the tests pin down

```ts
ok<T>(value: T): Ok<T>                       // not Result<T, never>
map<T, E, U>(r: Result<T, E>, fn): Result<U, E>
mapErr<T, E, F>(r: Result<T, E>, fn): Result<T, F>
flatMap<T, E, U, F>(r: Result<T, E>, fn): Result<U, E | F>
unwrapOr<T, E, U>(r: Result<T, E>, fallback: U): T | U
all<T, E>(results: readonly Result<T, E>[]): Result<readonly T[], E>
```

Two of those are worth staring at:

- **`flatMap` returns `E | F`.** Chaining a step that can fail adds its error to
  the union. That accumulation is the entire argument for the pattern — the
  type of a pipeline lists everything that can go wrong in it.
- **`unwrapOr` takes a fallback of any type `U`** and returns `T | U`. Forcing
  `U` to be `T` would break `unwrapOr(result, null)`, which is the commonest
  use.

### Behaviour

- `map` / `mapErr` / `flatMap` must **not call** their function on the branch
  that does not apply. There are tests for it.
- `all` short-circuits on the **first** error and returns it unchanged.
- `fromThrowing`'s `onThrow` receives `unknown`, never `any`.

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.
- `ok` returns `Ok<T>`, not `Result<T, never>` — the narrower type is what makes
  `flatMap`'s error union infer usefully.

## Done when

```bash
npm run check 22/02
```

<details>
<summary>Hint 1 — the discriminant</summary>

```ts
export type Ok<T> = { readonly ok: true; readonly value: T };
export type Err<E> = { readonly ok: false; readonly error: E };
export type Result<T, E> = Ok<T> | Err<E>;
```

A shared property with a *literal* type is what makes a union narrowable
(02/04). `ok: boolean` on both would narrow nothing.
</details>

<details>
<summary>Hint 2 — the error branch needs no rebuilding</summary>

```ts
export function map<T, E, U>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return result.ok ? ok(fn(result.value)) : result;
}
```

`result` on the false branch is `Err<E>`, and `Err<E>` is already a valid
`Result<U, E>` for *any* `U`, because `U` appears nowhere in it. Returning the
original object is both simpler and cheaper than rebuilding it.
</details>

<details>
<summary>Hint 3 — a predicate, not a boolean</summary>

```ts
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.ok;
}
```

`result.ok` already narrows on its own inside an `if`. These exist for the
positions where a property access will not do — `results.filter(isOk)` being
the one the tests check.
</details>

<details>
<summary>Hint 4 — <code>all</code> is a loop, not a <code>reduce</code></summary>

Push values until one fails, then return that `Err` directly. Short-circuiting
matters: the second failure in a list is usually a consequence of the first, and
reporting both is noise.
</details>

<details>
<summary>Hint 5 — where exceptions become values</summary>

```ts
try {
  return ok(fn());
} catch (reason) {
  return err(onThrow(reason));
}
```

`reason` is `unknown` because anything can be thrown. `onThrow` is the one place
the ecosystem's exceptions turn into your error type — after that line, nothing
downstream deals in `unknown`.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md).

Next: [22/03 — state machines](../03-state-machines/).
