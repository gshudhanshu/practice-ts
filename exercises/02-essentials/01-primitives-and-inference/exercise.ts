/**
 * Exercise 02/01 — Primitives & Inference
 *
 * Read README.md first. Replace every TODO.
 * Do not change any exported name or signature that the tests rely on.
 */

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// This annotation is actively harmful: it widens a perfectly good literal type.
// The tests require the type of TAX_RATE to be exactly `0.08`, not `number`.
export const TAX_RATE = 0.08;

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// Model the only three currencies this shop accepts: "USD", "EUR", "INR".
// Any other string must be a compile error.
export type Currency = "USD" | "EUR" | "INR";

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Convert a price string like "12.50" into an integer number of cents (1250).
// Return `null` when the input is not a valid non-negative decimal number.
// Give it a return type that forces callers to handle the failure case.
export function parsePriceToCents(raw: string): number | null {
  // Guard the shape first: digits, optionally followed by a decimal part.
  // This rejects "", "abc", "-3.00", "1.2.3" and stray whitespace.
  if (!/^\d+(\.\d+)?$/.test(raw)) return null;

  const asNumber = Number(raw);
  if (!Number.isFinite(asNumber)) return null;

  // Multiply *then* round. 19.99 * 100 is 1998.9999999999998 in binary
  // floating point, so truncating would silently lose a cent.
  return Math.round(asNumber * 100);
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Format an integer number of cents into a display string:
//   formatCents(1250, "USD") -> "USD 12.50"
//   formatCents(5,    "INR") -> "INR 0.05"
// Always exactly two decimal places.
export function formatCents(cents: number, currency: Currency): string {
  // throw new Error("TODO 4: implement formatCents");
  const amount = cents / 100;
  return `${currency} ${amount.toFixed(2)}`
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// Add TAX_RATE tax to a cents amount and round to the nearest whole cent.
// Do NOT annotate the return type — prove to yourself that inference gets it
// right on its own. The test asserts the inferred type is `number`.
export function withTax(cents: number) {
  // throw new Error("TODO 5: implement withTax");
  const amountWithTax = cents * (1 + TAX_RATE);
  return Math.round(amountWithTax);
}
