/**
 * Exercise 02/06 — CHALLENGE: `unknown`, type guards, exhaustiveness
 *
 * This is the section-02 boss fight. Everything here shows up in real code the
 * moment you touch a network boundary.
 *
 * Read README.md first. Replace every TODO.
 */

export type User = {
  id: string;
  name: string;
  email: string;
  age?: number;
};

export type AppEvent =
  | { type: "click"; x: number; y: number }
  | { type: "keypress"; key: string }
  | { type: "scroll"; delta: number };

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Parse JSON without lying to the rest of the program.
//
// `JSON.parse` is declared as returning `any`, which silently disables type
// checking for everything downstream. Return `unknown` instead, so callers are
// FORCED to narrow. Return `undefined` when the input is not valid JSON.
export function safeJsonParse(raw: string): any {
  throw new Error("TODO 1: implement safeJsonParse");
}

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// A type guard for "a plain object with string keys".
// Careful: `typeof null === "object"` and `typeof [] === "object"` are both
// true in JavaScript. Neither should pass.
export function isRecord(value: unknown): boolean {
  throw new Error("TODO 2: implement isRecord");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Validate untrusted input into a User, or return null.
//   - id, name, email must all be present and be strings
//   - age is optional; if present it must be a number
//   - unknown extra properties are ignored, not copied
//
// Because `exactOptionalPropertyTypes` is on, you may NOT build the object with
// `age: undefined` when age is absent — the key must genuinely not be there.
export function parseUser(input: unknown): User | null {
  throw new Error("TODO 3: implement parseUser");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// The exhaustiveness helper. Its parameter type must be `never`, so that
// passing anything at all is a compile error. It throws at runtime.
export function assertNever(value: unknown): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// Describe an event:
//   click    -> "click at (3, 4)"
//   keypress -> "key: Enter"
//   scroll   -> "scroll by 100"
//
// Handle every case with a `switch`, and put `assertNever` in the `default`
// branch. When all cases are covered the compiler will accept it; if you ever
// add a fourth event type, that default line will fail to compile — which is
// the entire point.
export function describeEvent(event: AppEvent): string {
  throw new Error("TODO 5: implement describeEvent");
}
