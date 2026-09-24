/**
 * Solution — 11/04 A decorator suite
 */

export type AuditEntry = {
  method: string;
  args: readonly unknown[];
  ok: boolean;
};

const trails = new WeakMap<object, AuditEntry[]>();

export function auditTrailOf(instance: object): readonly AuditEntry[] {
  return trails.get(instance) ?? [];
}

export function recordAudit(instance: object, entry: AuditEntry): void {
  const existing = trails.get(instance);
  if (existing === undefined) {
    trails.set(instance, [entry]);
    return;
  }
  existing.push(entry);
}

export const order: string[] = [];

export function trace(
  label: string,
): (value: unknown, context: DecoratorContext) => void {
  // Evaluation happens here, when the decorator expression is read.
  order.push(`eval:${label}`);

  return function (_value: unknown, context: DecoratorContext): void {
    // `DecoratorContext` is a discriminated union over `kind`. The class member
    // is the odd one out — its `name` is `string | undefined`, because a class
    // expression need not be named — so narrow before touching `name`.
    if (context.kind === "class") {
      order.push(`apply:${label}:class`);
      return;
    }
    order.push(`apply:${label}:${context.kind}:${String(context.name)}`);
  };
}

export function requireOpen<
  This extends { readonly isOpen: boolean },
  Args extends unknown[],
  Return,
>(
  target: (this: This, ...args: Args) => Return,
  _context: ClassMethodDecoratorContext<
    This,
    (this: This, ...args: Args) => Return
  >,
): (this: This, ...args: Args) => Return {
  // The constraint on `This` is the whole point: it is checked where the
  // decorator is APPLIED, so a class without `isOpen` fails to compile.
  return function (this: This, ...args: Args): Return {
    if (!this.isOpen) throw new Error("account is closed");
    return target.call(this, ...args);
  };
}

export function audited<This extends object, Args extends unknown[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<
    This,
    (this: This, ...args: Args) => Return
  >,
): (this: This, ...args: Args) => Return {
  const method = String(context.name);

  return function (this: This, ...args: Args): Return {
    try {
      const result = target.call(this, ...args);
      recordAudit(this, { method, args, ok: true });
      return result;
    } catch (error) {
      // Record, then rethrow. Swallowing here would turn a failed withdrawal
      // into a silent one — and an audit log that only records successes is
      // worse than none.
      recordAudit(this, { method, args, ok: false });
      throw error;
    }
  };
}

export function rounded<This>(
  target: (this: This) => number,
  _context: ClassGetterDecoratorContext<This, number>,
): (this: This) => number {
  // A getter decorator wraps a function, like a method decorator — unlike an
  // accessor decorator, which wraps a get/set pair.
  return function (this: This): number {
    return Math.round(target.call(this) * 100) / 100;
  };
}

/* ── The subjects ─────────────────────────────────────────────────────────── */

export function makeAccount() {
  class Account {
    isOpen = true;

    accessor balance = 0;

    // Order matters and is observable. Application is bottom-up, so
    // `requireOpen` wraps the original method first and `audited` wraps that —
    // making `audited` the OUTER wrapper. A closed-account rejection therefore
    // happens inside `audited`'s try block and is recorded with ok: false.
    //
    // Written the other way round, `requireOpen` would throw before `audited`
    // ever ran, and the refused withdrawal would leave no trace at all.
    @audited
    @requireOpen
    withdraw(amount: number): number {
      if (amount > this.balance) throw new RangeError("insufficient funds");
      this.balance -= amount;
      return this.balance;
    }

    @audited
    deposit(amount: number): number {
      this.balance += amount;
      return this.balance;
    }

    @rounded
    get available(): number {
      return this.balance / 3;
    }
  }

  return Account;
}

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
