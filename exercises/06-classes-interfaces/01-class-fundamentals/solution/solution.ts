/**
 * Solution — 06/01 Class fundamentals & access modifiers
 */

export class BankAccount {
  // PARAMETER PROPERTIES: putting an access modifier on a constructor
  // parameter declares the field AND assigns it. These two lines replace a
  // field declaration and an assignment for each one.
  constructor(
    public readonly owner: string,
    private balanceCents: number,
  ) {
    // Parameter properties are assigned before the body runs, so validation
    // goes here. Throwing from a constructor means the instance never escapes.
    if (!Number.isInteger(balanceCents) || balanceCents < 0) {
      throw new RangeError("Opening balance must be a non-negative integer");
    }
  }

  // A private static helper: shared by every method, invisible outside.
  private static assertValidAmount(cents: number): void {
    if (!Number.isInteger(cents) || cents <= 0) {
      throw new RangeError("Amount must be a positive integer number of cents");
    }
  }

  deposit(cents: number): void {
    BankAccount.assertValidAmount(cents);
    this.balanceCents += cents;
  }

  withdraw(cents: number): boolean {
    // Validate first: a bad amount is a programmer error (throw), while
    // insufficient funds is an expected outcome (return false). Keeping those
    // two failure modes distinct is the interesting design decision here.
    BankAccount.assertValidAmount(cents);

    if (cents > this.balanceCents) return false;

    this.balanceCents -= cents;
    return true;
  }

  // A getter with no setter is a read-only public view of private state:
  // `account.balance` reads like a property, but cannot be assigned.
  get balance(): number {
    return this.balanceCents;
  }

  transferTo(other: BankAccount, cents: number): boolean {
    // `private` is per-CLASS, so `other.balanceCents` WOULD compile here.
    // Going through the public methods instead means the validation and the
    // insufficient-funds rule live in one place and cannot drift.
    if (!this.withdraw(cents)) return false;
    other.deposit(cents);
    return true;
  }
}
