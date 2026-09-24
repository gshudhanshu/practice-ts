import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  byCategory,
  createExpense,
  inDateRange,
  largest,
  totalCents,
  type Expense,
  type ExpenseDraft,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _largestReturn = Expect<
  Equal<ReturnType<typeof largest>, Expense | undefined>
>;
type _createReturn = Expect<
  Equal<ReturnType<typeof createExpense>, Expense | null>
>;

/* ── Fixtures ───────────────────────────────────────────────────────────── */

const expense = (
  id: string,
  amountCents: number,
  category: Expense["category"],
  date: string,
): Expense => ({
  id,
  description: `expense ${id}`,
  amountCents,
  category,
  date,
  payment: { method: "cash" },
});

const coffee = expense("1", 1200, "food", "2026-01-05");
const rent = expense("2", 4500, "housing", "2026-01-20");
const lunch = expense("3", 800, "food", "2026-02-03");
const trainTicket = expense("4", 4500, "transport", "2026-02-14");

const ledger: Expense[] = [coffee, rent, lunch, trainTicket];

const draft = (overrides: Partial<ExpenseDraft> = {}): ExpenseDraft => ({
  id: "d1",
  description: "Coffee",
  amountCents: 350,
  category: "food",
  date: "2026-03-01",
  payment: { method: "cash" },
  ...overrides,
});

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("totalCents", () => {
  it("adds every amount", () => {
    expect(totalCents(ledger)).toBe(11000);
  });
  it("is 0 for an empty ledger", () => {
    expect(totalCents([])).toBe(0);
  });
});

describe("byCategory", () => {
  it("filters and preserves order", () => {
    expect(byCategory(ledger, "food").map((e) => e.id)).toEqual(["1", "3"]);
  });
  it("returns [] when nothing matches", () => {
    expect(byCategory(ledger, "entertainment")).toEqual([]);
  });
});

describe("inDateRange", () => {
  it("includes both bounds", () => {
    expect(
      inDateRange(ledger, "2026-01-05", "2026-02-03").map((e) => e.id),
    ).toEqual(["1", "2", "3"]);
  });
  it("handles a single-day range", () => {
    expect(
      inDateRange(ledger, "2026-01-20", "2026-01-20").map((e) => e.id),
    ).toEqual(["2"]);
  });
  it("returns [] when the range is empty or inverted", () => {
    expect(inDateRange(ledger, "2026-05-01", "2026-05-31")).toEqual([]);
    expect(inDateRange(ledger, "2026-02-01", "2026-01-01")).toEqual([]);
  });
});

describe("largest", () => {
  it("finds the biggest expense", () => {
    expect(largest(ledger)?.id).toBe("2");
  });
  it("returns the first on a tie", () => {
    expect(largest([rent, trainTicket])?.id).toBe("2");
  });
  it("returns undefined for an empty ledger", () => {
    expect(largest([])).toBeUndefined();
  });
});

describe("createExpense", () => {
  it("accepts a valid draft", () => {
    expect(createExpense(draft())).toEqual({
      id: "d1",
      description: "Coffee",
      amountCents: 350,
      category: "food",
      date: "2026-03-01",
      payment: { method: "cash" },
    });
  });

  it("trims the description", () => {
    expect(createExpense(draft({ description: "  Coffee  " }))?.description).toBe(
      "Coffee",
    );
  });

  it("keeps a trimmed note, and omits a blank one entirely", () => {
    const withNote = createExpense(draft({ note: "  urgent " }));
    expect(withNote?.note).toBe("urgent");

    const blankNote = createExpense(draft({ note: "   " }));
    expect(blankNote).not.toBeNull();
    expect(Object.keys(blankNote ?? {})).not.toContain("note");

    const noNote = createExpense(draft());
    expect(Object.keys(noNote ?? {})).not.toContain("note");
  });

  it("accepts a zero amount", () => {
    expect(createExpense(draft({ amountCents: 0 }))?.amountCents).toBe(0);
  });

  it("rejects a blank description", () => {
    expect(createExpense(draft({ description: "" }))).toBeNull();
    expect(createExpense(draft({ description: "   " }))).toBeNull();
  });

  it("rejects bad amounts", () => {
    expect(createExpense(draft({ amountCents: -1 }))).toBeNull();
    expect(createExpense(draft({ amountCents: 3.5 }))).toBeNull();
    expect(createExpense(draft({ amountCents: Number.NaN }))).toBeNull();
  });

  it("rejects an unknown category", () => {
    expect(createExpense(draft({ category: "groceries" }))).toBeNull();
    expect(createExpense(draft({ category: "Food" }))).toBeNull();
  });

  it("rejects a malformed date", () => {
    expect(createExpense(draft({ date: "2026-3-1" }))).toBeNull();
    expect(createExpense(draft({ date: "01/03/2026" }))).toBeNull();
    expect(createExpense(draft({ date: "" }))).toBeNull();
  });
});
