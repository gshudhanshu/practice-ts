/**
 * Solution — 10/06 Typed deep paths
 */

export type AppState = {
  count: number;
  darkMode: boolean;
  user: {
    name: string;
    email: string;
    address: {
      city: string;
    };
  };
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * The "mapped type indexed by keyof" idiom.
 *
 * The mapped type builds { count: {key:"count"; value:number}, … } — an object
 * whose VALUES are the union members you want. Indexing it with `keyof T` then
 * collapses that object into the union of its value types.
 */
export type ChangeEvent<T> = {
  [K in keyof T]: { key: K; value: T[K] };
}[keyof T];

/**
 * A nested object contributes BOTH its own key and every path beneath it, so
 * each branch is `K | \`${K}.${Paths<T[K]>}\``.
 *
 * `keyof T & string` because template literals need string keys (10/03), and
 * the outer `[keyof T & string]` collapses the mapped type to a union again.
 */
export type Paths<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? K | `${K}.${Paths<T[K]>}`
        : K;
    }[keyof T & string]
  : never;

export type ValueAt<T, P extends string> =
  // Split on the FIRST dot: `Head` is one key, `Rest` is the remaining path.
  P extends `${infer Head}.${infer Rest}`
    ? Head extends keyof T
      ? ValueAt<T[Head], Rest>
      : never
    : // No dot left — P is a single key.
      P extends keyof T
      ? T[P]
      : never;

export function getPath<T extends object, P extends string & Paths<T>>(
  subject: T,
  path: P,
): ValueAt<T, P> {
  let current: unknown = subject;

  for (const segment of path.split(".")) {
    // Narrowed properly — the loop needs no assertions.
    if (!isRecord(current)) {
      throw new TypeError(`cannot read "${segment}"`);
    }
    current = current[segment];
  }

  // The one permitted cast. `ValueAt<T, P>` is a DEFERRED conditional while T
  // and P are generic (10/04), so the compiler cannot check `current` against
  // it — even though it resolves correctly at every call site. The unsafety is
  // contained to this line, behind a signature that rejects bad paths.
  return current as ValueAt<T, P>;
}

export function describeChange(event: ChangeEvent<AppState>): string {
  // The discriminant is `key`, so this narrows exactly like any hand-written
  // discriminated union (02/04) — but it was DERIVED from AppState.
  switch (event.key) {
    case "count":
      return `count -> ${event.value}`;
    case "darkMode":
      return `darkMode -> ${event.value}`;
    case "user":
      return `user -> ${event.value.name}`;
    default:
      // Add a field to AppState and this line stops compiling.
      return assertNever(event);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled: ${JSON.stringify(value)}`);
}
