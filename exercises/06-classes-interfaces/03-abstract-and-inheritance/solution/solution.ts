/**
 * Solution — 06/03 Abstract classes & inheritance
 */

export abstract class Employee {
  constructor(
    public readonly name: string,
    // `protected` = visible to this class AND its subclasses, but not outside.
    // That is exactly the access level a base-class field usually wants.
    protected readonly baseCents: number,
  ) {}

  // Abstract members declare a CONTRACT with no implementation. A subclass
  // that fails to supply one does not compile.
  abstract get role(): string;
  abstract monthlyPayCents(): number;

  // Concrete shared behaviour that calls into the abstract members. This is
  // the template-method pattern: the base class owns the shape of the result,
  // subclasses fill in the parts that vary.
  describe(): string {
    const amount = (this.monthlyPayCents() / 100).toFixed(2);
    return `${this.name} (${this.role}): ${amount}`;
  }
}

export class Salaried extends Employee {
  get role(): string {
    return "Salaried";
  }

  monthlyPayCents(): number {
    // baseCents is the annual figure; round so we never emit a fractional cent.
    return Math.round(this.baseCents / 12);
  }
}

export class Hourly extends Employee {
  constructor(
    name: string,
    hourlyRateCents: number,
    private readonly hoursPerMonth: number,
  ) {
    // `super` must run before `this` is touched — and parameter properties
    // (hoursPerMonth) are assigned immediately after it.
    super(name, hourlyRateCents);
  }

  get role(): string {
    return "Hourly";
  }

  monthlyPayCents(): number {
    return this.baseCents * this.hoursPerMonth;
  }
}

export class Contractor extends Employee {
  get role(): string {
    return "Contractor";
  }

  monthlyPayCents(): number {
    return this.baseCents;
  }

  // `override` is REQUIRED here because `noImplicitOverride` is on and
  // `describe` is a concrete member of the base class. Rename `describe` in
  // Employee and this line fails loudly, instead of silently becoming a new
  // unrelated method.
  override describe(): string {
    // Extend rather than replace: `super.describe()` keeps the shared format,
    // so a change to it flows through here automatically.
    return `${super.describe()} [contract]`;
  }
}

export function totalMonthlyPayrollCents(
  employees: readonly Employee[],
): number {
  // Polymorphism: the parameter is the abstract base type, and each element
  // dispatches to its own implementation at runtime.
  return employees.reduce(
    (total, employee) => total + employee.monthlyPayCents(),
    0,
  );
}
