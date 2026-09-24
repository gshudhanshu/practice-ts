/**
 * Exercise 04/03 — CHALLENGE: reporting (Expense Tracker, part 3 of 3)
 *
 * Aggregation, sorting with tie-breaks, formatting, and a Record whose keys
 * come from a union. Each TODO builds on the one before it.
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

export type CategorySummary = {
  category: Category;
  totalCents: number;
  count: number;
  /** Share of the grand total, as a percentage rounded to one decimal place. */
  percentage: number;
};

export type MonthlyTotal = {
  /** "YYYY-MM" */
  month: string;
  totalCents: number;
};

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Integer cents -> a two-decimal string. 1250 -> "12.50", 5 -> "0.05".
export function formatCents(cents: number): string {
  throw new Error("TODO 1: implement formatCents");
}

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// `part` as a percentage of `whole`, rounded to ONE decimal place.
//   percentageOf(4500, 11000) -> 40.9
//   percentageOf(1, 3)        -> 33.3
// A `whole` of 0 must yield 0, not NaN or Infinity.
export function percentageOf(part: number, whole: number): number {
  throw new Error("TODO 2: implement percentageOf");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// One summary row per category that actually appears (categories with no
// expenses are omitted entirely).
//
// Sort by totalCents DESCENDING; break ties by category name ASCENDING.
export function summarizeByCategory(
  expenses: readonly Expense[],
): CategorySummary[] {
  throw new Error("TODO 3: implement summarizeByCategory");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Totals per calendar month, sorted by month ascending.
// The month key is the first seven characters of the ISO date.
export function monthlyTotals(expenses: readonly Expense[]): MonthlyTotal[] {
  throw new Error("TODO 4: implement monthlyTotals");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// A plain-text report. First line is the grand total, then one line per
// category in the order from TODO 3:
//
//   Total: 110.00
//   housing: 45.00 (40.9%, 1 item)
//   transport: 45.00 (40.9%, 1 item)
//   food: 20.00 (18.2%, 2 items)
//
// Note the singular/plural on "item". Lines are joined with "\n".
// An empty ledger produces just "Total: 0.00".
export function formatReport(expenses: readonly Expense[]): string {
  throw new Error("TODO 5: implement formatReport");
}
