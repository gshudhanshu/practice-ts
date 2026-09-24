/**
 * Exercise 06/03 — Abstract classes & inheritance
 *
 * A payroll hierarchy. Note that this repo enables `noImplicitOverride`, so
 * the `override` keyword is REQUIRED whenever you replace an inherited member.
 *
 * Read README.md first. Replace every TODO.
 */

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Make Employee ABSTRACT: it must be impossible to instantiate directly.
//
// Declare two abstract members that every subclass must supply:
//   - a `role` getter returning a string
//   - a `monthlyPayCents()` method returning a number
//
// `describe()` is NOT abstract — it is shared behaviour that calls into the
// abstract members. That combination is the whole point of an abstract class.
export class Employee {
  constructor(
    public readonly name: string,
    protected readonly baseCents: number,
  ) {}

  describe(): string {
    throw new Error("TODO 1: implement describe using role and monthlyPayCents");
  }
}

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// A salaried employee. `baseCents` is the ANNUAL salary.
//   role  -> "Salaried"
//   pay   -> annual / 12, rounded to the nearest cent
export class Salaried extends Employee {}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// An hourly employee. `baseCents` is the hourly RATE; hours are given
// separately and must be stored.
//   role  -> "Hourly"
//   pay   -> rate * hoursPerMonth
//
// Remember to pass the base rate up to the parent constructor.
export class Hourly extends Employee {}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// A contractor. `baseCents` is a flat monthly retainer.
//   role  -> "Contractor"
//   pay   -> the retainer, unchanged
//
// Also REPLACE `describe()` so it appends " [contract]" — and build the result
// by calling the parent implementation rather than re-writing the format.
export class Contractor extends Employee {}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// Total monthly cost across a mixed list. The parameter is typed as the
// abstract base class — each element runs its own implementation.
export function totalMonthlyPayrollCents(
  employees: readonly Employee[],
): number {
  throw new Error("TODO 5: implement totalMonthlyPayrollCents");
}
