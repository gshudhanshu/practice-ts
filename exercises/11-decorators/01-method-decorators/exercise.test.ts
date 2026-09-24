import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  log,
  logged,
  makeFlaky,
  makeGreeter,
  makeSquarer,
  makeStopwatch,
  memoized,
  retried,
  timed,
  type StandardMethodDecorator,
} from "./exercise";

/* ── Fixtures ───────────────────────────────────────────────────────────── */

class Receiver {
  readonly tag = "receiver";
}

type Dec = StandardMethodDecorator<Receiver, [number], string>;

/** Clears the shared sink. Cheap enough to inline at the top of each test. */
function reset(): void {
  log.length = 0;
}

/* ── Compile-time spec ──────────────────────────────────────────────────── */

// TODO 1 — the alias describes a two-argument function returning a replacement.
type _decTarget = Expect<
  Equal<Parameters<Dec>[0], (this: Receiver, a: number) => string>
>;
type _decContextKind = Expect<Equal<Parameters<Dec>[1]["kind"], "method">>;
type _decContextName = Expect<
  Equal<Parameters<Dec>[1]["name"], string | symbol>
>;
type _decReturn = Expect<
  Equal<ReturnType<Dec>, (this: Receiver, a: number) => string>
>;

// Decorating must not change the method's type.
type Greeter = InstanceType<ReturnType<typeof makeGreeter>>;
type _greet = Expect<Equal<Greeter["greet"], (times: number) => string>>;
type _who = Expect<Equal<Greeter["who"], string>>;

type Squarer = InstanceType<ReturnType<typeof makeSquarer>>;
type _square = Expect<Equal<Squarer["square"], (n: number) => number>>;

type Flaky = InstanceType<ReturnType<typeof makeFlaky>>;
type _fetch = Expect<Equal<Flaky["fetch"], () => string>>;

function _compileTimeOnly(): void {
  // The real decorators satisfy the alias.
  const _fits: Dec = logged;
  const _fits2: Dec = timed;
  const _fits3: Dec = retried;
  void _fits;
  void _fits2;
  void _fits3;

  // A field decorator has a different context type, so it must not fit.
  // @ts-expect-error — ClassFieldDecoratorContext is not a method context.
  const _misfits: Dec = (
    value: undefined,
    _context: ClassFieldDecoratorContext<Receiver, string>,
  ) => value;
  void _misfits;

  class Wrong {
    // @ts-expect-error — `logged` is a METHOD decorator; a field is not a method.
    @logged
    name = "nope";

    // @ts-expect-error — nor is a getter, which has its own context type.
    @memoized
    get value(): number {
      return 1;
    }
  }
  void Wrong;
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("logged", () => {
  it("records the method name and arguments", () => {
    reset();
    const Greeter = makeGreeter();
    new Greeter("ada").greet(2);

    expect(log).toEqual([{ kind: "call", method: "greet", args: [2] }]);
  });

  it("returns the original result and keeps `this`", () => {
    reset();
    const Greeter = makeGreeter();

    expect(new Greeter("ada").greet(2)).toBe("hi adahi ada");
  });

  it("works on a static method too", () => {
    reset();
    const Greeter = makeGreeter();
    const made = Greeter.of("bob");

    expect(made.who).toBe("bob");
    expect(log).toEqual([{ kind: "call", method: "of", args: ["bob"] }]);
  });

  it("records one entry per call", () => {
    reset();
    const Greeter = makeGreeter();
    const greeter = new Greeter("ada");
    greeter.greet(1);
    greeter.greet(1);

    expect(log).toHaveLength(2);
  });
});

describe("timed", () => {
  it("records a non-negative duration and passes the result through", () => {
    reset();
    const Stopwatch = makeStopwatch();

    expect(new Stopwatch().burn(1000)).toBe(499500);
    expect(log).toHaveLength(1);

    const entry = log[0];
    expect(entry?.kind).toBe("timing");
    if (entry?.kind !== "timing") throw new Error("expected a timing record");
    expect(entry.method).toBe("burn");
    expect(typeof entry.ms).toBe("number");
    expect(entry.ms).toBeGreaterThanOrEqual(0);
  });
});

describe("memoized", () => {
  it("runs the body once per distinct argument", () => {
    const Squarer = makeSquarer();
    const squarer = new Squarer();

    expect(squarer.square(4)).toBe(16);
    expect(squarer.square(4)).toBe(16);
    expect(squarer.calls).toBe(1);

    expect(squarer.square(5)).toBe(25);
    expect(squarer.calls).toBe(2);
  });

  it("caches per instance, not per class", () => {
    const Squarer = makeSquarer();
    const first = new Squarer();
    const second = new Squarer();

    expect(first.square(4)).toBe(16);
    expect(second.square(4)).toBe(16);

    // If the cache were shared, `second` would never have run the body.
    expect(first.calls).toBe(1);
    expect(second.calls).toBe(1);
  });
});

describe("retried", () => {
  it("retries once and records the retry", () => {
    reset();
    const Flaky = makeFlaky();
    const flaky = new Flaky();

    expect(flaky.fetch()).toBe("payload");
    expect(flaky.attempts).toBe(2);
    expect(log).toEqual([{ kind: "retry", method: "fetch" }]);
  });

  it("does not record a retry when the first attempt succeeds", () => {
    reset();
    const Flaky = makeFlaky();
    const flaky = new Flaky();
    flaky.attempts = 1;

    expect(flaky.fetch()).toBe("payload");
    expect(log).toEqual([]);
  });

  it("lets a second failure escape", () => {
    reset();

    class AlwaysBroken {
      attempts = 0;

      @retried
      fetch(): string {
        this.attempts += 1;
        throw new Error("network");
      }
    }

    const broken = new AlwaysBroken();
    expect(() => broken.fetch()).toThrow("network");
    expect(broken.attempts).toBe(2);
  });
});
