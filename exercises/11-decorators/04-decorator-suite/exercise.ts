/**
 * Exercise 11/04 — A decorator suite
 *
 * Everything from 11/01–11/03, on one class, at once.
 *
 * Two things only show up when decorators are combined:
 *
 *   COMPOSITION. Decorators nest like function calls — `@a @b m()` becomes
 *   `a(b(m))` — so the one written closest to the member is the innermost
 *   wrapper. Swap two lines and the behaviour changes. TODO 5 turns that into
 *   an observable requirement rather than trivia.
 *
 *   ORDER ACROSS KINDS. A class body has fields, accessors, methods, getters,
 *   statics and the class itself, and they are not decorated in the order you
 *   read them. TODO 1 builds the instrument that shows you.
 *
 * Read README.md first. Replace every TODO.
 */

/** One line of the audit trail kept for each instance. */
export type AuditEntry = {
  method: string;
  args: readonly unknown[];
  ok: boolean;
};

/** Per-instance audit trails. `audited` writes here; the tests read it back. */
const trails = new WeakMap<object, AuditEntry[]>();

/** Read an instance's audit trail. Given — do not change it. */
export function auditTrailOf(instance: object): readonly AuditEntry[] {
  return trails.get(instance) ?? [];
}

/** Append to an instance's audit trail, creating it on first use. Given. */
export function recordAudit(instance: object, entry: AuditEntry): void {
  const existing = trails.get(instance);
  if (existing === undefined) {
    trails.set(instance, [entry]);
    return;
  }
  existing.push(entry);
}

/** Where `trace` records what happened, and when. */
export const order: string[] = [];

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// One factory that can decorate ANY kind of member, and says which it was.
//
//   trace("A")                      ->  push `eval:A`
//   applied to a class              ->  push `apply:A:class`
//   applied to anything else        ->  push `apply:A:${kind}:${name}`
//
// The returned decorator must fit a class, a field, an accessor, a method, a
// getter and a static — so type its context as `DecoratorContext`, the union of
// all of them, and return nothing.
//
// You cannot read `context.name` off the union directly: on a class decorator it
// is `string | undefined` (an anonymous class has no name) while everywhere else
// it is `string | symbol`. Narrow on `context.kind` first — that is what the
// literal `kind` field is for.
export function trace(
  _label: string,
): (value: unknown, context: DecoratorContext) => void {
  throw new Error("TODO 1: implement trace");
}

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// Refuse to run the method unless the instance is open.
//
//   account.isOpen = false;
//   account.withdraw(10)   ->  throws Error("account is closed")
//
// The interesting part is the TYPE: this decorator only makes sense on a class
// that has an `isOpen` flag, and the constraint on `This` is how you say so.
// Applying it to a class without one must be a compile error — the tests check.
export function requireOpen<
  This extends { readonly isOpen: boolean },
  Args extends unknown[],
  Return,
>(
  _target: (this: This, ...args: Args) => Return,
  _context: ClassMethodDecoratorContext<
    This,
    (this: This, ...args: Args) => Return
  >,
): (this: This, ...args: Args) => Return {
  throw new Error("TODO 2: implement requireOpen");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Record every call on the instance's own audit trail — including the ones that
// throw.
//
//   account.deposit(50)          ->  { method: "deposit", args: [50], ok: true }
//   a failing account.withdraw(1) ->  { method: "withdraw", args: [1], ok: false }
//                                     and the error still reaches the caller
//
// Use `recordAudit(this, …)`. Do not swallow the error: record, then rethrow.
export function audited<This extends object, Args extends unknown[], Return>(
  _target: (this: This, ...args: Args) => Return,
  _context: ClassMethodDecoratorContext<
    This,
    (this: This, ...args: Args) => Return
  >,
): (this: This, ...args: Args) => Return {
  throw new Error("TODO 3: implement audited");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// A GETTER decorator — a fifth kind, with its own context type. Round the
// getter's result to two decimal places.
//
//   get available() { return 100 / 3 }   ->  33.33
//
// A getter decorator receives the getter function and returns a replacement, so
// it is closer to a method decorator than to an accessor one. Note that
// `ClassGetterDecoratorContext` is NOT `ClassAccessorDecoratorContext`.
export function rounded<This>(
  _target: (this: This) => number,
  _context: ClassGetterDecoratorContext<This, number>,
): (this: This) => number {
  throw new Error("TODO 4: implement rounded");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// Decorate `Account` below so that all of this holds:
//
//   1. `withdraw` and `deposit` are both audited.
//   2. `withdraw` refuses to run on a closed account.
//   3. A withdrawal REJECTED because the account is closed still appears in the
//      audit trail, with ok: false. Only one of the two possible orderings gives
//      you that — work out which, and why.
//   4. `available` is rounded to two decimal places.
//
// Add decorator lines only; leave the bodies alone.

/* ── The subjects ──────────────────────────────────────────────────────────
 * Inside factories so a starter that throws during decoration cannot kill test
 * collection (CONVENTIONS rule 2), and so each test gets a fresh class.
 * ----------------------------------------------------------------------- */

export function makeAccount() {
  class Account {
    isOpen = true;

    accessor balance = 0;

    // TODO 5: audited, and closed-account-guarded.
    withdraw(amount: number): number {
      if (amount > this.balance) throw new RangeError("insufficient funds");
      this.balance -= amount;
      return this.balance;
    }

    // TODO 5: audited.
    deposit(amount: number): number {
      this.balance += amount;
      return this.balance;
    }

    // TODO 5: rounded.
    get available(): number {
      return this.balance / 3;
    }
  }

  return Account;
}

/**
 * Given, and fully decorated: the specimen the ordering tests read. Every
 * decorator here is a `trace`, so the trail it produces is the whole story of
 * how a class body is decorated.
 */
export function makeOrderDemo() {
  @trace("outerClass")
  @trace("innerClass")
  class OrderDemo {
    @trace("field")
    id = "demo";

    @trace("accessor")
    accessor size = 1;

    @trace("outerMethod")
    @trace("innerMethod")
    run(): string {
      return "ok";
    }

    @trace("getter")
    get label(): string {
      return this.id;
    }

    @trace("staticMethod")
    static describe(): string {
      return "OrderDemo";
    }
  }

  return OrderDemo;
}
