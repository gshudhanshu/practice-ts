/**
 * Exercise 07/04 — `as`, `satisfies` and `as const`
 *
 * Three things that share keywords and do completely different jobs:
 *
 *   as         ASSERTION       — you overriding the compiler (reduces safety)
 *   satisfies  CHECK           — validate without changing the inferred type
 *   as const   CONST ASSERTION — infer the narrowest possible type
 *
 * Read README.md first. Replace every TODO.
 */

export type ColorValue = `#${string}`;
export type Theme = Record<string, ColorValue>;
export type Route = `/${string}`;

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// PALETTE must be CHECKED against Theme — a value like "red" (no leading #)
// must fail to compile.
//
// But the checking must not widen it: `keyof typeof PALETTE` has to stay the
// three literal key names, and `PALETTE.primary` has to stay "#0055ff".
//
// A plain annotation (`const PALETTE: Theme = …`) does the check and loses
// both. Use the operator that checks WITHOUT widening.
export const PALETTE = {
  primary: "#0055ff",
  danger: "#ff0033",
  muted: "#888888",
};

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// ROUTES must stay a readonly tuple of its exact literals AND be verified to
// contain only valid Route strings. You need two operators here, together.
export const ROUTES = ["/", "/about", "/contact"];

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Look up a colour. This signature only works because TODO 1 kept the keys
// literal — with a widened `Theme` the parameter would be `string` and typos
// would compile.
export function getColor(name: keyof typeof PALETTE): ColorValue {
  throw new Error("TODO 3: implement getColor");
}

// ─── Given ───────────────────────────────────────────────────────────────────
export const HTTP_STATUS = {
  ok: 200,
  notFound: 404,
  error: 500,
} as const;

/** 200 | 404 | 500 */
export type StatusCode = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Turn untrusted input into a StatusCode, or undefined.
//
// `raw as StatusCode` would compile and would be a LIE — it claims 999 is a
// valid code. Prove it instead, by checking against HTTP_STATUS at runtime.
export function toStatusCode(raw: unknown): StatusCode | undefined {
  throw new Error("TODO 4: implement toStatusCode");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// This compiles today and throws on an empty array: the `as` silenced a real
// warning from `noUncheckedIndexedAccess`.
//
// Rewrite it so the compiler proves the result. Return "" for an empty list.
// No `as`, no `!`.
export function firstUpper(values: readonly string[]): string {
  return (values[0] as string).toUpperCase();
}
