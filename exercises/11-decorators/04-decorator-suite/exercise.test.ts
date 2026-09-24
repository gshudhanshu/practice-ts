import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  audited,
  auditTrailOf,
  makeAccount,
  makeOrderDemo,
  order,
  requireOpen,
  rounded,
  trace,
  type AuditEntry,
} from "./exercise";

/* ── Fixtures ───────────────────────────────────────────────────────────── */

function reset(): void {
  order.length = 0;
}

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type Trace = ReturnType<typeof trace>;
type _traceValue = Expect<Equal<Parameters<Trace>[0], unknown>>;
type _traceContext = Expect<Equal<Parameters<Trace>[1], DecoratorContext>>;
type _traceReturn = Expect<Equal<ReturnType<Trace>, void>>;

type Account = InstanceType<ReturnType<typeof makeAccount>>;
type _balance = Expect<Equal<Account["balance"], number>>;
type _withdraw = Expect<Equal<Account["withdraw"], (amount: number) => number>>;
type _available = Expect<Equal<Account["available"], number>>;
type _isOpen = Expect<Equal<Account["isOpen"], boolean>>;

type _entry = Expect<
  Equal<AuditEntry, { method: string; args: readonly unknown[]; ok: boolean }>
>;

function _compileTimeOnly(): void {
  class Openable {
    isOpen = true;

    @requireOpen
    @audited
    act(): number {
      return 1;
    }
  }
  void Openable;

  class NotOpenable {
    // @ts-expect-error — `requireOpen` constrains `This` to have `isOpen`.
    @requireOpen
    act(): number {
      return 1;
    }
  }
  void NotOpenable;

  class WrongKinds {
    // @ts-expect-error — `rounded` decorates a getter, not a plain method.
    @rounded
    value(): number {
      return 1;
    }

    // @ts-expect-error — `rounded` only fits a numeric getter.
    @rounded
    get name(): string {
      return "x";
    }

    // @ts-expect-error — `audited` decorates a method, not a field.
    @audited
    tally = 0;
  }
  void WrongKinds;

  // `trace` fits every kind — that is the point of typing it over the union.
  @trace("class")
  class Everything {
    @trace("field")
    id = "x";

    @trace("accessor")
    accessor size = 1;

    @trace("method")
    run(): void {}

    @trace("getter")
    get label(): string {
      return this.id;
    }

    @trace("setter")
    set label(_value: string) {}

    @trace("static")
    static make(): void {}
  }
  void Everything;
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("trace", () => {
  it("reports the kind and name of whatever it decorates", () => {
    reset();
    makeOrderDemo();

    expect(order).toContain("apply:field:field:id");
    expect(order).toContain("apply:accessor:accessor:size");
    expect(order).toContain("apply:innerMethod:method:run");
    expect(order).toContain("apply:getter:getter:label");
    expect(order).toContain("apply:staticMethod:method:describe");
    expect(order).toContain("apply:innerClass:class");
  });

  it("evaluates every decorator expression before applying any of them", () => {
    reset();
    makeOrderDemo();

    const firstApply = order.findIndex((entry) => entry.startsWith("apply:"));
    const lastEval = order.map((e) => e.startsWith("eval:")).lastIndexOf(true);

    expect(lastEval).toBeLessThan(firstApply);
  });

  it("evaluates expressions top-down, in source order", () => {
    reset();
    makeOrderDemo();

    expect(order.filter((entry) => entry.startsWith("eval:"))).toEqual([
      "eval:outerClass",
      "eval:innerClass",
      "eval:field",
      "eval:accessor",
      "eval:outerMethod",
      "eval:innerMethod",
      "eval:getter",
      "eval:staticMethod",
    ]);
  });

  it("applies stacked decorators bottom-up, and the class last of all", () => {
    reset();
    makeOrderDemo();

    expect(order.filter((entry) => entry.startsWith("apply:"))).toEqual([
      // Statics first.
      "apply:staticMethod:method:describe",
      // Then instance members that are not fields, in source order — and the
      // two on `run` closest-first.
      "apply:accessor:accessor:size",
      "apply:innerMethod:method:run",
      "apply:outerMethod:method:run",
      "apply:getter:getter:label",
      // Then instance fields.
      "apply:field:field:id",
      // Then the class itself, bottom-up.
      "apply:innerClass:class",
      "apply:outerClass:class",
    ]);
  });
});

describe("audited", () => {
  it("records successful calls", () => {
    const Account = makeAccount();
    const account = new Account();
    account.deposit(50);
    account.withdraw(20);

    expect(auditTrailOf(account)).toEqual([
      { method: "deposit", args: [50], ok: true },
      { method: "withdraw", args: [20], ok: true },
    ]);
  });

  it("keeps a separate trail per instance", () => {
    const Account = makeAccount();
    const first = new Account();
    const second = new Account();
    first.deposit(10);

    expect(auditTrailOf(first)).toHaveLength(1);
    expect(auditTrailOf(second)).toHaveLength(0);
  });

  it("records a failure and lets the error through", () => {
    const Account = makeAccount();
    const account = new Account();

    expect(() => account.withdraw(999)).toThrow(RangeError);
    expect(auditTrailOf(account)).toEqual([
      { method: "withdraw", args: [999], ok: false },
    ]);
  });
});

describe("requireOpen", () => {
  it("allows calls while the account is open", () => {
    const Account = makeAccount();
    const account = new Account();

    expect(account.deposit(10)).toBe(10);
    expect(account.withdraw(4)).toBe(6);
  });

  it("refuses to run on a closed account", () => {
    const Account = makeAccount();
    const account = new Account();
    account.deposit(100);
    account.isOpen = false;

    expect(() => account.withdraw(10)).toThrow("account is closed");
    expect(account.balance).toBe(100);
  });

  it("does not guard deposit", () => {
    const Account = makeAccount();
    const account = new Account();
    account.isOpen = false;

    expect(account.deposit(5)).toBe(5);
  });
});

describe("composition order", () => {
  it("audits a withdrawal that was refused because the account is closed", () => {
    // This is the ordering test. `@audited` must be the OUTER wrapper, so the
    // rejection thrown by `@requireOpen` happens inside its try block.
    const Account = makeAccount();
    const account = new Account();
    account.deposit(100);
    account.isOpen = false;

    expect(() => account.withdraw(10)).toThrow("account is closed");
    expect(auditTrailOf(account)).toEqual([
      { method: "deposit", args: [100], ok: true },
      { method: "withdraw", args: [10], ok: false },
    ]);
  });
});

describe("rounded", () => {
  it("rounds the getter to two decimal places", () => {
    const Account = makeAccount();
    const account = new Account();
    account.deposit(100);

    expect(account.available).toBe(33.33);
  });

  it("leaves an exact value alone", () => {
    const Account = makeAccount();
    const account = new Account();
    account.deposit(30);

    expect(account.available).toBe(10);
  });

  it("recomputes on every read", () => {
    const Account = makeAccount();
    const account = new Account();

    expect(account.available).toBe(0);
    account.deposit(9);
    expect(account.available).toBe(3);
  });
});
