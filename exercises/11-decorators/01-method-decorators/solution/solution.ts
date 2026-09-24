/**
 * Solution — 11/01 Method decorators (standard)
 */

export type CallRecord =
  | { kind: "call"; method: string; args: readonly unknown[] }
  | { kind: "timing"; method: string; ms: number }
  | { kind: "retry"; method: string };

export const log: CallRecord[] = [];

// The whole shape in one place. `ClassMethodDecoratorContext<This, Value>`
// wants the METHOD's type as `Value`, which is why the function type appears
// twice — once as the decorator's first parameter, once inside the context.
export type StandardMethodDecorator<This, Args extends unknown[], Return> = (
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<
    This,
    (this: This, ...args: Args) => Return
  >,
) => (this: This, ...args: Args) => Return;

export function logged<This, Args extends unknown[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<
    This,
    (this: This, ...args: Args) => Return
  >,
): (this: This, ...args: Args) => Return {
  // Read `context.name` ONCE, out here. This runs at class-definition time; the
  // returned closure runs on every call, so anything constant belongs here.
  const method = String(context.name);

  // A `function` expression, not an arrow: the replacement is installed on the
  // prototype and must pick up `this` from the call site.
  return function (this: This, ...args: Args): Return {
    log.push({ kind: "call", method, args });
    return target.call(this, ...args);
  };
}

export function timed<This, Args extends unknown[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<
    This,
    (this: This, ...args: Args) => Return
  >,
): (this: This, ...args: Args) => Return {
  const method = String(context.name);

  return function (this: This, ...args: Args): Return {
    const started = performance.now();
    const result = target.call(this, ...args);
    log.push({ kind: "timing", method, ms: performance.now() - started });
    return result;
  };
}

export function memoized<This extends object, Arg, Return>(
  target: (this: This, arg: Arg) => Return,
  _context: ClassMethodDecoratorContext<
    This,
    (this: This, arg: Arg) => Return
  >,
): (this: This, arg: Arg) => Return {
  // This WeakMap is created once for the whole class. Keying it on `this` is
  // what makes the cache per-instance; a bare `Map` here would be shared by
  // every instance of the class, which is a real and common bug.
  //
  // WeakMap rather than Map so a discarded instance can still be collected.
  const caches = new WeakMap<This, Map<Arg, { value: Return }>>();

  return function (this: This, arg: Arg): Return {
    let cache = caches.get(this);
    if (cache === undefined) {
      cache = new Map();
      caches.set(this, cache);
    }

    // The wrapper object distinguishes "cached undefined" from "not cached",
    // which a bare `cache.get(arg) !== undefined` cannot — and it sidesteps
    // `Map.get`'s `| undefined` without needing `!`.
    const hit = cache.get(arg);
    if (hit !== undefined) return hit.value;

    const value = target.call(this, arg);
    cache.set(arg, { value });
    return value;
  };
}

export function retried<This, Args extends unknown[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<
    This,
    (this: This, ...args: Args) => Return
  >,
): (this: This, ...args: Args) => Return {
  const method = String(context.name);

  return function (this: This, ...args: Args): Return {
    try {
      return target.call(this, ...args);
    } catch {
      log.push({ kind: "retry", method });
      // Deliberately not wrapped: a second failure is the caller's problem.
      return target.call(this, ...args);
    }
  };
}

/* ── The subjects ──────────────────────────────────────────────────────────
 * Inside factories so that decoration happens when a test asks for it, not at
 * import time (CONVENTIONS rule 2), and so each test gets a fresh class.
 * ----------------------------------------------------------------------- */

export function makeGreeter() {
  class Greeter {
    constructor(readonly who: string) {}

    @logged
    greet(times: number): string {
      return `hi ${this.who}`.repeat(times);
    }

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

    @retried
    fetch(): string {
      this.attempts += 1;
      if (this.attempts === 1) throw new Error("network");
      return "payload";
    }
  }

  return Flaky;
}
