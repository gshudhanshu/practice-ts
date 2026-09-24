/**
 * Solution — 10/05 Template literal types
 */

// `Capitalize` is one of four built-in intrinsic string helpers, alongside
// `Uppercase`, `Lowercase` and `Uncapitalize`.
//
// This distributes over a union for free: the conditional-free template form
// still maps each member, so EventHandlerName<"click" | "focus"> is
// "onClick" | "onFocus".
export type EventHandlerName<T extends string> = `on${Capitalize<T>}`;

// `${string}` matches any string, so this accepts any URL with the right
// prefix — a cheap, purely compile-time guard at a boundary.
export type HttpsUrl = `https://${string}`;

// `${number}` matches any numeric literal, including negatives and decimals.
export type Pixels = `${number}px`;

export type RouteParams<T extends string> =
  // Case 1: a parameter with more path after it. `infer Rest` captures the
  // remainder, and the recursion keeps scanning it.
  T extends `${string}:${infer Param}/${infer Rest}`
    ? Param | RouteParams<Rest>
    : // Case 2: a parameter at the very end of the path.
      T extends `${string}:${infer Param}`
      ? Param
      : // Base case: no parameters left.
        never;

export function pathParamNames(path: string): string[] {
  const names: string[] = [];

  // `matchAll` (ES2020) needs the /g flag and yields every match with its
  // capture groups.
  for (const match of path.matchAll(/:([A-Za-z0-9_]+)/g)) {
    // Capture groups are `string | undefined` under noUncheckedIndexedAccess,
    // so narrow rather than assert — even though this group always matches.
    const name = match[1];
    if (name !== undefined) names.push(name);
  }

  return names;
}
