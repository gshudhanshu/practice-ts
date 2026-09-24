/**
 * Exercise 21/06 — CHALLENGE: a mini parser
 *
 * The section finale. A parser that runs in the type system:
 *
 *   parseQuery("page=2&sort=asc&debug")
 *     value:  { page: 2, sort: "asc", debug: true }
 *     type:   { page: 2; sort: "asc"; debug: true }
 *
 * Everything in this section shows up: recursive template literal matching
 * (21/03), building objects from keys (21/04), and one intersection-flattening
 * trick you will use forever afterwards.
 *
 * NOTE: like 10/06, ONE `as` is permitted here, and only at the return of
 * `parseQuery`. See the README for why it is unavoidable.
 *
 * Read README.md first. Replace every TODO.
 */

/** What a parsed query value can be. */
export type QueryValue = string | number | boolean;

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Flatten an intersection into a single object type.
//   Prettify<{ a: string } & { b: number }>  ->  { a: string; b: number }
//
// Building an object by intersecting pieces is easy; READING the result is
// horrible, because tooltips show `{ a: string } & { b: number }` and `Equal`
// treats it as a different type from the flat one. A mapped type over `keyof T`
// rebuilds it as one object.
//
// 20/02 handed you this one for free. Write it from memory here — it is a
// one-liner, you will need it in TODO 4, and it is the type most worth knowing
// by heart in this entire section.
export type Prettify<T> = unknown;

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// Give a raw string value its narrowest sensible type.
//   ParseValue<"42">    ->  42        (a number literal, not a string)
//   ParseValue<"true">  ->  true
//   ParseValue<"false"> ->  false
//   ParseValue<"asc">   ->  "asc"
//   ParseValue<"">      ->  ""
//
// The numeric case needs `infer N extends number` (TS 4.8+) inside a template
// literal pattern. Check the booleans first — "true" would otherwise stay a
// string, which is correct but useless.
//
// One quirk the test pins down: `ParseValue<"007">` is `number`, not `7`. The
// explanation says why, and it is worth knowing.
export type ParseValue<S extends string> = unknown;

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Parse one `key=value` pair into a one-property object.
//   ParsePair<"a=1">       ->  { a: 1 }
//   ParsePair<"sort=asc">  ->  { sort: "asc" }
//   ParsePair<"debug">     ->  { debug: true }   (a bare flag)
//   ParsePair<"">          ->  {}
//
// To build an object from a string KEY, map over it: `{ [P in K]: … }`. A
// string literal type is a perfectly good union of one member.
export type ParsePair<S extends string> = unknown;

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Parse a whole query string.
//   ParseQuery<"a=1&b=2">              ->  { a: 1; b: 2 }
//   ParseQuery<"page=2&sort=asc&debug"> -> { page: 2; sort: "asc"; debug: true }
//   ParseQuery<"">                     ->  {}
//
// Split on "&" recursively and INTERSECT the pieces — `A & B` is how you
// accumulate an object type — then `Prettify` the result so it reads as one
// object and compares equal to one.
//
// One more requirement, and it is the difference between a kata and a usable
// type: if S is the wide `string` type (someone passed a runtime value, not a
// literal), there is nothing to parse and the honest answer is
// `Record<string, QueryValue>`. Detect that with `string extends S`, which is
// true ONLY for the unwidened `string` itself.
//
// A non-exported helper type for the recursion is fine and probably clearer.
export type ParseQuery<S extends string> = unknown;

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// The runtime parser, typed by the type-level one.
//
//   parseQuery("page=2&sort=asc&debug")  ->  { page: 2, sort: "asc", debug: true }
//   parseQuery("")                       ->  {}
//
// Rules, so the value and the type agree:
//   - split on "&"; a part with no "=" is a flag and its value is `true`;
//   - "true"/"false" become booleans;
//   - anything `Number()` turns into a finite number becomes that number;
//   - everything else stays a string.
//
// `const S` keeps the argument's literal type. The return type is a DEFERRED
// conditional (10/04) — the compiler cannot check a value against it from
// inside the generic function — so this is where the one permitted `as` goes.
// Comment it.
export function parseQuery<const S extends string>(search: S): unknown {
  throw new Error("TODO 5: implement parseQuery");
}
