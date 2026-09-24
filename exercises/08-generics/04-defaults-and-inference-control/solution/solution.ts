/**
 * Solution — 08/04 Type-parameter defaults & controlling inference
 */

// `TError = string` is a DEFAULT type argument: callers may omit it, and it
// behaves exactly as if they had written `string`. Defaults must come after all
// non-defaulted parameters, just like default function arguments.
export type ApiResponse<TData, TError = string> =
  | { ok: true; data: TData }
  | { ok: false; error: TError };

export function succeed<TData>(data: TData): ApiResponse<TData> {
  return { ok: true, data };
}

// No data, so TData is `never` — nothing can ever be read from the success
// branch of this value, which is exactly true.
export function failWith<TError>(error: TError): ApiResponse<never, TError> {
  return { ok: false, error };
}

// `const T` makes the compiler infer the narrowest possible type at the call
// site, as if the caller had written `as const`. Without it, T would be
// inferred as `string[]` and the tuple would be lost.
export function asTuple<const T extends readonly unknown[]>(values: T): T {
  return values;
}

export function pickOne<T>(
  options: readonly T[],
  // `NoInfer<T>` removes this position from inference, so T is decided by
  // `options` alone. A mismatched fallback is then an ERROR rather than a
  // silent widening of T to `string | number`.
  fallback: NoInfer<T>,
): T {
  const first = options[0];
  // `??` not `||`: a first option of "" or 0 is a real value.
  return first ?? fallback;
}

// A default on a CLASS type parameter: `Store` with no argument means
// `Store<Record<string, unknown>>`.
export class Store<TState = Record<string, unknown>> {
  #state: TState;

  constructor(initial: TState) {
    this.#state = initial;
  }

  get(): TState {
    return this.#state;
  }

  set(next: TState): void {
    this.#state = next;
  }

  update(derive: (current: TState) => TState): void {
    this.#state = derive(this.#state);
  }
}
