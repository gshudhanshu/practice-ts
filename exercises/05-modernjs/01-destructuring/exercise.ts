/**
 * Exercise 05/01 — Destructuring & default values
 *
 * Destructuring is where modern JavaScript syntax meets TypeScript inference.
 * The syntax is familiar; what is worth learning is where the TYPES end up.
 *
 * Read README.md first. Replace every TODO.
 */

export type User = {
  name: string;
  title?: string;
  address?: {
    city?: string;
    country?: string;
  };
};

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Destructure in the PARAMETER LIST, with a default for `title`:
//   greet({ name: "Ada" })                  -> "Hello, friend Ada"
//   greet({ name: "Ada", title: "Dr" })     -> "Hello, Dr Ada"
//
// The default must live in the destructuring pattern, not in the body.
export function greet(user: User): string {
  throw new Error("TODO 1: implement greet");
}

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// Swap a tuple's elements — and notice the return type flips too.
//   swap(["a", 1]) -> [1, "a"]
export function swap(pair: [string, number]): [number, string] {
  throw new Error("TODO 2: implement swap");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Split a list into its first element and everything else, using array
// destructuring with a REST element.
//   headAndRest(["a","b","c"]) -> { first: "a", rest: ["b","c"] }
//   headAndRest([])            -> { first: undefined, rest: [] }
export function headAndRest(values: readonly string[]): {
  first: string | undefined;
  rest: string[];
} {
  throw new Error("TODO 3: implement headAndRest");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Destructure with RENAMING: pull `x` out as `longitude` and `y` as `latitude`,
// then format them.
//   toCoordinateLabel({ x: 3, y: 4 }) -> "lat 4, lon 3"
export function toCoordinateLabel(point: { x: number; y: number }): string {
  throw new Error("TODO 4: implement toCoordinateLabel");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// NESTED destructuring with defaults at two levels:
//   locationOf({ name: "Ada" })                                   -> "unknown, unknown"
//   locationOf({ name: "Ada", address: { city: "London" } })      -> "London, unknown"
//   locationOf({ name: "Ada", address: { city: "L", country: "UK" } }) -> "L, UK"
//
// The whole `address` object may be absent, so it needs a default too.
export function locationOf(user: User): string {
  throw new Error("TODO 5: implement locationOf");
}
