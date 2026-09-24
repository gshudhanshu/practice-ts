/**
 * Exercise 02/03 — Tuples, `as const`, and unions instead of enums
 *
 * Read README.md first. Replace every TODO.
 */

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// A geographic coordinate is EXACTLY two numbers: latitude then longitude.
// A three-element array must be a compile error.
// Use named tuple members so `Coordinate[0]` reads as latitude at call sites.
export type Coordinate = number[];

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// Declare the four log levels ONCE, as a runtime array, and derive the union
// type from it. You must be able to iterate LOG_LEVELS at runtime AND have
// LogLevel be exactly "debug" | "info" | "warn" | "error".
//
// Do not write the four strings twice. Deriving the type from the value is the
// entire point of this TODO.
export const LOG_LEVELS = ["debug", "info", "warn", "error"];
export type LogLevel = string;

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Parse "12.5,-3.2" into a Coordinate. Return null when the input is not
// exactly two numbers, or when latitude is outside [-90, 90], or longitude is
// outside [-180, 180].
//
// Note: `noUncheckedIndexedAccess` means destructuring a split() result gives
// you `string | undefined` — handle it, do not assert it away.
export function parseCoordinate(input: string): Coordinate | null {
  throw new Error("TODO 3: implement parseCoordinate");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Format a coordinate with exactly four decimal places:
//   formatCoordinate([12.5, -3.2]) -> "12.5000, -3.2000"
export function formatCoordinate(coordinate: Coordinate): string {
  throw new Error("TODO 4: implement formatCoordinate");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// A type predicate: after `if (isLogLevel(x))`, `x` must narrow from
// `string` to `LogLevel`. Check against LOG_LEVELS at runtime — do not
// hand-write the four strings again.
export function isLogLevel(value: string): boolean {
  throw new Error("TODO 5: implement isLogLevel");
}
