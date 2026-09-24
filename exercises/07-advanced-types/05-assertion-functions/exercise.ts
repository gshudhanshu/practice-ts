/**
 * Exercise 07/05 — CHALLENGE: assertion functions
 *
 * A type predicate (`value is T`) narrows INSIDE an `if`.
 * An assertion function (`asserts value is T`) narrows for the REST OF THE
 * SCOPE, by throwing when the claim is false.
 *
 * That difference turns validation code from a pyramid of nested `if`s into a
 * flat list of statements — which is exactly what this exercise builds.
 *
 * Read README.md first. Replace every TODO.
 */

export type Order = {
  id: string;
  totalCents: number;
  items: readonly string[];
};

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Throw a TypeError("expected an object") unless `value` is a plain object.
// Arrays and null must be rejected.
//
// Note the return type: an assertion function returns nothing, and its
// narrowing survives past the call.
export function assertIsRecord(value: unknown): void {
  throw new Error("TODO 1: implement assertIsRecord");
}

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// Throw a TypeError(`${label} must be a string`) unless `value` is a string.
export function assertIsString(value: unknown, label: string): void {
  throw new Error("TODO 2: implement assertIsString");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Validate a whole Order. Check IN THIS ORDER, so the error messages are
// predictable:
//
//   not an object       -> "expected an object"
//   id not a string     -> "id must be a string"
//   totalCents bad      -> "totalCents must be a non-negative integer"
//   items bad           -> "items must be an array of strings"
//
// `totalCents` must be an integer and >= 0. Reuse the two helpers above.
export function assertIsOrder(value: unknown): void {
  throw new Error("TODO 3: implement assertIsOrder");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Parse JSON into an Order, throwing on anything invalid:
//   - malformed JSON  -> TypeError("malformed JSON")
//   - wrong shape     -> whatever assertIsOrder throws
//
// The body should be three lines. No casts — the assertion does the narrowing.
export function parseOrder(raw: string): Order {
  throw new Error("TODO 4: implement parseOrder");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// The safe wrapper. Never throws.
//   valid   -> "Order a: 2 items, 12.50"
//              (singular "1 item" when there is exactly one)
//   invalid -> "invalid order: <the error message>"
export function describeOrder(raw: string): string {
  throw new Error("TODO 5: implement describeOrder");
}
