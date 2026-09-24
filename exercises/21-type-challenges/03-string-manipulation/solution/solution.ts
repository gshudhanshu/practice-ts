/**
 * Solution — 21/03 String manipulation
 */

export type Whitespace = " " | "\n" | "\t";

// One character off the front per step. The union in the pattern means the
// compiler tries each whitespace character, so no separate branch is needed.
export type TrimLeft<S extends string> = S extends `${Whitespace}${infer R}`
  ? TrimLeft<R>
  : S;

// The mirror image: the wildcard comes first, the whitespace last.
export type TrimRight<S extends string> = S extends `${infer R}${Whitespace}`
  ? TrimRight<R>
  : S;

export type Trim<S extends string> = TrimLeft<TrimRight<S>>;

// The base case is `[S]`, not `[]` — a string with no delimiter in it still
// produces one part, which is exactly what "a".split(",") does at runtime.
export type Split<
  S extends string,
  D extends string,
> = S extends `${infer H}${D}${infer R}` ? [H, ...Split<R, D>] : [S];

// `infer H extends string` (TS 4.8+) constrains the inferred type so it can be
// used inside a template literal — a bare `infer H` is `unknown` and would be
// rejected there.
//
// `R extends []` is the "am I the last element?" test that keeps the delimiter
// between elements rather than after them.
export type Join<
  T extends readonly string[],
  D extends string,
> = T extends readonly [infer H extends string, ...infer R extends string[]]
  ? R extends []
    ? H
    : `${H}${D}${Join<R, D>}`
  : "";

// The `From extends ""` guard is load-bearing: an empty pattern matches at
// every position, so without it the recursion in ReplaceAll never terminates
// and the compiler reports "excessively deep".
export type Replace<
  S extends string,
  From extends string,
  To extends string,
> = From extends ""
  ? S
  : S extends `${infer Head}${From}${infer Rest}`
    ? `${Head}${To}${Rest}`
    : S;

// Identical, except the tail is replaced recursively rather than kept as-is.
export type ReplaceAll<
  S extends string,
  From extends string,
  To extends string,
> = From extends ""
  ? S
  : S extends `${infer Head}${From}${infer Rest}`
    ? `${Head}${To}${ReplaceAll<Rest, From, To>}`
    : S;

// There is no "is uppercase?" primitive. `R extends Uncapitalize<R>` asks
// whether lowercasing the first character of the REST changes anything — if it
// does, that character was uppercase and a hyphen belongs in front of it.
//
// `Uncapitalize<H>` lowercases the character we are emitting, so PascalCase
// input produces no leading hyphen.
export type KebabCase<S extends string> = S extends `${infer H}${infer R}`
  ? R extends Uncapitalize<R>
    ? `${Uncapitalize<H>}${KebabCase<R>}`
    : `${Uncapitalize<H>}-${KebabCase<R>}`
  : S;

export function kebabCase(value: string): string {
  // Insert a hyphen at every lower-to-upper boundary, then lowercase the lot.
  // This is the same rule the type expresses, written the way you would
  // actually ship it.
  return value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}
