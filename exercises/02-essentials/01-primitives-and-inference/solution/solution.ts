/**
 * Solution — 02/01 Primitives & Inference
 */

// 1. No annotation. `const` + a numeric literal already gives the narrowest
//    possible type (`0.08`). Writing `: number` throws that information away.
export const TAX_RATE = 0.08;

// 2. A union of string literals. This is the workhorse of day-to-day TS —
//    reach for it long before you reach for `enum`.
export type Currency = "USD" | "EUR" | "INR";

// 3. The return type encodes failure, so callers cannot forget to handle it.
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

// 4. `toFixed(2)` guarantees the two-decimal contract.
export function formatCents(cents: number, currency: Currency): string {
  return `${currency} ${(cents / 100).toFixed(2)}`;
}

// 5. No return annotation: `number * number` is inferred as `number`, and
//    Math.round returns `number`. Inference already produces the right answer.
export function withTax(cents: number) {
  return Math.round(cents * (1 + TAX_RATE));
}
