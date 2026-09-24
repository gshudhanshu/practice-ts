import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import { BankAccount } from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _balanceType = Expect<Equal<BankAccount["balance"], number>>;

function _compileTimeOnly(): void {
  const account = new BankAccount("Ada", 1000);

  // @ts-expect-error — owner is readonly.
  account.owner = "Grace";

  // @ts-expect-error — balance is a getter with no setter.
  account.balance = 999;

  // @ts-expect-error — balanceCents is private.
  account.balanceCents;
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("construction", () => {
  it("exposes the owner and opening balance", () => {
    const account = new BankAccount("Ada", 1000);
    expect(account.owner).toBe("Ada");
    expect(account.balance).toBe(1000);
  });

  it("allows a zero opening balance", () => {
    expect(new BankAccount("Ada", 0).balance).toBe(0);
  });

  it("rejects an invalid opening balance", () => {
    expect(() => new BankAccount("Ada", -1)).toThrow();
    expect(() => new BankAccount("Ada", 10.5)).toThrow();
  });
});

describe("deposit", () => {
  it("increases the balance", () => {
    const account = new BankAccount("Ada", 1000);
    account.deposit(500);
    expect(account.balance).toBe(1500);
  });

  it("rejects non-positive or non-integer amounts", () => {
    const account = new BankAccount("Ada", 1000);
    expect(() => account.deposit(0)).toThrow(RangeError);
    expect(() => account.deposit(-5)).toThrow(RangeError);
    expect(() => account.deposit(1.5)).toThrow(RangeError);
    expect(() => account.deposit(Number.NaN)).toThrow(RangeError);
    expect(account.balance).toBe(1000);
  });
});

describe("withdraw", () => {
  it("removes funds when they are available", () => {
    const account = new BankAccount("Ada", 1000);
    expect(account.withdraw(400)).toBe(true);
    expect(account.balance).toBe(600);
  });

  it("allows withdrawing the whole balance", () => {
    const account = new BankAccount("Ada", 1000);
    expect(account.withdraw(1000)).toBe(true);
    expect(account.balance).toBe(0);
  });

  it("refuses and changes nothing when funds are short", () => {
    const account = new BankAccount("Ada", 1000);
    expect(account.withdraw(1001)).toBe(false);
    expect(account.balance).toBe(1000);
  });

  it("still throws on an invalid amount", () => {
    const account = new BankAccount("Ada", 1000);
    expect(() => account.withdraw(-5)).toThrow(RangeError);
    expect(() => account.withdraw(2.5)).toThrow(RangeError);
  });
});

describe("transferTo", () => {
  it("moves money between accounts", () => {
    const from = new BankAccount("Ada", 1000);
    const to = new BankAccount("Grace", 200);

    expect(from.transferTo(to, 300)).toBe(true);
    expect(from.balance).toBe(700);
    expect(to.balance).toBe(500);
  });

  it("refuses and leaves both accounts untouched when funds are short", () => {
    const from = new BankAccount("Ada", 100);
    const to = new BankAccount("Grace", 200);

    expect(from.transferTo(to, 300)).toBe(false);
    expect(from.balance).toBe(100);
    expect(to.balance).toBe(200);
  });

  it("still throws on an invalid amount", () => {
    const from = new BankAccount("Ada", 1000);
    const to = new BankAccount("Grace", 0);
    expect(() => from.transferTo(to, 0)).toThrow(RangeError);
  });
});
