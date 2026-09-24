/**
 * Exercise 11/02 — Field, accessor and initializer decorators
 *
 * Methods are the easy case (11/01). Fields are stranger, because there is no
 * function to wrap — a field is a value produced by an initializer expression.
 * So a FIELD decorator does not return a replacement field; it returns a
 * function that transforms the initial value:
 *
 *   (target: undefined, context) => (this, initialValue) => newValue
 *
 * `target` is always `undefined` for a field. There is nothing to hand you.
 *
 * The `accessor` keyword fills the gap. `accessor x = 1` declares a real
 * getter/setter pair backed by a private slot, so an ACCESSOR decorator gets
 * something to wrap — `{ get, set }` in, `{ get?, set?, init? }` out.
 *
 * And `context.addInitializer(fn)` is the escape hatch every kind has: run `fn`
 * with `this` bound to the instance while it is being constructed.
 *
 * Read README.md first. Replace every TODO.
 */

/** One recorded write, from `tracked`. */
export type Write = { field: string; value: unknown };

/** The shared sink. The tests read it; they never spy on the console. */
export const writes: Write[] = [];

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Name the shape of a field decorator.
//
//   Parameters<FieldDecorator<C, number>>[0]         ->  undefined
//   Parameters<FieldDecorator<C, number>>[1]["kind"] ->  "field"
//   ReturnType<FieldDecorator<C, number>>            ->  (this: C, value: number) => number
//
// The returned function is the "initializer transform": it receives whatever the
// field's initializer produced and returns what the field should actually hold.
export type FieldDecorator<This, Value> = unknown;

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// Double a numeric field's initial value.
//
//   class Config { @doubled retries = 3 }   ->  new Config().retries === 6
//
// Note what you are NOT given: no way to read the field later, no way to
// intercept writes. A field decorator sees the initial value once, and that is
// all. (`context.access` can read it back, but it cannot hook assignment.)
export function doubled<This>(
  _target: undefined,
  _context: ClassFieldDecoratorContext<This, number>,
): (this: This, initial: number) => number {
  throw new Error("TODO 2: implement doubled");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Record every write to an `accessor` field, including the initial one.
//
//   const t = new Thermostat();     ->  pushes { field: "label", value: "kitchen" }
//   t.label = "hall";               ->  pushes { field: "label", value: "hall" }
//   t.label                         ->  "hall"  (reads are not recorded)
//
// You get `{ get, set }` and return `{ get?, set?, init? }`. Anything you leave
// out keeps the original behaviour, so a decorator that only cares about writes
// need not restate `get` — but restating it is harmless and the tests allow it.
//
// `init` runs during construction and returns the value the backing slot starts
// with. `set` runs for every later assignment.
export function tracked<This, Value>(
  _target: ClassAccessorDecoratorTarget<This, Value>,
  _context: ClassAccessorDecoratorContext<This, Value>,
): ClassAccessorDecoratorResult<This, Value> {
  throw new Error("TODO 3: implement tracked");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Reject negative numbers — on assignment AND on the initial value.
//
//   t.target = -1                     ->  throws RangeError("target must not be negative")
//   class B { @positive accessor n = -5 }
//   new B()                           ->  throws RangeError("n must not be negative")
//
// Zero is allowed. The message must be exactly `${name} must not be negative`,
// where `name` comes from the context.
export function positive<This>(
  _target: ClassAccessorDecoratorTarget<This, number>,
  _context: ClassAccessorDecoratorContext<This, number>,
): ClassAccessorDecoratorResult<This, number> {
  throw new Error("TODO 4: implement positive");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// Bind a method to its instance, so it survives being pulled off the object.
//
//   const inc = new Counter().inc;
//   inc(); inc();                     ->  works, and updates that counter
//
// This one returns NOTHING. Instead it registers an initializer:
//
//   context.addInitializer(function (this: This) { … });
//
// The callback runs while the instance is being constructed, with `this` bound
// to it — so that is where you install the bound copy as an own property.
// Use a `function`, not an arrow: you need the `this` the runtime passes.
export function bound<This extends object, Args extends unknown[], Return>(
  _target: (this: This, ...args: Args) => Return,
  _context: ClassMethodDecoratorContext<
    This,
    (this: This, ...args: Args) => Return
  >,
): void {
  throw new Error("TODO 5: implement bound");
}

/* ── The subjects ──────────────────────────────────────────────────────────
 * Inside factories so a starter that throws during decoration cannot kill test
 * collection (CONVENTIONS rule 2), and so each test gets a fresh class.
 * ----------------------------------------------------------------------- */

export function makeConfig() {
  class Config {
    @doubled
    retries = 3;

    @doubled
    timeout = 50;

    /** Undecorated, to prove the transform is per-field. */
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

/** Its initial value is illegal, so constructing it must throw. */
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

    /** Undecorated, so detaching it must break. */
    dec(): void {
      this.count -= 1;
    }
  }

  return Counter;
}
