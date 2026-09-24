import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  TAX_RATE,
  formatCents,
  parsePriceToCents,
  withTax,
  type Currency,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────────
   These lines have no runtime effect. If a type is wrong, tsc goes red here. */

// TAX_RATE must stay a literal, not widen to `number`.
type _taxIsLiteral = Expect<Equal<typeof TAX_RATE, 0.08>>;

// Currency must be exactly this three-member union.
type _currencyUnion = Expect<Equal<Currency, "USD" | "EUR" | "INR">>;

// parsePriceToCents must advertise that it can fail.
type _parseReturn = Expect<
  Equal<ReturnType<typeof parsePriceToCents>, number | null>
>;

// withTax's return type must be *inferred* as number.
type _withTaxReturn = Expect<Equal<ReturnType<typeof withTax>, number>>;

// @ts-expect-error — "GBP" is not a supported currency.
const _rejected: Currency = "GBP";

/* ── Runtime spec ─────────────────────────────────────────────────────────── */

describe("parsePriceToCents", () => {
  it("converts a decimal string to integer cents", () => {
    expect(parsePriceToCents("12.50")).toBe(1250);
    expect(parsePriceToCents("0.05")).toBe(5);
    expect(parsePriceToCents("7")).toBe(700);
  });

  it("does not lose a cent to floating point", () => {
    expect(parsePriceToCents("19.99")).toBe(1999);
    expect(parsePriceToCents("1.10")).toBe(110);
  });

  it("returns null for anything that is not a non-negative number", () => {
    expect(parsePriceToCents("abc")).toBeNull();
    expect(parsePriceToCents("")).toBeNull();
    expect(parsePriceToCents("-3.00")).toBeNull();
    expect(parsePriceToCents("1.2.3")).toBeNull();
  });
});

describe("formatCents", () => {
  it("always shows two decimal places", () => {
    expect(formatCents(1250, "USD")).toBe("USD 12.50");
    expect(formatCents(5, "INR")).toBe("INR 0.05");
    expect(formatCents(0, "EUR")).toBe("EUR 0.00");
    expect(formatCents(100, "USD")).toBe("USD 1.00");
  });
});

describe("withTax", () => {
  it("applies TAX_RATE and rounds to whole cents", () => {
    expect(withTax(1000)).toBe(1080);
    expect(withTax(1999)).toBe(2159); // 2158.92 -> 2159
    expect(withTax(0)).toBe(0);
  });

  it("never returns a fractional cent", () => {
    expect(Number.isInteger(withTax(333))).toBe(true);
  });
});
