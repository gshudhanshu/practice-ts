/**
 * Exercise 04/01 — Model the domain (Expense Tracker, part 1 of 3)
 *
 * Section 04 is one small project built across three exercises. This one is
 * pure modelling: no algorithms, just saying precisely what an expense IS.
 *
 * Getting the types right here is what makes parts 2 and 3 easy — which is
 * exactly the lesson.
 *
 * Read README.md first. Replace every TODO.
 */

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// The five expense categories, declared ONCE as a runtime array with the union
// type derived from it (the 02/03 pattern):
//   food, transport, housing, entertainment, other
export const CATEGORIES = [] as const;
export type Category = string;

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// How the expense was paid, as a DISCRIMINATED union on a `method` property:
//   cash     — no extra data
//   card     — carries `last4`, a string
//   transfer — carries `reference`, a string
//
// Model it so that a card payment without `last4` cannot be constructed.
export type Payment = { method: string };

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// A single expense:
//   id           string
//   description  string
//   amountCents  number   (integer, never negative — money is never a float)
//   category     Category
//   date         string   (ISO "YYYY-MM-DD")
//   payment      Payment
//   note         string, OPTIONAL
export type Expense = {
  id: string;
};

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// A type predicate: after `if (isCategory(x))`, `x` narrows to Category.
// Check against CATEGORIES — do not hand-write the five strings again.
export function isCategory(value: string): boolean {
  throw new Error("TODO 4: implement isCategory");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// Describe a payment:
//   cash                                  -> "cash"
//   card, last4 "4242"                    -> "card ending 4242"
//   transfer, reference "INV-9"           -> "transfer ref INV-9"
//
// Use an exhaustive `switch` with `assertNever` in the default branch, so that
// adding a fourth payment method becomes a compile error here.
export function assertNever(value: unknown): never {
  throw new Error(`Unhandled: ${JSON.stringify(value)}`);
}

export function describePayment(payment: Payment): string {
  throw new Error("TODO 5: implement describePayment");
}
