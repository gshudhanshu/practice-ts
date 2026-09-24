import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  bound,
  doubled,
  makeBrokenThermostat,
  makeConfig,
  makeCounter,
  makeThermostat,
  positive,
  tracked,
  writes,
  type FieldDecorator,
} from "./exercise";

/* ── Fixtures ───────────────────────────────────────────────────────────── */

class Host {
  readonly tag = "host";
}

type NumberField = FieldDecorator<Host, number>;

function reset(): void {
  writes.length = 0;
}

/* ── Compile-time spec ──────────────────────────────────────────────────── */

// TODO 1 — a field decorator gets no target and returns an initializer.
type _fieldTarget = Expect<Equal<Parameters<NumberField>[0], undefined>>;
type _fieldKind = Expect<Equal<Parameters<NumberField>[1]["kind"], "field">>;
type _fieldReturn = Expect<
  Equal<ReturnType<NumberField>, (this: Host, initial: number) => number>
>;

// Decorating never changes the declared type of the member.
type Config = InstanceType<ReturnType<typeof makeConfig>>;
type _retries = Expect<Equal<Config["retries"], number>>;
type _label = Expect<Equal<Config["label"], string>>;

type Thermostat = InstanceType<ReturnType<typeof makeThermostat>>;
type _accessorLabel = Expect<Equal<Thermostat["label"], string>>;
type _accessorTarget = Expect<Equal<Thermostat["target"], number>>;

type Counter = InstanceType<ReturnType<typeof makeCounter>>;
type _inc = Expect<Equal<Counter["inc"], () => void>>;

function _compileTimeOnly(): void {
  const _fits: NumberField = doubled;
  void _fits;

  class Wrong {
    // @ts-expect-error — `doubled` is a FIELD decorator; a method is not a field.
    @doubled
    method(): number {
      return 1;
    }

    // @ts-expect-error — `doubled` only fits a `number` field.
    @doubled
    name = "not a number";

    // @ts-expect-error — an `accessor` has its own context type, not a field's.
    @doubled
    accessor size = 1;

    // @ts-expect-error — `tracked` is an ACCESSOR decorator; this is a plain field.
    @tracked
    plain = 1;

    // @ts-expect-error — `positive` needs an accessor, not a method.
    @positive
    grow(): number {
      return 1;
    }

    // @ts-expect-error — `bound` is a method decorator; a field is not a method.
    @bound
    handler = (): void => {};
  }
  void Wrong;
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("doubled", () => {
  it("transforms the initial value of every decorated field", () => {
    const Config = makeConfig();
    const config = new Config();

    expect(config.retries).toBe(6);
    expect(config.timeout).toBe(100);
  });

  it("leaves undecorated fields alone", () => {
    const Config = makeConfig();

    expect(new Config().label).toBe("default");
  });

  it("runs per instance, not once for the class", () => {
    const Config = makeConfig();
    const first = new Config();
    first.retries = 99;

    expect(new Config().retries).toBe(6);
  });
});

describe("tracked", () => {
  it("records the initial value at construction", () => {
    reset();
    const Thermostat = makeThermostat();
    new Thermostat();

    expect(writes).toEqual([{ field: "label", value: "kitchen" }]);
  });

  it("records every assignment", () => {
    reset();
    const Thermostat = makeThermostat();
    const thermostat = new Thermostat();
    thermostat.label = "hall";
    thermostat.label = "loft";

    expect(writes).toEqual([
      { field: "label", value: "kitchen" },
      { field: "label", value: "hall" },
      { field: "label", value: "loft" },
    ]);
  });

  it("still reads back the stored value", () => {
    reset();
    const Thermostat = makeThermostat();
    const thermostat = new Thermostat();

    expect(thermostat.label).toBe("kitchen");
    thermostat.label = "hall";
    expect(thermostat.label).toBe("hall");
  });

  it("does not record reads", () => {
    reset();
    const Thermostat = makeThermostat();
    const thermostat = new Thermostat();
    void thermostat.label;
    void thermostat.label;

    expect(writes).toHaveLength(1);
  });

  it("keeps each instance's value separate", () => {
    reset();
    const Thermostat = makeThermostat();
    const first = new Thermostat();
    const second = new Thermostat();
    first.label = "hall";

    expect(second.label).toBe("kitchen");
  });
});

describe("positive", () => {
  it("allows zero and positive assignments", () => {
    const Thermostat = makeThermostat();
    const thermostat = new Thermostat();

    thermostat.target = 0;
    expect(thermostat.target).toBe(0);

    thermostat.target = 31;
    expect(thermostat.target).toBe(31);
  });

  it("rejects a negative assignment", () => {
    const Thermostat = makeThermostat();
    const thermostat = new Thermostat();

    expect(() => {
      thermostat.target = -1;
    }).toThrow(new RangeError("target must not be negative"));

    // The rejected write must not have landed.
    expect(thermostat.target).toBe(20);
  });

  it("rejects a negative initial value at construction", () => {
    const BrokenThermostat = makeBrokenThermostat();

    expect(() => new BrokenThermostat()).toThrow(
      new RangeError("target must not be negative"),
    );
  });
});

describe("bound", () => {
  it("keeps `this` when the method is detached", () => {
    const Counter = makeCounter();
    const counter = new Counter();
    const inc = counter.inc;

    inc();
    inc();

    expect(counter.count).toBe(2);
  });

  it("binds per instance", () => {
    const Counter = makeCounter();
    const first = new Counter();
    const second = new Counter();

    const incFirst = first.inc;
    incFirst();

    expect(first.count).toBe(1);
    expect(second.count).toBe(0);
  });

  it("leaves undecorated methods unbound", () => {
    const Counter = makeCounter();
    const dec = new Counter().dec;

    expect(() => dec()).toThrow(TypeError);
  });

  it("still works when called normally", () => {
    const Counter = makeCounter();
    const counter = new Counter();
    counter.inc();

    expect(counter.count).toBe(1);
  });
});
