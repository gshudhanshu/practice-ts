/**
 * Exercise 08/04 — Type-parameter defaults & controlling inference
 *
 * Three features that let you shape what inference does:
 *
 *   T = Default   a default type argument (TS 2.3)
 *   const T       infer the narrowest type, as if the caller wrote `as const` (TS 5.0)
 *   NoInfer<T>    exclude a position from inference entirely (TS 5.4)
 *
 * Read README.md first. Replace every TODO.
 */

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// A result envelope. `TError` must DEFAULT to `string`, so callers who do not
// care can write `ApiResponse<User>` instead of `ApiResponse<User, string>`.
//
//   success -> { ok: true;  data: TData }
//   failure -> { ok: false; error: TError }
export type ApiResponse<TData> = unknown;

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// Two builders.
//   succeed(1)          -> ApiResponse<number>
//   failWith("nope")    -> a failure whose error type is inferred
//
// `failWith` has no data, so its TData should be `never`.
export function succeed(data: unknown): unknown {
  throw new Error("TODO 2: implement succeed");
}

export function failWith(error: unknown): unknown {
  throw new Error("TODO 2: implement failWith");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Return the array unchanged, but preserve its LITERAL tuple type without the
// caller having to write `as const`:
//   asTuple(["a", "b"])  ->  readonly ["a", "b"]     (not string[])
//
// There is a modifier you can put on the type parameter itself.
export function asTuple(values: readonly unknown[]): readonly unknown[] {
  throw new Error("TODO 3: implement asTuple");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// The first option, or the fallback when the list is empty.
//
// `T` must be inferred from `options` ONLY. Today a mismatched fallback widens
// T and the mistake compiles:
//   pickOne(["a", "b"], 1)   should be a COMPILE ERROR, not T = string | number
//
// Wrap the fallback's type so it takes no part in inference.
export function pickOne<T>(options: readonly T[], fallback: T): T {
  throw new Error("TODO 4: implement pickOne");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// A tiny store. Its state type must DEFAULT to `Record<string, unknown>`, so
// `Store` can be written with no type argument at all.
//   get()            the current state
//   set(next)        replace it
//   update(fn)       derive the next state from the current one
export class Store<TState> {
  #state: TState;

  constructor(initial: TState) {
    this.#state = initial;
  }
}
