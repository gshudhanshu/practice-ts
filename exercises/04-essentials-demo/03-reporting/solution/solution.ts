/**
 * Solution — 04/03 Reporting
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
  percentage: number;
};

export type MonthlyTotal = {
  month: string;
  totalCents: number;
};

export function formatCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function percentageOf(part: number, whole: number): number {
  // Guard first: 0/0 is NaN and n/0 is Infinity, and both would poison the
  // report silently.
  if (whole === 0) return 0;
  // Scale by 1000 (not 100) so that rounding lands on one decimal place.
  return Math.round((part / whole) * 1000) / 10;
}

/** Deterministic ascending comparison. Avoids localeCompare's locale surprises. */
function compareStrings(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export function summarizeByCategory(
  expenses: readonly Expense[],
): CategorySummary[] {
  const grandTotal = expenses.reduce((sum, e) => sum + e.amountCents, 0);

  // A Map keeps insertion order and — unlike a plain object — has no prototype
  // keys to worry about. `.get` returning `| undefined` is honest here.
  const buckets = new Map<Category, { totalCents: number; count: number }>();

  for (const expense of expenses) {
    const bucket = buckets.get(expense.category);
    if (bucket) {
      bucket.totalCents += expense.amountCents;
      bucket.count += 1;
    } else {
      buckets.set(expense.category, {
        totalCents: expense.amountCents,
        count: 1,
      });
    }
  }

  const rows: CategorySummary[] = [];
  for (const [category, bucket] of buckets) {
    rows.push({
      category,
      totalCents: bucket.totalCents,
      count: bucket.count,
      percentage: percentageOf(bucket.totalCents, grandTotal),
    });
  }

  // Primary key descending, secondary key ascending. `||` chains comparators
  // neatly because 0 (equal) is the only falsy result a comparator returns.
  rows.sort(
    (a, b) =>
      b.totalCents - a.totalCents || compareStrings(a.category, b.category),
  );

  return rows;
}

export function monthlyTotals(expenses: readonly Expense[]): MonthlyTotal[] {
  const totals = new Map<string, number>();

  for (const expense of expenses) {
    // "2026-01-20".slice(0, 7) === "2026-01"
    const month = expense.date.slice(0, 7);
    totals.set(month, (totals.get(month) ?? 0) + expense.amountCents);
  }

  return [...totals]
    .map(([month, totalCents]) => ({ month, totalCents }))
    // "YYYY-MM" sorts lexicographically in chronological order.
    .sort((a, b) => compareStrings(a.month, b.month));
}

export function formatReport(expenses: readonly Expense[]): string {
  const grandTotal = expenses.reduce((sum, e) => sum + e.amountCents, 0);

  const lines = [`Total: ${formatCents(grandTotal)}`];

  for (const row of summarizeByCategory(expenses)) {
    const noun = row.count === 1 ? "item" : "items";
    lines.push(
      `${row.category}: ${formatCents(row.totalCents)} (${row.percentage}%, ${row.count} ${noun})`,
    );
  }

  return lines.join("\n");
}
