/**
 * Exercise 12/03 — Migrating from legacy to standard decorators
 *
 * The same two behaviours — logging a call, and binding a method to its
 * instance — written twice: once in each flavour.
 *
 * There is a catch, and it is the point of the exercise. `experimentalDecorators`
 * is a per-COMPILATION switch. It changes what `@` means for every file in the
 * program, so the two flavours cannot coexist: this directory has the flag on
 * (see its `tsconfig.json`), which means `@` here is always legacy.
 *
 * So the standard decorators below are written as ordinary functions with the
 * correct standard signature, and applied by a mini-runtime you write yourself
 * in TODO 3. That runtime is roughly what the compiler's `__esDecorate` helper
 * does, and writing it once is the fastest way to understand what a standard
 * decorator context actually is.
 *
 * Read README.md first. Replace every TODO.
 */

/** One recorded call, tagged with the flavour that recorded it. */
export type LogEntry = {
  flavour: "legacy" | "standard";
  method: string;
  args: readonly unknown[];
};

export const log: LogEntry[] = [];

/** The standard method-decorator shape, from 11/01. */
export type StandardMethodDecorator<This, Args extends unknown[], Return> = (
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<
    This,
    (this: This, ...args: Args) => Return
  >,
) => ((this: This, ...args: Args) => Return) | void;

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// The legacy version: record the call, then delegate.
//
//   greeter.greet("ada")  ->  pushes { flavour: "legacy", method: "greet", args: ["ada"] }
//                             and returns "hi ada"
//
// Three arguments, and you mutate `descriptor.value` (12/01).
export function legacyLogged<Args extends unknown[], Return>(
  _target: object,
  _propertyKey: string,
  _descriptor: TypedPropertyDescriptor<(...args: Args) => Return>,
): void {
  throw new Error("TODO 1: implement legacyLogged");
}

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// The standard version of exactly the same thing.
//
//   pushes { flavour: "standard", method: "greet", args: ["ada"] }
//
// Two arguments, and you RETURN the replacement (11/01). Nothing here may use
// `@` — it is applied by TODO 3.
export function standardLogged<This, Args extends unknown[], Return>(
  _target: (this: This, ...args: Args) => Return,
  _context: ClassMethodDecoratorContext<
    This,
    (this: This, ...args: Args) => Return
  >,
): (this: This, ...args: Args) => Return {
  throw new Error("TODO 2: implement standardLogged");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// The mini-runtime. Apply a standard method decorator by hand:
//
//   1. Build a `ClassMethodDecoratorContext` for `name` on `prototype`.
//        kind: "method", static: false, private: false
//        access.has(object)  ->  whether `name` is reachable on `object`
//        access.get(object)  ->  the member's current value on `object`
//        addInitializer(fn)  ->  collect fn; throw a TypeError if decoration
//                                has already finished
//        metadata            ->  a fresh empty object
//   2. Call the decorator with `(method, context)`.
//   3. If it returned a function, install it on `prototype` under `name` —
//      configurable and writable, but NOT enumerable, like a real method.
//   4. Mark decoration finished, and return a function that runs the collected
//      initializers against one instance, each with `this` bound to it.
//
// The real compiler injects step 4's call into the constructor for you. Here
// the subject classes call it themselves, so you can see it happening.
//
// Note the constraint `This extends Record<Key, …>` — the same trick as 08/02.
// It is what lets `access.get` read `object[name]` and get a properly typed
// function back; with a plain `name: string` the read is untyped and the whole
// runtime would need a cast.
export function applyStandardMethodDecorator<
  Key extends string,
  Args extends unknown[],
  Return,
  This extends Record<Key, (this: This, ...args: Args) => Return>,
>(
  _prototype: This,
  _name: Key,
  _method: (this: This, ...args: Args) => Return,
  _decorator: StandardMethodDecorator<This, Args, Return>,
): (instance: This) => void {
  throw new Error("TODO 3: implement applyStandardMethodDecorator");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Standard `@bound`, as in 11/02: return nothing, and use
// `context.addInitializer` to install a bound copy as an own property of the
// instance.
//
//   const inc = new Counter().inc;
//   inc(); inc();   ->  that counter's count is 2
//
// If TODO 3 is right, this needs about four lines.
export function standardBound<
  This extends object,
  Args extends unknown[],
  Return,
>(
  _target: (this: This, ...args: Args) => Return,
  _context: ClassMethodDecoratorContext<
    This,
    (this: This, ...args: Args) => Return
  >,
): void {
  throw new Error("TODO 4: implement standardBound");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// Legacy `@bound` — same behaviour, completely different mechanism.
//
// Legacy has no per-instance hook, so the trick is to RETURN a descriptor with
// a GETTER instead of a value. The first time an instance reads the member, the
// getter binds the method, caches it as an own property of that instance, and
// returns it. Every later read hits the cached copy.
//
// Return the new descriptor; do not mutate the old one.
export function legacyBound<Args extends unknown[], Return>(
  _target: object,
  _propertyKey: string,
  _descriptor: TypedPropertyDescriptor<(...args: Args) => Return>,
): TypedPropertyDescriptor<(...args: Args) => Return> {
  throw new Error("TODO 5: implement legacyBound");
}

/* ── The subjects ──────────────────────────────────────────────────────────
 * Inside factories so a starter that throws during decoration cannot kill test
 * collection (CONVENTIONS rule 2), and so each test gets a fresh class.
 * ----------------------------------------------------------------------- */

export function makeLegacyGreeter() {
  class LegacyGreeter {
    @legacyLogged
    greet(name: string): string {
      return `hi ${name}`;
    }
  }

  return LegacyGreeter;
}

export function makeStandardGreeter() {
  class StandardGreeter {
    greet(name: string): string {
      return `hi ${name}`;
    }
  }

  // No `@` — this directory's `@` is legacy. Same decorator, applied by hand.
  applyStandardMethodDecorator(
    StandardGreeter.prototype,
    "greet",
    StandardGreeter.prototype.greet,
    standardLogged,
  );

  return StandardGreeter;
}

export function makeLegacyCounter() {
  class LegacyCounter {
    count = 0;

    @legacyBound
    inc(): void {
      this.count += 1;
    }

    unbound(): void {
      this.count -= 1;
    }
  }

  return LegacyCounter;
}

export function makeStandardCounter() {
  // Assigned below, called at construction — exactly where the compiler would
  // have put `__runInitializers`.
  let initialize: (instance: StandardCounter) => void = () => {};

  class StandardCounter {
    count = 0;

    constructor() {
      initialize(this);
    }

    inc(): void {
      this.count += 1;
    }

    unbound(): void {
      this.count -= 1;
    }
  }

  initialize = applyStandardMethodDecorator(
    StandardCounter.prototype,
    "inc",
    StandardCounter.prototype.inc,
    standardBound,
  );

  return StandardCounter;
}
