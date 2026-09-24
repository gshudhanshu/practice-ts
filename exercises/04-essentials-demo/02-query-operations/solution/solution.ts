/**
 * Solution — 04/02 Query operations
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

export type ExpenseDraft = {
  id: string;
  description: string;
  amountCents: number;
  category: string;
  date: string;
  payment: Payment;
  note?: string;
};

export function totalCents(expenses: readonly Expense[]): number {
  return expenses.reduce((sum, expense) => sum + expense.amountCents, 0);
}

export function byCategory(
  expenses: readonly Expense[],
  category: Category,
): Expense[] {
  return expenses.filter((expense) => expense.category === category);
}

export function inDateRange(
  expenses: readonly Expense[],
  from: string,
  to: string,
): Expense[] {
  // Fixed-width ISO dates ("YYYY-MM-DD") sort lexicographically in exactly the
  // same order as chronologically, because every field is zero-padded and the
  // most significant one comes first. So plain string comparison is correct —
  // and far cheaper than constructing Date objects, with no timezone traps.
  return expenses.filter(
    (expense) => expense.date >= from && expense.date <= to,
  );
}

export function largest(expenses: readonly Expense[]): Expense | undefined {
  let winner: Expense | undefined = undefined;
  for (const expense of expenses) {
    // Strictly greater-than keeps the FIRST of any tie.
    if (winner === undefined || expense.amountCents > winner.amountCents) {
      winner = expense;
    }
  }
  return winner;
}

const ISO_DATE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

function isCategory(value: string): value is Category {
  return CATEGORIES.some((category) => category === value);
}

export function createExpense(draft: ExpenseDraft): Expense | null {
  const description = draft.description.trim();
  if (description === "") return null;

  // Number.isInteger is false for NaN, Infinity and 3.5 — one check, three bugs.
  if (!Number.isInteger(draft.amountCents) || draft.amountCents < 0) return null;

  // The predicate is what turns the untrusted `string` into a `Category`.
  if (!isCategory(draft.category)) return null;

  if (!ISO_DATE.test(draft.date)) return null;

  const expense: Expense = {
    id: draft.id,
    description,
    amountCents: draft.amountCents,
    category: draft.category,
    date: draft.date,
    payment: draft.payment,
  };

  // Under exactOptionalPropertyTypes the key must be genuinely absent when
  // there is no note — assigning only in the success case achieves that.
  const note = draft.note?.trim();
  if (note !== undefined && note !== "") {
    expense.note = note;
  }

  return expense;
}
