/**
 * Solution — 02/05 Function types, callbacks, `void` and `never`
 */

// A function type expression. Parameter NAMES are documentation only — this is
// the same type as `(n: number) => number`.
export type Transformer = (value: number) => number;

// A rest parameter is always an array type, and always comes last.
export function applyAll(
  values: readonly number[],
  ...transformers: Transformer[]
): number[] {
  return values.map((value) =>
    transformers.reduce((accumulator, transform) => transform(accumulator), value),
  );
}

// A default value makes the parameter optional *and* removes `undefined` from
// its type inside the body — better than `separator?: string` plus a branch.
export function slugify(text: string, separator: string = "-"): string {
  return text
    .toLowerCase()
    // Splitting on runs of non-alphanumerics gives empty strings at the ends
    // for input like "!!!hello!!!" — filtering them out handles leading and
    // trailing separators without any extra trimming pass.
    .split(/[^a-z0-9]+/)
    .filter((part) => part !== "")
    .join(separator);
}

export function forEachIndexed(
  items: readonly string[],
  callback: (item: string, index: number) => void,
): void {
  items.forEach((item, index) => {
    // The return value is deliberately discarded. Declaring the parameter as
    // `=> void` is what lets callers pass a function that returns something.
    callback(item, index);
  });
}

// `never` means "this function does not return control to the caller".
// It is not the same as `void`, which means "returns, but with no value".
export function fail(message: string): never {
  throw new Error(message);
}

export function getOrFail(value: string | null): string {
  if (value === null) {
    // Because `fail` is typed `never`, the compiler knows this branch cannot
    // fall through. Control-flow analysis then narrows `value` to `string`
    // below — with no cast and no `!`.
    fail("getOrFail received null");
  }
  return value;
}
