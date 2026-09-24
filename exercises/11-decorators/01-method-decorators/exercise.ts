/**
 * Exercise 11/01 — Method decorators (standard, TC39 Stage 3)
 *
 * A standard decorator is just a function the runtime calls while the class is
 * being defined. For a method it receives exactly two arguments:
 *
 *   (target, context) => replacement | void
 *
 *   target   the method itself, BEFORE it is installed on the prototype
 *   context  a ClassMethodDecoratorContext — .kind, .name, .static, .private,
 *            .access and .addInitializer
 *
 * Return a function and it REPLACES the method. Return nothing and the method
 * is left alone (you decorated it for a side effect).
 *
 * Two things trip everyone up and both are tested here:
 *
 *   1. The replacement is created ONCE PER CLASS, not per instance. Anything you
 *      close over is shared by every instance, so per-instance state has to be
 *      keyed on `this` (TODO 4).
 *   2. You must forward `this`. Use a `function` expression and `target.call`,
 *      never an arrow, or the method loses its receiver.
 *
 * This is the modern flavour, enabled by default — no `experimentalDecorators`
 * anywhere in this section. Section 12 covers the legacy one.
 *
 * Read README.md first. Replace every TODO.
 */

/** Everything the decorators in this file record. */
export type CallRecord =
  | { kind: "call"; method: string; args: readonly unknown[] }
  | { kind: "timing"; method: string; ms: number }
  | { kind: "retry"; method: string };

/** The shared sink. The tests read it; they never spy on the console. */
export const log: CallRecord[] = [];

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Name the shape every method decorator in this file has, so you only write it
// once. Three type parameters: the receiver, the argument tuple, the result.
//
//   Parameters<StandardMethodDecorator<C, [number], string>>[0]
//     ->  (this: C, a: number) => string
//   Parameters<StandardMethodDecorator<C, [number], string>>[1]["kind"]
//     ->  "method"
//   ReturnType<StandardMethodDecorator<C, [number], string>>
//     ->  (this: C, a: number) => string
//
// `ClassMethodDecoratorContext<This, Value>` is built in — `Value` is the
// method's own type, so pass the same function type twice.
export type StandardMethodDecorator<
  This,
  Args extends unknown[],
  Return,
> = unknown;

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// Record the call, then run the original method unchanged.
//
//   greeter.greet(2)  ->  pushes { kind: "call", method: "greet", args: [2] }
//                         and still returns "hi adahi ada"
//
// `context.name` is a `string | symbol`, so stringify it. The recorded `args`
// must be the real arguments, in order.
export function logged<This, Args extends unknown[], Return>(
  _target: (this: This, ...args: Args) => Return,
  _context: ClassMethodDecoratorContext<
    This,
    (this: This, ...args: Args) => Return
  >,
): (this: This, ...args: Args) => Return {
  throw new Error("TODO 2: implement logged");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Time the call and record how long it took, then return the result untouched.
//
//   stopwatch.burn(1000)  ->  pushes { kind: "timing", method: "burn", ms: … }
//
// Use `performance.now()` on both sides of the call. `ms` must be a number that
// is not negative — the tests do not care how large it is.
export function timed<This, Args extends unknown[], Return>(
  _target: (this: This, ...args: Args) => Return,
  _context: ClassMethodDecoratorContext<
    This,
    (this: This, ...args: Args) => Return
  >,
): (this: This, ...args: Args) => Return {
  throw new Error("TODO 3: implement timed");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Cache the result per argument — and PER INSTANCE.
//
//   const s = new Squarer();
//   s.square(4); s.square(4);   ->  the body runs once,  s.calls === 1
//   new Squarer().square(4);    ->  the body runs again, that one's calls === 1
//
// Remember: your replacement function is built once for the whole class, so a
// plain `const cache = new Map()` here would be shared by every instance and
// the second assertion above would fail. Key the cache on `this`.
//
// `Map.get` returns `Return | undefined` and `!` is banned, so store a wrapper
// object (`{ value }`) rather than the bare result — otherwise a method that
// legitimately returns `undefined` is indistinguishable from a cache miss.
export function memoized<This extends object, Arg, Return>(
  _target: (this: This, arg: Arg) => Return,
  _context: ClassMethodDecoratorContext<
    This,
    (this: This, arg: Arg) => Return
  >,
): (this: This, arg: Arg) => Return {
  throw new Error("TODO 4: implement memoized");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// Run the method again — exactly once — if it throws.
//
//   flaky.fetch()  ->  first attempt throws, second succeeds, returns "payload"
//                      and pushes { kind: "retry", method: "fetch" }
//
// If the second attempt throws too, let that error escape.
// Then apply it: `makeFlaky` below has a TODO for the decorator itself.
export function retried<This, Args extends unknown[], Return>(
  _target: (this: This, ...args: Args) => Return,
  _context: ClassMethodDecoratorContext<
    This,
    (this: This, ...args: Args) => Return
  >,
): (this: This, ...args: Args) => Return {
  throw new Error("TODO 5: implement retried");
}

/* ── The subjects ──────────────────────────────────────────────────────────
 *
 * Each class lives inside a factory rather than at module scope, on purpose: a
 * decorator runs while the class is being DEFINED, so a starter that throws at
 * module scope would kill test collection and hide every other failure
 * (CONVENTIONS rule 2). Building the class inside a function defers that until
 * a test asks for it. It also hands every test a brand-new class, so nothing
 * one test caches can leak into the next.
 * ----------------------------------------------------------------------- */

export function makeGreeter() {
  class Greeter {
    constructor(readonly who: string) {}

    @logged
    greet(times: number): string {
      return `hi ${this.who}`.repeat(times);
    }

    // Statics decorate exactly the same way; `this` is the class, not an
    // instance.
    @logged
    static of(who: string): Greeter {
      return new Greeter(who);
    }
  }

  return Greeter;
}

export function makeStopwatch() {
  class Stopwatch {
    @timed
    burn(rounds: number): number {
      let total = 0;
      for (let i = 0; i < rounds; i += 1) total += i;
      return total;
    }
  }

  return Stopwatch;
}

export function makeSquarer() {
  class Squarer {
    calls = 0;

    @memoized
    square(n: number): number {
      this.calls += 1;
      return n * n;
    }
  }

  return Squarer;
}

export function makeFlaky() {
  class Flaky {
    attempts = 0;

    // TODO 5 (part two): decorate this method so the first failure is retried.
    fetch(): string {
      this.attempts += 1;
      if (this.attempts === 1) throw new Error("network");
      return "payload";
    }
  }

  return Flaky;
}
