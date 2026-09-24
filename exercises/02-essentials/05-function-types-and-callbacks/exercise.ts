/**
 * Exercise 02/05 — Function types, callbacks, `void` and `never`
 *
 * Read README.md first. Replace every TODO.
 */

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// A reusable function TYPE: takes a number, returns a number.
// Use a function type expression, not an interface.
export type Transformer = unknown;

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// Run every transformer over every value, left to right:
//   applyAll([1, 2], double, increment) -> [3, 5]
// (double then increment: 1 -> 2 -> 3, and 2 -> 4 -> 5)
//
// Accept any number of transformers via a rest parameter.
export function applyAll(values: readonly number[]): number[] {
  throw new Error("TODO 2: implement applyAll");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Turn text into a URL slug:
//   slugify("  Hello   World!  ")      -> "hello-world"
//   slugify("Hello World", "_")        -> "hello_world"
//   slugify("Rock & Roll -- Vol. 2")   -> "rock-roll-vol-2"
//
// `separator` is optional and defaults to "-". Give it a DEFAULT VALUE rather
// than typing it as `string | undefined` and branching inside.
export function slugify(text: string, separator: string): string {
  throw new Error("TODO 3: implement slugify");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Call `callback` once per item with the item and its index.
// Declare the callback as returning `void` — callers must then be free to pass
// a function that happens to return something (e.g. `arr.push(...)`, which
// returns a number). That is a deliberate TypeScript rule, not an accident.
export function forEachIndexed(
  items: readonly string[],
  callback: (item: string, index: number) => string,
): void {
  throw new Error("TODO 4: implement forEachIndexed");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// `fail` always throws, so it never returns a value. Give it the return type
// that says exactly that.
export function fail(message: string): void {
  throw new Error(message);
}

// Then implement `getOrFail`. Do NOT add a cast or a `!` — if `fail` is typed
// correctly, the compiler will work out that `value` is a string on the last
// line all by itself.
export function getOrFail(value: string | null): string {
  throw new Error("TODO 5: implement getOrFail");
}
