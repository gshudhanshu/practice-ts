import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  defaultOnError,
  describeTarget,
  descriptions,
  log,
  logged,
  makeCalculator,
  makeProbe,
  makeRisky,
  makeSafe,
  makeWidget,
  readonlyMethod,
  visible,
  type CallRecord,
} from "./exercise";

/* ── Fixtures ───────────────────────────────────────────────────────────── */

function reset(): void {
  log.length = 0;
  descriptions.length = 0;
}

/* ── Compile-time spec ──────────────────────────────────────────────────── */

// Decorating never changes the method's type — legacy or standard.
type Calculator = InstanceType<ReturnType<typeof makeCalculator>>;
type _add = Expect<Equal<Calculator["add"], (a: number, b: number) => number>>;

type Risky = InstanceType<ReturnType<typeof makeRisky>>;
type _parse = Expect<Equal<Risky["parse"], (n: number) => number>>;

type _record = Expect<
  Equal<CallRecord, { method: string; args: readonly unknown[] }>
>;

// A factory returns a decorator, so calling it must not produce `void`.
type Produced = ReturnType<typeof defaultOnError<number>>;
type _producesDecorator = Expect<Equal<Produced extends (...a: never) => unknown ? true : false, true>>;

// `visible` returns a descriptor; the others mutate in place.
type _visibleReturns = Expect<Equal<ReturnType<typeof visible>, PropertyDescriptor>>;
type _readonlyReturns = Expect<Equal<ReturnType<typeof readonlyMethod>, void>>;
type _describeReturns = Expect<Equal<ReturnType<typeof describeTarget>, void>>;

function _compileTimeOnly(): void {
  class Wrong {
    // @ts-expect-error — a method decorator does not fit a property.
    @logged
    name = "nope";

    // @ts-expect-error — `defaultOnError(-1)` only fits a method returning number.
    @defaultOnError(-1)
    label(): string {
      return "x";
    }
  }
  void Wrong;
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("logged", () => {
  it("records the method name and arguments", () => {
    reset();
    const Calculator = makeCalculator();

    expect(new Calculator().add(1, 2)).toBe(3);
    expect(log).toEqual([{ method: "add", args: [1, 2] }]);
  });

  it("keeps `this` bound to the instance", () => {
    reset();
    const Calculator = makeCalculator();

    class Shifted extends Calculator {
      override add(a: number, b: number): number {
        return super.add(a, b) * 10;
      }
    }

    expect(new Shifted().add(1, 2)).toBe(30);
    expect(log).toHaveLength(1);
  });

  it("installs the wrapper on the prototype, not the instance", () => {
    reset();
    const Calculator = makeCalculator();
    const calculator = new Calculator();

    expect(Object.hasOwn(calculator, "add")).toBe(false);
    expect(Object.hasOwn(Calculator.prototype, "add")).toBe(true);
  });
});

describe("readonlyMethod", () => {
  it("prevents reassignment", () => {
    const Safe = makeSafe();
    const safe = new Safe();

    expect(() => {
      safe.frozen = (): string => "hacked";
    }).toThrow(TypeError);
    expect(safe.frozen()).toBe("frozen");
  });

  it("leaves undecorated methods writable", () => {
    const Safe = makeSafe();
    const safe = new Safe();
    safe.open = (): string => "patched";

    expect(safe.open()).toBe("patched");
  });

  it("marks the descriptor non-writable", () => {
    const Safe = makeSafe();
    const descriptor = Object.getOwnPropertyDescriptor(
      Safe.prototype,
      "frozen",
    );

    expect(descriptor?.writable).toBe(false);
  });
});

describe("defaultOnError", () => {
  it("returns the real result when nothing throws", () => {
    const Risky = makeRisky();

    expect(new Risky().parse(5)).toBe(10);
  });

  it("returns the fallback when the method throws", () => {
    const Risky = makeRisky();

    expect(new Risky().parse(-1)).toBe(-1);
  });

  it("does not leak the error", () => {
    const Risky = makeRisky();

    expect(() => new Risky().parse(-1)).not.toThrow();
  });
});

describe("describeTarget", () => {
  it("sees the prototype for an instance method", () => {
    reset();
    makeProbe();

    expect(descriptions).toContainEqual({
      key: "instanceMethod",
      isStatic: false,
    });
  });

  it("sees the constructor for a static method", () => {
    reset();
    makeProbe();

    expect(descriptions).toContainEqual({
      key: "staticMethod",
      isStatic: true,
    });
  });

  it("leaves both methods callable", () => {
    reset();
    const Probe = makeProbe();

    expect(() => new Probe().instanceMethod()).not.toThrow();
    expect(() => Probe.staticMethod()).not.toThrow();
  });
});

describe("visible", () => {
  it("makes the decorated method enumerable", () => {
    const Widget = makeWidget();

    expect(Object.keys(Widget.prototype)).toEqual(["shown"]);
  });

  it("keeps the method working", () => {
    const Widget = makeWidget();

    expect(new Widget().shown()).toBe("shown");
    expect(new Widget().hidden()).toBe("hidden");
  });

  it("does not discard the rest of the descriptor", () => {
    const Widget = makeWidget();
    const descriptor = Object.getOwnPropertyDescriptor(
      Widget.prototype,
      "shown",
    );

    expect(typeof descriptor?.value).toBe("function");
    expect(descriptor?.enumerable).toBe(true);
    expect(descriptor?.configurable).toBe(true);
  });
});
