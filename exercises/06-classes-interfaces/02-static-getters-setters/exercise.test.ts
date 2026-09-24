import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import { Temperature } from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _celsius = Expect<Equal<Temperature["celsius"], number>>;
type _fahrenheit = Expect<Equal<Temperature["fahrenheit"], number>>;
type _created = Expect<Equal<typeof Temperature.created, number>>;

function _compileTimeOnly(): void {
  // @ts-expect-error — the constructor is private; use a factory.
  const _direct = new Temperature(20);

  const t = Temperature.fromCelsius(0);

  // @ts-expect-error — celsius is read-only (getter with no setter).
  t.celsius = 10;

  // fahrenheit IS writable.
  t.fahrenheit = 100;

  // @ts-expect-error — the constant is readonly.
  Temperature.ABSOLUTE_ZERO_CELSIUS = 0;

  // @ts-expect-error — the instance counter is read-only from outside.
  Temperature.created = 0;
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("ABSOLUTE_ZERO_CELSIUS", () => {
  it("is a class-level constant", () => {
    expect(Temperature.ABSOLUTE_ZERO_CELSIUS).toBe(-273.15);
  });
});

describe("factories", () => {
  it("builds from Celsius", () => {
    expect(Temperature.fromCelsius(100).celsius).toBe(100);
    expect(Temperature.fromCelsius(0).celsius).toBe(0);
  });

  it("builds from Fahrenheit", () => {
    expect(Temperature.fromFahrenheit(32).celsius).toBeCloseTo(0, 10);
    expect(Temperature.fromFahrenheit(212).celsius).toBeCloseTo(100, 10);
    expect(Temperature.fromFahrenheit(-40).celsius).toBeCloseTo(-40, 10);
  });

  it("accepts exactly absolute zero", () => {
    expect(Temperature.fromCelsius(-273.15).celsius).toBe(-273.15);
  });

  it("rejects anything colder", () => {
    expect(() => Temperature.fromCelsius(-273.16)).toThrow(RangeError);
    expect(() => Temperature.fromCelsius(-300)).toThrow(RangeError);
    expect(() => Temperature.fromFahrenheit(-500)).toThrow(RangeError);
  });
});

describe("conversions", () => {
  it("converts Celsius to Fahrenheit", () => {
    expect(Temperature.fromCelsius(0).fahrenheit).toBeCloseTo(32, 10);
    expect(Temperature.fromCelsius(100).fahrenheit).toBeCloseTo(212, 10);
    expect(Temperature.fromCelsius(37).fahrenheit).toBeCloseTo(98.6, 10);
  });

  it("round-trips", () => {
    const t = Temperature.fromCelsius(21.5);
    expect(Temperature.fromFahrenheit(t.fahrenheit).celsius).toBeCloseTo(21.5, 10);
  });
});

describe("the fahrenheit setter", () => {
  it("updates the stored Celsius value", () => {
    const t = Temperature.fromCelsius(0);
    t.fahrenheit = 212;
    expect(t.celsius).toBeCloseTo(100, 10);
  });

  it("rejects a value below absolute zero", () => {
    const t = Temperature.fromCelsius(0);
    expect(() => {
      t.fahrenheit = -500;
    }).toThrow(RangeError);
    expect(t.celsius).toBe(0);
  });
});

describe("the instance counter", () => {
  it("counts every instance created through a factory", () => {
    const before = Temperature.created;
    Temperature.fromCelsius(1);
    Temperature.fromFahrenheit(50);
    expect(Temperature.created).toBe(before + 2);
  });

  it("does not count instances that failed validation", () => {
    const before = Temperature.created;
    expect(() => Temperature.fromCelsius(-9999)).toThrow();
    expect(Temperature.created).toBe(before);
  });
});
