/**
 * Exercise 06/02 — static members, getters & setters
 *
 * A Temperature value object. The pattern here — private constructor plus
 * static factory methods — is one you will meet constantly in real code,
 * because it lets you name your constructors and validate before an object
 * exists.
 *
 * Read README.md first. Replace every TODO.
 */

export class Temperature {
  // ─── TODO 1 ────────────────────────────────────────────────────────────────
  // A shared constant belonging to the CLASS, not to any instance:
  // absolute zero, -273.15 °C. It must be readable as
  // `Temperature.ABSOLUTE_ZERO_CELSIUS` and must not be assignable.

  // ─── TODO 2 ────────────────────────────────────────────────────────────────
  // Make the constructor PRIVATE, so the only way in is through the factories
  // below. `new Temperature(20)` must be a compile error.
  //
  // Store the value in Celsius, in a private field.
  constructor(private celsiusValue: number) {}

  // ─── TODO 3 ────────────────────────────────────────────────────────────────
  // Two static factory methods. Both must reject anything below absolute zero
  // with a RangeError.
  //   Temperature.fromCelsius(100)
  //   Temperature.fromFahrenheit(212)
  //
  // Also count every instance ever created (TODO 5 exposes the count).
  static fromCelsius(celsius: number): Temperature {
    throw new Error("TODO 3: implement fromCelsius");
  }

  static fromFahrenheit(fahrenheit: number): Temperature {
    throw new Error("TODO 3: implement fromFahrenheit");
  }

  // ─── TODO 4 ────────────────────────────────────────────────────────────────
  // Accessors:
  //   get celsius      — the stored value
  //   get fahrenheit   — converted:  c * 9/5 + 32
  //   set fahrenheit   — converts back and stores; rejects below absolute zero
  //
  // There is deliberately NO celsius setter, so `t.celsius = 0` must not
  // compile — the only writable view is Fahrenheit.
  get celsius(): number {
    throw new Error("TODO 4: implement the celsius getter");
  }

  get fahrenheit(): number {
    throw new Error("TODO 4: implement the fahrenheit getter");
  }

  // ─── TODO 5 ────────────────────────────────────────────────────────────────
  // How many Temperature instances have ever been created, as
  // `Temperature.created`. The underlying counter must not be writable from
  // outside the class.
  static get created(): number {
    throw new Error("TODO 5: implement the created counter");
  }
}
