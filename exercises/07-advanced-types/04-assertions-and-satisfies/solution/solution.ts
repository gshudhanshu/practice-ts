/**
 * Solution — 07/04 `as`, `satisfies` and `as const`
 */

export type ColorValue = `#${string}`;
export type Theme = Record<string, ColorValue>;
export type Route = `/${string}`;

// `satisfies` validates every value against Theme but leaves the INFERRED type
// alone: the keys stay "primary" | "danger" | "muted" and primary stays the
// literal "#0055ff".
//
// Compare: `const PALETTE: Theme = { … }` would also check, but would widen
// keyof to `string` and every value to `ColorValue`.
export const PALETTE = {
  primary: "#0055ff",
  danger: "#ff0033",
  muted: "#888888",
} satisfies Theme;

// Both operators, in this order:
//   `as const`  makes it a readonly tuple of literals
//   `satisfies` then verifies each literal really is a Route
// Written the other way round, `satisfies` would run against the widened
// string[] and the tuple would be lost.
export const ROUTES = ["/", "/about", "/contact"] as const satisfies readonly Route[];

export function getColor(name: keyof typeof PALETTE): ColorValue {
  // `name` is one of the three literal keys, so this access is total —
  // no `| undefined`, even under noUncheckedIndexedAccess.
  return PALETTE[name];
}

export const HTTP_STATUS = {
  ok: 200,
  notFound: 404,
  error: 500,
} as const;

export type StatusCode = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];

export function toStatusCode(raw: unknown): StatusCode | undefined {
  if (typeof raw !== "number") return undefined;

  // Object.values on an `as const` object yields (200 | 404 | 500)[].
  const codes: readonly StatusCode[] = Object.values(HTTP_STATUS);

  // `.find` returns `StatusCode | undefined` — exactly the contract, PROVEN
  // rather than asserted. `raw as StatusCode` would have claimed 999 is valid.
  return codes.find((code) => code === raw);
}

export function firstUpper(values: readonly string[]): string {
  const first = values[0];
  // Narrow instead of asserting. `?? ""` would also work; the explicit check
  // makes the empty-list case visible.
  if (first === undefined) return "";
  return first.toUpperCase();
}
