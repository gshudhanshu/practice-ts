/**
 * Solution — 11/02 Field, accessor and initializer decorators
 */

export type Write = { field: string; value: unknown };

export const writes: Write[] = [];

// `target` is `undefined` for a field — there is no function to hand over. The
// decorator's return value is the initializer transform.
export type FieldDecorator<This, Value> = (
  target: undefined,
  context: ClassFieldDecoratorContext<This, Value>,
) => (this: This, initial: Value) => Value;

export function doubled<This>(
  _target: undefined,
  _context: ClassFieldDecoratorContext<This, number>,
): (this: This, initial: number) => number {
  // Runs once per field, per class. The function it returns runs once per
  // instance, during construction, with `this` set to that instance.
  return function (this: This, initial: number): number {
    return initial * 2;
  };
}

export function tracked<This, Value>(
  target: ClassAccessorDecoratorTarget<This, Value>,
  context: ClassAccessorDecoratorContext<This, Value>,
): ClassAccessorDecoratorResult<This, Value> {
  const field = String(context.name);

  return {
    // Restated verbatim: `tracked` does not record reads, but showing `get`
    // makes the delegation to the original pair explicit.
    get(this: This): Value {
      return target.get.call(this);
    },

    // Every assignment after construction.
    set(this: This, value: Value): void {
      writes.push({ field, value });
      target.set.call(this, value);
    },

    // Construction. `init` returns what the backing slot should start with —
    // returning `initial` unchanged means "record it, do not alter it".
    init(this: This, initial: Value): Value {
      writes.push({ field, value: initial });
      return initial;
    },
  };
}

export function positive<This>(
  target: ClassAccessorDecoratorTarget<This, number>,
  context: ClassAccessorDecoratorContext<This, number>,
): ClassAccessorDecoratorResult<This, number> {
  const field = String(context.name);

  const check = (value: number): number => {
    if (value < 0) throw new RangeError(`${field} must not be negative`);
    return value;
  };

  // No `get` in the result: leaving a member out keeps the original behaviour,
  // which is the point of the result object being all-optional.
  return {
    set(this: This, value: number): void {
      target.set.call(this, check(value));
    },
    init(this: This, initial: number): number {
      return check(initial);
    },
  };
}

export function bound<This extends object, Args extends unknown[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<
    This,
    (this: This, ...args: Args) => Return
  >,
): void {
  const name = context.name;

  // Returning a replacement would not help: the replacement still lives on the
  // prototype and still needs a receiver. Binding has to happen per instance,
  // and `addInitializer` is the only hook that runs per instance.
  context.addInitializer(function (this: This): void {
    // `function`, not an arrow — the runtime supplies `this` here.
    // An own property shadows the prototype method for this instance only.
    Object.defineProperty(this, name, {
      value: target.bind(this),
      configurable: true,
      writable: true,
      enumerable: false,
    });
  });
}

/* ── The subjects ─────────────────────────────────────────────────────────── */

export function makeConfig() {
  class Config {
    @doubled
    retries = 3;

    @doubled
    timeout = 50;

    label = "default";
  }

  return Config;
}

export function makeThermostat() {
  class Thermostat {
    @tracked
    accessor label = "kitchen";

    @positive
    accessor target = 20;
  }

  return Thermostat;
}

export function makeBrokenThermostat() {
  class BrokenThermostat {
    @positive
    accessor target = -5;
  }

  return BrokenThermostat;
}

export function makeCounter() {
  class Counter {
    count = 0;

    @bound
    inc(): void {
      this.count += 1;
    }

    dec(): void {
      this.count -= 1;
    }
  }

  return Counter;
}
