import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  formatCents,
  formatReport,
  monthlyTotals,
  percentageOf,
  summarizeByCategory,
  type CategorySummary,
  type Expense,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _summaryReturn = Expect<
  Equal<ReturnType<typeof summarizeByCategory>, CategorySummary[]>
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

// food 2000 (2 items), housing 4500 (1), transport 4500 (1) -> grand total 11000
const ledger: Expense[] = [
  expense("1", 1200, "food", "2026-01-05"),
  expense("2", 4500, "housing", "2026-01-20"),
  expense("3", 800, "food", "2026-02-03"),
  expense("4", 4500, "transport", "2026-02-14"),
];

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("formatCents", () => {
  it("always shows two decimals", () => {
    expect(formatCents(1250)).toBe("12.50");
    expect(formatCents(5)).toBe("0.05");
    expect(formatCents(0)).toBe("0.00");
    expect(formatCents(11000)).toBe("110.00");
  });
});

describe("percentageOf", () => {
  it("rounds to one decimal place", () => {
    expect(percentageOf(4500, 11000)).toBe(40.9);
    expect(percentageOf(2000, 11000)).toBe(18.2);
    expect(percentageOf(1, 3)).toBe(33.3);
    expect(percentageOf(1, 2)).toBe(50);
  });

  it("handles the zero cases without NaN or Infinity", () => {
    expect(percentageOf(0, 0)).toBe(0);
    expect(percentageOf(5, 0)).toBe(0);
    expect(percentageOf(0, 100)).toBe(0);
  });
});

describe("summarizeByCategory", () => {
  it("aggregates totals and counts", () => {
    const summary = summarizeByCategory(ledger);
    const food = summary.find((row) => row.category === "food");
    expect(food).toEqual({
      category: "food",
      totalCents: 2000,
      count: 2,
      percentage: 18.2,
    });
  });

  it("omits categories with no expenses", () => {
    const categories = summarizeByCategory(ledger).map((row) => row.category);
    expect(categories).not.toContain("entertainment");
    expect(categories).not.toContain("other");
    expect(categories).toHaveLength(3);
  });

  it("sorts by total desc, then category asc on ties", () => {
    expect(summarizeByCategory(ledger).map((row) => row.category)).toEqual([
      "housing",
      "transport",
      "food",
    ]);
  });

  it("returns [] for an empty ledger", () => {
    expect(summarizeByCategory([])).toEqual([]);
  });
});

describe("monthlyTotals", () => {
  it("groups by calendar month, ascending", () => {
    expect(monthlyTotals(ledger)).toEqual([
      { month: "2026-01", totalCents: 5700 },
      { month: "2026-02", totalCents: 5300 },
    ]);
  });

  it("sorts months chronologically regardless of input order", () => {
    const shuffled = [
      expense("a", 100, "food", "2026-12-01"),
      expense("b", 200, "food", "2026-02-01"),
      expense("c", 300, "food", "2026-07-01"),
    ];
    expect(monthlyTotals(shuffled).map((row) => row.month)).toEqual([
      "2026-02",
      "2026-07",
      "2026-12",
    ]);
  });

  it("returns [] for an empty ledger", () => {
    expect(monthlyTotals([])).toEqual([]);
  });
});

describe("formatReport", () => {
  it("renders the whole report", () => {
    expect(formatReport(ledger)).toBe(
      [
        "Total: 110.00",
        "housing: 45.00 (40.9%, 1 item)",
        "transport: 45.00 (40.9%, 1 item)",
        "food: 20.00 (18.2%, 2 items)",
      ].join("\n"),
    );
  });

  it("uses the singular for exactly one item", () => {
    const single = [expense("1", 500, "food", "2026-01-01")];
    expect(formatReport(single)).toBe(
      ["Total: 5.00", "food: 5.00 (100%, 1 item)"].join("\n"),
    );
  });

  it("renders an empty ledger as just the total", () => {
    expect(formatReport([])).toBe("Total: 0.00");
  });
});
