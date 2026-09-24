/**
 * Exercise 06/01 — Class fundamentals & access modifiers
 *
 * Read README.md first. Replace every TODO.
 */

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Rewrite the constructor using PARAMETER PROPERTIES so that the field
// declarations and the assignments both disappear:
//
//   - `owner`         public and readonly
//   - `balanceCents`  private (accessible inside the class only)
//
// Also validate: a negative opening balance, or a non-integer one, must throw.
export class BankAccount {
  public readonly owner: string;
  private balanceCents: number;

  constructor(owner: string, openingBalanceCents: number) {
    this.owner = owner;
    this.balanceCents = openingBalanceCents;
  }

  // ─── TODO 2 ────────────────────────────────────────────────────────────────
  // Add `cents` to the balance.
  // Throw a RangeError for anything that is not a positive integer.
  deposit(cents: number): void {
    throw new Error("TODO 2: implement deposit");
  }

  // ─── TODO 3 ────────────────────────────────────────────────────────────────
  // Remove `cents` if the balance covers it, and return true.
  // Return false (and change nothing) when funds are insufficient.
  // Still throw a RangeError for an invalid amount.
  withdraw(cents: number): boolean {
    throw new Error("TODO 3: implement withdraw");
  }

  // ─── TODO 4 ────────────────────────────────────────────────────────────────
  // Expose the balance READ-ONLY, via a getter called `balance`.
  // Assigning to `account.balance` must be a compile error.
  get balance(): number {
    throw new Error("TODO 4: implement the balance getter");
  }

  // ─── TODO 5 ────────────────────────────────────────────────────────────────
  // Move money to another account. Return false if funds are insufficient.
  //
  // Note: `private` is per-CLASS, not per-instance, so you may read
  // `other.balanceCents` directly here. Work out whether you should.
  transferTo(other: BankAccount, cents: number): boolean {
    throw new Error("TODO 5: implement transferTo");
  }
}
