/**
 * Solution — 22/02 Result<T, E>
 */

export type Ok<T> = { readonly ok: true; readonly value: T };

export type Err<E> = { readonly ok: false; readonly error: E };

export type Result<T, E> = Ok<T> | Err<E>;

// Returning Ok<T> rather than Result<T, never> is deliberate. `ok(1)` should
// not claim an error type it does not have, and the narrower return is what
// lets flatMap's `E | F` infer something useful at the call site.
export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

export function err<E>(error: E): Err<E> {
  return { ok: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.ok;
}

export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return !result.ok;
}

export function map<T, E, U>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E> {
  // On the error path the ORIGINAL object is returned, not a rebuilt one:
  // `Err<E>` is already a valid `Result<U, E>` whatever U turns out to be,
  // because U appears nowhere in it.
  return result.ok ? ok(fn(result.value)) : result;
}

export function mapErr<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F,
): Result<T, F> {
  return result.ok ? result : err(fn(result.error));
}

export function flatMap<T, E, U, F>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, F>,
): Result<U, E | F> {
  // `fn` returns Result<U, F>; the input could already be Err<E>. The union
  // E | F is not a convenience — it is the honest answer to "what can this
  // pipeline produce?", and it accumulates as steps are added.
  return result.ok ? fn(result.value) : result;
}

export function unwrapOr<T, E, U>(result: Result<T, E>, fallback: U): T | U {
  return result.ok ? result.value : fallback;
}

export function fromThrowing<T, E>(
  fn: () => T,
  onThrow: (reason: unknown) => E,
): Result<T, E> {
  try {
    return ok(fn());
  } catch (reason) {
    // `reason` is `unknown`, because JavaScript can throw anything. `onThrow`
    // is the single place where the ecosystem's exceptions become your own
    // error type — after this line, nothing downstream sees `unknown`.
    return err(onThrow(reason));
  }
}

export function all<T, E>(
  results: readonly Result<T, E>[],
): Result<readonly T[], E> {
  const values: T[] = [];

  for (const result of results) {
    // Short-circuit on the first failure and return that Err untouched, so no
    // information is lost by re-wrapping it.
    if (!result.ok) return result;
    values.push(result.value);
  }

  return ok(values);
}
