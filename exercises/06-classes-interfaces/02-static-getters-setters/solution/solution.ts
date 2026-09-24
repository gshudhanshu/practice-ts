/**
 * Solution — 06/02 static members, getters & setters
 */

export class Temperature {
  // `static` puts it on the CLASS, not on instances. `readonly` blocks
  // reassignment. The inferred type is the literal -273.15, not `number`,
  // because `static readonly` behaves like `const` here.
  static readonly ABSOLUTE_ZERO_CELSIUS = -273.15;

  // A private static field: shared mutable state, invisible outside the class.
  // `#` makes it genuinely private at runtime, so nothing can tamper with it.
  static #instanceCount = 0;

  // A private constructor means `new Temperature(…)` is only legal INSIDE the
  // class. Every caller must go through a named factory, which is what lets us
  // validate first and count reliably.
  private constructor(private celsiusValue: number) {}

  static #assertAboveAbsoluteZero(celsius: number): void {
    if (
      !Number.isFinite(celsius) ||
      celsius < Temperature.ABSOLUTE_ZERO_CELSIUS
    ) {
      throw new RangeError(
        `Temperature ${celsius}°C is below absolute zero`,
      );
    }
  }

  static fromCelsius(celsius: number): Temperature {
    // Validate BEFORE counting or constructing, so a rejected value leaves no
    // trace — that is what the "does not count failures" test checks.
    Temperature.#assertAboveAbsoluteZero(celsius);
    Temperature.#instanceCount += 1;
    return new Temperature(celsius);
  }

  static fromFahrenheit(fahrenheit: number): Temperature {
    // Delegating means validation and counting exist in exactly one place.
    return Temperature.fromCelsius((fahrenheit - 32) * (5 / 9));
  }

  get celsius(): number {
    return this.celsiusValue;
  }

  get fahrenheit(): number {
    return this.celsiusValue * (9 / 5) + 32;
  }

  // A setter with validation: the object cannot be put into an invalid state
  // even though the property looks like a plain assignment target.
  set fahrenheit(value: number) {
    const celsius = (value - 32) * (5 / 9);
    Temperature.#assertAboveAbsoluteZero(celsius);
    this.celsiusValue = celsius;
  }

  // A static getter — read-only public access to private static state.
  static get created(): number {
    return Temperature.#instanceCount;
  }
}
