/**
 * Exercise 22/02 — Result<T, E>
 *
 * A thrown exception is invisible to the type system. This signature:
 *
 *   function parseAge(raw: string): number
 *
 * says nothing about the four ways it can fail, and the compiler will not
 * mention them at the call site. `throws` clauses do not exist in TypeScript,
 * and `catch (e)` gives you `unknown`, because anything can be thrown.
 *
 * The alternative is to put the failure in the RETURN type, as a discriminated
 * union (02/04, 09/03):
 *
 *   function parseAge(raw: string): Result<number, ParseError>
 *
 * Now the compiler will not let you read the number without checking, and the
 * error type is documented, exhaustive and refactorable. Rust, Go, Kotlin's
 * `Result`, Haskell's `Either` and every functional-ish TS codebase converge
 * on this shape.
 *
 * The line to hold — the one 06/01 introduced — is:
 *
 *   EXPECTED failures are returned. BUGS and impossible states throw.
 *
 * A missing user is expected. A null pointer in your own code is not.
 *
 * Read README.md first. Replace every TODO.
 */

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// The type and its two constructors.
//
//   Ok<T>          { readonly ok: true;  readonly value: T }
//   Err<E>         { readonly ok: false; readonly error: E }
//   Result<T, E>   Ok<T> | Err<E>
//
//   ok(value)      returns Ok<T>   — NOT Result<T, never>; the narrower type
//                  is what lets flatMap infer a union of error types
//   err(error)     returns Err<E>
//
// `ok` is the discriminant. A shared literal-typed property is what makes the
// union narrowable.
export type Ok<T> = { readonly ok: true };

export type Err<E> = { readonly ok: false };

export type Result<T, E> = Ok<T> | Err<E>;

export function ok<T>(value: T): Ok<T> {
  throw new Error("TODO 1: implement ok");
}

export function err<E>(error: E): Err<E> {
  throw new Error("TODO 1: implement err");
}

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// Two type predicates. `result.ok` already narrows on its own — these exist so
// a Result can be narrowed in a position where a property access will not do,
// such as `results.filter(isOk)`.
export function isOk<T, E>(result: Result<T, E>): boolean {
  throw new Error("TODO 2: implement isOk");
}

export function isErr<T, E>(result: Result<T, E>): boolean {
  throw new Error("TODO 2: implement isErr");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Transform one side, leave the other alone.
//
//   map(ok(2), n => n * 2)          ->  ok(4)
//   map(err("bad"), n => n * 2)     ->  err("bad")     — fn is NOT called
//   mapErr(err(404), String)        ->  err("404")
//
// Note the type parameters: `map` changes T and keeps E; `mapErr` does the
// reverse. That asymmetry is what makes error types survive a pipeline.
export function map<T, E, U>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E> {
  throw new Error("TODO 3: implement map");
}

export function mapErr<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F,
): Result<T, F> {
  throw new Error("TODO 3: implement mapErr");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Chaining, and getting out.
//
//   flatMap(ok(2), n => n > 0 ? ok(n) : err("negative"))
//
// The result's error type is `E | F` — the error the input already had, UNION
// the one the step can add. That union is the whole reason to prefer a Result
// over a thrown error: it accumulates, in the type, everything that can go
// wrong in a pipeline.
//
//   unwrapOr(ok(2), 0)        ->  2
//   unwrapOr(err("x"), 0)     ->  0
//
// `unwrapOr` takes a fallback of ANY type and returns `T | U`. Forcing the
// fallback to be a `T` would stop `unwrapOr(result, null)` compiling, which is
// the most common use of it.
export function flatMap<T, E, U, F>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, F>,
): Result<U, E | F> {
  throw new Error("TODO 4: implement flatMap");
}

export function unwrapOr<T, E, U>(result: Result<T, E>, fallback: U): T | U {
  throw new Error("TODO 4: implement unwrapOr");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// The two adapters that make the pattern usable in a real codebase.
//
//   fromThrowing(fn, onThrow)   run a throwing function (JSON.parse, a library
//                               call) and capture the failure. `onThrow` maps
//                               the `unknown` a catch gives you into YOUR error
//                               type — the boundary where the ecosystem's
//                               exceptions become your union.
//
//   all(results)                every Ok -> ok of all the values, in order;
//                               otherwise the FIRST Err, unchanged.
//                               Short-circuiting matters: the second failure
//                               in a list is usually a consequence of the first.
export function fromThrowing<T, E>(
  fn: () => T,
  onThrow: (reason: unknown) => E,
): Result<T, E> {
  throw new Error("TODO 5: implement fromThrowing");
}

export function all<T, E>(
  results: readonly Result<T, E>[],
): Result<readonly T[], E> {
  throw new Error("TODO 5: implement all");
}
