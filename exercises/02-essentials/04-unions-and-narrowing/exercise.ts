/**
 * Exercise 02/04 — Union types & narrowing
 *
 * Read README.md first. Replace every TODO.
 */

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Format a value depending on what it actually is:
//   string  -> trimmed; the literal "(empty)" if it is blank or whitespace-only
//   number  -> two decimal places, e.g. "3.50"
//   boolean -> "yes" / "no"
// Narrow with `typeof`. No casts.
export function formatValue(value: string | number | boolean): string {
  throw new Error("TODO 1: implement formatValue");
}

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// Model three shapes as a DISCRIMINATED union. Every member must carry a
// literal `kind` property that tells the members apart:
//   circle    -> radius
//   rectangle -> width, height
//   triangle  -> base, height
export type Shape = {
  kind: string;
};

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Compute the area. Switch on the discriminant; inside each branch the
// shape-specific properties must be accessible without any cast.
//   circle    -> PI * r^2
//   rectangle -> w * h
//   triangle  -> 0.5 * b * h
export function area(shape: Shape): number {
  throw new Error("TODO 3: implement area");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Return `value` unless it is null or undefined, in which case return
// `fallback`.
//
// Careful: `0` and `""` are legitimate values here and must be returned as-is.
// The obvious operator is the wrong one.
export function withDefault(
  value: string | number | null | undefined,
  fallback: string | number,
): string | number {
  throw new Error("TODO 4: implement withDefault");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// These two shapes have no shared discriminant property, so `typeof` and
// `switch` are both useless. Narrow with the `in` operator instead.
//   EmailContact -> "email: <address>"
//   PhoneContact -> "phone: <number>"
export type EmailContact = { email: string };
export type PhoneContact = { phone: string };

export function contactLabel(contact: EmailContact | PhoneContact): string {
  throw new Error("TODO 5: implement contactLabel");
}
