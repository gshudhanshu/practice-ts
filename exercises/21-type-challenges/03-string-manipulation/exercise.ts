/**
 * Exercise 21/03 — String manipulation
 *
 * 10/05 showed how to build and match template literal types. Here you write
 * the string library itself: trim, split, join, replace, kebab-case — all of it
 * character by character, recursively, at compile time.
 *
 * This is where type-level code starts to look like a tiny functional language:
 * pattern match the head, recurse on the tail, and hit a base case.
 *
 * Read README.md first. Replace every TODO.
 */

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Strip whitespace from both ends.
//   Trim<"  hello  ">    ->  "hello"
//   Trim<"\n\t hi \t">   ->  "hi"
//   Trim<"none">         ->  "none"
//   Trim<"   ">          ->  ""
//
// Whitespace here means a space, a newline or a tab — the `Whitespace` union is
// given. Write TrimLeft and TrimRight first; `Trim` is their composition.
export type Whitespace = " " | "\n" | "\t";

export type TrimLeft<S extends string> = unknown;
export type TrimRight<S extends string> = unknown;
export type Trim<S extends string> = unknown;

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// Split a string on a delimiter, producing a TUPLE.
//   Split<"a,b,c", ",">   ->  ["a", "b", "c"]
//   Split<"a", ",">       ->  ["a"]
//   Split<"a,,b", ",">    ->  ["a", "", "b"]
//   Split<"", ",">        ->  [""]
//
// Those base cases are not arbitrary — they are exactly what
// `String.prototype.split` does at runtime, and the test asserts the two agree.
export type Split<S extends string, D extends string> = unknown;

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// The inverse: join a tuple of strings with a delimiter.
//   Join<["a", "b", "c"], "-">  ->  "a-b-c"
//   Join<["a"], "-">            ->  "a"
//   Join<[], "-">               ->  ""
//
// Watch the separator: it goes BETWEEN elements, so the last one must not get
// a trailing delimiter. Recursion on `[infer H, ...infer R]` (21/01) plus a
// check for "is the rest empty?".
//
// You will need `infer H extends string` — a plain `infer H` is `unknown`,
// which cannot go inside a template literal.
export type Join<T extends readonly string[], D extends string> = unknown;

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Replace the FIRST occurrence, and replace ALL occurrences.
//   Replace<"foo bar foo", "foo", "baz">     ->  "baz bar foo"
//   ReplaceAll<"foo bar foo", "foo", "baz">  ->  "baz bar baz"
//   Replace<"abc", "x", "y">                 ->  "abc"
//
// An empty `From` must return the string unchanged — otherwise the recursion
// never terminates, because `""` matches at every position.
export type Replace<
  S extends string,
  From extends string,
  To extends string,
> = unknown;
export type ReplaceAll<
  S extends string,
  From extends string,
  To extends string,
> = unknown;

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// camelCase (or PascalCase) to kebab-case.
//   KebabCase<"backgroundColor">  ->  "background-color"
//   KebabCase<"FooBarBaz">        ->  "foo-bar-baz"
//   KebabCase<"foo">              ->  "foo"
//
// There is no "is this an uppercase letter?" primitive. The trick is to ask
// whether the REST of the string is unchanged by `Uncapitalize`: if it is not,
// the next character was uppercase, so a hyphen belongs before it.
export type KebabCase<S extends string> = unknown;

// The runtime twin. The test asserts it agrees with `KebabCase` on the same
// input, which is the invariant that breaks when someone edits one and not the
// other.
//   kebabCase("backgroundColor")  ->  "background-color"
//   kebabCase("FooBarBaz")        ->  "foo-bar-baz"
export function kebabCase(value: string): string {
  throw new Error("TODO 5: implement kebabCase");
}
