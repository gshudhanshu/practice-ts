import { describe, expect, it } from "vitest";
import {
  Contractor,
  Employee,
  Hourly,
  Salaried,
  totalMonthlyPayrollCents,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

function _compileTimeOnly(): void {
  // @ts-expect-error — Employee is abstract and cannot be instantiated.
  const _direct = new Employee("Ada", 100);

  // Subclasses are assignable to the base type.
  const staff: Employee[] = [
    new Salaried("Ada", 120_000_00),
    new Hourly("Grace", 2_000, 160),
    new Contractor("Alan", 500_000),
  ];
  void staff;
}

/* ── Fixtures ───────────────────────────────────────────────────────────── */

// 120,000.00 per year -> 10,000.00 per month
const ada = new Salaried("Ada", 120_000_00);
// 20.00 per hour x 160 hours -> 3,200.00
const grace = new Hourly("Grace", 2_000, 160);
// 5,000.00 monthly retainer
const alan = new Contractor("Alan", 500_000);

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("Salaried", () => {
  it("reports its role", () => {
    expect(ada.role).toBe("Salaried");
  });
  it("divides the annual salary by twelve", () => {
    expect(ada.monthlyPayCents()).toBe(1_000_000);
  });
  it("rounds to the nearest cent", () => {
    // 100,000 / 12 = 8333.33…
    expect(new Salaried("X", 100_000).monthlyPayCents()).toBe(8_333);
  });
});

describe("Hourly", () => {
  it("reports its role", () => {
    expect(grace.role).toBe("Hourly");
  });
  it("multiplies rate by hours", () => {
    expect(grace.monthlyPayCents()).toBe(320_000);
  });
  it("handles zero hours", () => {
    expect(new Hourly("Y", 2_000, 0).monthlyPayCents()).toBe(0);
  });
});

describe("Contractor", () => {
  it("reports its role", () => {
    expect(alan.role).toBe("Contractor");
  });
  it("pays the flat retainer", () => {
    expect(alan.monthlyPayCents()).toBe(500_000);
  });
});

describe("describe", () => {
  it("is shared by the subclasses that do not override it", () => {
    expect(ada.describe()).toBe("Ada (Salaried): 10000.00");
    expect(grace.describe()).toBe("Grace (Hourly): 3200.00");
  });

  it("is extended, not replaced, by Contractor", () => {
    expect(alan.describe()).toBe("Alan (Contractor): 5000.00 [contract]");
  });
});

describe("totalMonthlyPayrollCents", () => {
  it("sums a mixed list polymorphically", () => {
    expect(totalMonthlyPayrollCents([ada, grace, alan])).toBe(1_820_000);
  });
  it("is 0 for an empty list", () => {
    expect(totalMonthlyPayrollCents([])).toBe(0);
  });
});

describe("inheritance wiring", () => {
  it("keeps the name from the base constructor", () => {
    expect(ada.name).toBe("Ada");
    expect(grace.name).toBe("Grace");
  });
  it("produces real instances of the base class", () => {
    expect(ada).toBeInstanceOf(Employee);
    expect(grace).toBeInstanceOf(Employee);
    expect(alan).toBeInstanceOf(Employee);
  });
});
