/**
 * Exercise 04/02 — Query operations (Expense Tracker, part 2 of 3)
 *
 * The domain types from part 1 are given to you below. This part is about
 * working WITH a well-modelled domain — notice how little defensive code you
 * need once the types are right.
 *
 * Read README.md first. Replace every TODO.
 */

export const CATEGORIES = [
  "food",
  "transport",
  "housing",
  "entertainment",
  "other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type Payment =
  | { method: "cash" }
  | { method: "card"; last4: string }
  | { method: "transfer"; reference: string };

export type Expense = {
  id: string;
  description: string;
  amountCents: number;
  category: Category;
  /** ISO "YYYY-MM-DD" */
  date: string;
  payment: Payment;
  note?: string;
};

/** What arrives from a form: same shape, but the strings are not yet trusted. */
export type ExpenseDraft = {
  id: string;
  description: string;
  amountCents: number;
  category: string;
  date: string;
  payment: Payment;
  note?: string;
};

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Sum every amount. 0 for an empty list.
export function totalCents(expenses: readonly Expense[]): number {
  throw new Error("TODO 1: implement totalCents");
}

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// Every expense in the given category, order preserved.
export function byCategory(
  expenses: readonly Expense[],
  category: Category,
): Expense[] {
  throw new Error("TODO 2: implement byCategory");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Every expense whose date falls between `from` and `to`, INCLUSIVE.
// Both bounds are ISO "YYYY-MM-DD".
//
// You do not need `new Date()` here — think about why fixed-width ISO dates
// can be compared directly.
export function inDateRange(
  expenses: readonly Expense[],
  from: string,
  to: string,
): Expense[] {
  throw new Error("TODO 3: implement inDateRange");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// The single largest expense, or undefined for an empty list.
// On a tie, return the one that appears first.
export function largest(expenses: readonly Expense[]): Expense | undefined {
  throw new Error("TODO 4: implement largest");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// Validate a draft into a real Expense, or return null. Rules:
//   - description must be non-blank; store it TRIMMED
//   - amountCents must be an integer and >= 0
//   - category must be one of CATEGORIES
//   - date must match exactly "YYYY-MM-DD" (four digits, dash, two, dash, two)
//   - note: trimmed if given; if blank or absent the key must be ABSENT
//     (exactOptionalPropertyTypes is on — no `note: undefined`)
export function createExpense(draft: ExpenseDraft): Expense | null {
  throw new Error("TODO 5: implement createExpense");
}
