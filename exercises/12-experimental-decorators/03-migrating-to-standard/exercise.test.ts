import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  applyStandardMethodDecorator,
  legacyBound,
  legacyLogged,
  log,
  makeLegacyCounter,
  makeLegacyGreeter,
  makeStandardCounter,
  makeStandardGreeter,
  standardBound,
  standardLogged,
  type LogEntry,
  type StandardMethodDecorator,
} from "./exercise";

/* ── Fixtures ───────────────────────────────────────────────────────────── */

class Subject {
  greet(name: string): string {
    return `hi ${name}`;
  }
}

type Dec = StandardMethodDecorator<Subject, [string], string>;

function reset(): void {
  log.length = 0;
}

/** The same call, made through each flavour, with the tag stripped. */
function withoutFlavour(entries: readonly LogEntry[]): unknown[] {
  return entries.map(({ method, args }) => ({ method, args }));
}

/* ── Compile-time spec ──────────────────────────────────────────────────── */

// Legacy takes three arguments; standard takes two.
type _legacyArity = Expect<Equal<Parameters<typeof legacyLogged>["length"], 3>>;
type _standardArity = Expect<
  Equal<Parameters<typeof standardLogged>["length"], 2>
>;

// The standard one is handed the method; the legacy one is handed a descriptor.
type _standardTarget = Expect<
  Equal<Parameters<Dec>[0], (this: Subject, name: string) => string>
>;
type _standardKind = Expect<Equal<Parameters<Dec>[1]["kind"], "method">>;

// Legacy `@bound` returns a descriptor; standard `@bound` returns nothing.
type _legacyBoundReturn = Expect<
  Equal<
    ReturnType<typeof legacyBound<[], void>>,
    TypedPropertyDescriptor<() => void>
  >
>;
type _standardBoundReturn = Expect<
  Equal<ReturnType<typeof standardBound<Subject, [], void>>, void>
>;

// The mini-runtime hands back an initializer for one instance.
type Applied = ReturnType<
  typeof applyStandardMethodDecorator<"greet", [string], string, Subject>
>;
type _applied = Expect<Equal<Applied, (instance: Subject) => void>>;

// Neither flavour changes the decorated method's type.
type LegacyGreeter = InstanceType<ReturnType<typeof makeLegacyGreeter>>;
type StandardGreeter = InstanceType<ReturnType<typeof makeStandardGreeter>>;
type _legacyGreet = Expect<
  Equal<LegacyGreeter["greet"], (name: string) => string>
>;
type _standardGreet = Expect<
  Equal<StandardGreeter["greet"], (name: string) => string>
>;

function _compileTimeOnly(): void {
  class Wrong {
    // @ts-expect-error — a standard decorator's two-argument shape does not fit
    // a legacy `@`, which supplies (target, key, descriptor).
    @standardLogged
    greet(): string {
      return "x";
    }
  }
  void Wrong;
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("legacyLogged", () => {
  it("records the call and returns the result", () => {
    reset();
    const LegacyGreeter = makeLegacyGreeter();

    expect(new LegacyGreeter().greet("ada")).toBe("hi ada");
    expect(log).toEqual([
      { flavour: "legacy", method: "greet", args: ["ada"] },
    ]);
  });
});

describe("standardLogged, applied by hand", () => {
  it("records the call and returns the result", () => {
    reset();
    const StandardGreeter = makeStandardGreeter();

    expect(new StandardGreeter().greet("ada")).toBe("hi ada");
    expect(log).toEqual([
      { flavour: "standard", method: "greet", args: ["ada"] },
    ]);
  });

  it("installs the replacement non-enumerably, like a real method", () => {
    reset();
    const StandardGreeter = makeStandardGreeter();

    expect(Object.keys(StandardGreeter.prototype)).toEqual([]);
    expect(Object.hasOwn(StandardGreeter.prototype, "greet")).toBe(true);
  });
});

describe("the two flavours are equivalent", () => {
  it("produces identical records for the same call", () => {
    reset();
    const LegacyGreeter = makeLegacyGreeter();
    new LegacyGreeter().greet("ada");
    const legacyEntries = withoutFlavour(log);

    reset();
    const StandardGreeter = makeStandardGreeter();
    new StandardGreeter().greet("ada");
    const standardEntries = withoutFlavour(log);

    expect(standardEntries).toEqual(legacyEntries);
    expect(standardEntries).toEqual([{ method: "greet", args: ["ada"] }]);
  });
});

describe("applyStandardMethodDecorator", () => {
  it("builds a context describing the member", () => {
    const seen: ClassMethodDecoratorContext<Subject, (name: string) => string>[] =
      [];

    applyStandardMethodDecorator(
      Subject.prototype,
      "greet",
      Subject.prototype.greet,
      (target, context) => {
        seen.push(context);
        return target;
      },
    );

    const context = seen[0];
    expect(context?.kind).toBe("method");
    expect(context?.name).toBe("greet");
    expect(context?.static).toBe(false);
    expect(context?.private).toBe(false);
    expect(typeof context?.metadata).toBe("object");
  });

  it("gives access.has and access.get that work on an instance", () => {
    const probes: {
      has: (o: Subject) => boolean;
      get: (o: Subject) => unknown;
    }[] = [];

    applyStandardMethodDecorator(
      Subject.prototype,
      "greet",
      Subject.prototype.greet,
      (target, context) => {
        probes.push(context.access);
        return target;
      },
    );

    const probe = probes[0];
    const subject = new Subject();
    expect(probe?.has(subject)).toBe(true);
    expect(typeof probe?.get(subject)).toBe("function");
  });

  it("leaves the method alone when the decorator returns nothing", () => {
    class Untouched {
      value(): number {
        return 1;
      }
    }
    const before = Untouched.prototype.value;

    applyStandardMethodDecorator(
      Untouched.prototype,
      "value",
      Untouched.prototype.value,
      () => undefined,
    );

    expect(Untouched.prototype.value).toBe(before);
  });

  it("runs collected initializers against the instance", () => {
    const seenThis: unknown[] = [];

    class Host {
      tag = "host";
      run(): void {}
    }

    const initialize = applyStandardMethodDecorator(
      Host.prototype,
      "run",
      Host.prototype.run,
      (_target, context) => {
        context.addInitializer(function (this: Host): void {
          seenThis.push(this.tag);
        });
      },
    );

    const host = new Host();
    initialize(host);

    expect(seenThis).toEqual(["host"]);
  });

  it("refuses an initializer added after decoration finished", () => {
    let escaped: ((fn: () => void) => void) | undefined;

    class Host {
      run(): void {}
    }

    applyStandardMethodDecorator(
      Host.prototype,
      "run",
      Host.prototype.run,
      (_target, context) => {
        escaped = (fn): void => {
          context.addInitializer(fn);
        };
      },
    );

    expect(() => escaped?.(() => {})).toThrow(TypeError);
  });
});

describe("standardBound", () => {
  it("survives being detached", () => {
    const StandardCounter = makeStandardCounter();
    const counter = new StandardCounter();
    const inc = counter.inc;

    inc();
    inc();

    expect(counter.count).toBe(2);
  });

  it("binds per instance", () => {
    const StandardCounter = makeStandardCounter();
    const first = new StandardCounter();
    const second = new StandardCounter();
    const incFirst = first.inc;
    incFirst();

    expect(first.count).toBe(1);
    expect(second.count).toBe(0);
  });

  it("leaves undecorated methods unbound", () => {
    const StandardCounter = makeStandardCounter();
    const unbound = new StandardCounter().unbound;

    expect(() => unbound()).toThrow(TypeError);
  });
});

describe("legacyBound", () => {
  it("survives being detached", () => {
    const LegacyCounter = makeLegacyCounter();
    const counter = new LegacyCounter();
    const inc = counter.inc;

    inc();
    inc();

    expect(counter.count).toBe(2);
  });

  it("caches the bound copy on the instance after the first read", () => {
    const LegacyCounter = makeLegacyCounter();
    const counter = new LegacyCounter();

    expect(Object.hasOwn(counter, "inc")).toBe(false);
    void counter.inc;
    expect(Object.hasOwn(counter, "inc")).toBe(true);
    expect(counter.inc).toBe(counter.inc);
  });

  it("binds per instance", () => {
    const LegacyCounter = makeLegacyCounter();
    const first = new LegacyCounter();
    const second = new LegacyCounter();
    const incFirst = first.inc;
    incFirst();

    expect(first.count).toBe(1);
    expect(second.count).toBe(0);
  });

  it("leaves undecorated methods unbound", () => {
    const LegacyCounter = makeLegacyCounter();
    const unbound = new LegacyCounter().unbound;

    expect(() => unbound()).toThrow(TypeError);
  });
});

describe("the two @bound implementations agree", () => {
  it("both detach safely and both leave `unbound` broken", () => {
    const LegacyCounter = makeLegacyCounter();
    const StandardCounter = makeStandardCounter();

    const legacy = new LegacyCounter();
    const standard = new StandardCounter();
    const legacyInc = legacy.inc;
    const standardInc = standard.inc;

    legacyInc();
    standardInc();

    expect(legacy.count).toBe(standard.count);
    expect(() => new LegacyCounter().unbound()).not.toThrow();
    expect(() => new StandardCounter().unbound()).not.toThrow();
  });
});
