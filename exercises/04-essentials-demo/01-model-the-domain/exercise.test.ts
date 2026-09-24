import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  CATEGORIES,
  assertNever,
  describePayment,
  isCategory,
  type Category,
  type Expense,
  type Payment,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _category = Expect<
  Equal<Category, "food" | "transport" | "housing" | "entertainment" | "other">
>;

type _categoriesFrozen = Expect<
  Equal<
    typeof CATEGORIES,
    readonly ["food", "transport", "housing", "entertainment", "other"]
  >
>;

type _paymentMethods = Expect<
  Equal<Payment["method"], "cash" | "card" | "transfer">
>;

type _card = Expect<
  Equal<Extract<Payment, { method: "card" }>, { method: "card"; last4: string }>
>;

type _expenseShape = Expect<
  Equal<
    Expense,
    {
      id: string;
      description: string;
      amountCents: number;
      category: Category;
      date: string;
      payment: Payment;
      note?: string;
    }
  >
>;

type _assertNever = Expect<Equal<typeof assertNever, (value: never) => never>>;

function _compileTimeOnly(): void {
  // @ts-expect-error — a card payment must carry last4.
  const _badCard: Payment = { method: "card" };

  // @ts-expect-error — "crypto" is not a supported method.
  const _badMethod: Payment = { method: "crypto" };

  // @ts-expect-error — "groceries" is not a category.
  const _badCategory: Category = "groceries";

  // isCategory must narrow.
  const raw: string = "food";
  if (isCategory(raw)) {
    type _narrowed = Expect<Equal<typeof raw, Category>>;
  }
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("CATEGORIES", () => {
  it("holds the five categories in order", () => {
    expect([...CATEGORIES]).toEqual([
      "food",
      "transport",
      "housing",
      "entertainment",
      "other",
    ]);
  });
});

describe("isCategory", () => {
  it("accepts every declared category", () => {
    for (const category of CATEGORIES) {
      expect(isCategory(category)).toBe(true);
    }
  });

  it("rejects anything else", () => {
    expect(isCategory("groceries")).toBe(false);
    expect(isCategory("Food")).toBe(false);
    expect(isCategory("")).toBe(false);
  });
});

describe("describePayment", () => {
  it("describes each method", () => {
    expect(describePayment({ method: "cash" })).toBe("cash");
    expect(describePayment({ method: "card", last4: "4242" })).toBe(
      "card ending 4242",
    );
    expect(describePayment({ method: "transfer", reference: "INV-9" })).toBe(
      "transfer ref INV-9",
    );
  });
});

describe("assertNever", () => {
  it("throws when reached", () => {
    expect(() => assertNever("x" as unknown as never)).toThrow();
  });
});
