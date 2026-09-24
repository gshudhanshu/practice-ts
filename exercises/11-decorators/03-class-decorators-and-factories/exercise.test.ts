import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  makeConnection,
  makePool,
  makeService,
  makeSettings,
  registry,
  sealed,
  singleton,
  trail,
  type AnyClass,
  type StandardClassDecorator,
} from "./exercise";

/* ── Fixtures ───────────────────────────────────────────────────────────── */

class Host {
  static readonly kind = "host";
}

type HostDecorator = StandardClassDecorator<typeof Host>;

function reset(): void {
  registry.clear();
  trail.length = 0;
}

/* ── Compile-time spec ──────────────────────────────────────────────────── */

// TODO 1 — the class-decorator shape.
type _classTarget = Expect<Equal<Parameters<HostDecorator>[0], typeof Host>>;
type _classKind = Expect<Equal<Parameters<HostDecorator>[1]["kind"], "class">>;
type _classReturn = Expect<
  Equal<ReturnType<HostDecorator>, typeof Host | void>
>;

// Decorating does not change the class's public type — `singleton` returns a
// replacement and the declared shape is still the one you wrote.
type Pool = InstanceType<ReturnType<typeof makePool>>;
type _size = Expect<Equal<Pool["size"], number>>;

type Connection = InstanceType<ReturnType<typeof makeConnection>>;
type _host = Expect<Equal<Connection["host"], string>>;

type Service = InstanceType<ReturnType<typeof makeService>>;
type _run = Expect<Equal<Service["run"], () => string>>;

function _compileTimeOnly(): void {
  const _sealedFits: HostDecorator = sealed;
  const _singletonFits: HostDecorator = singleton;
  void _sealedFits;
  void _singletonFits;

  class Wrong {
    // @ts-expect-error — `sealed` is a CLASS decorator; a method is not a class.
    @sealed
    run(): void {}

    // @ts-expect-error — nor is a field.
    @singleton
    name = "nope";
  }
  void Wrong;

  // The registry is keyed by string and holds classes, not instances.
  const stored: AnyClass | undefined = registry.get("connection");
  void stored;
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("sealed", () => {
  it("seals the constructor", () => {
    const Settings = makeSettings();

    expect(Object.isSealed(Settings)).toBe(true);
  });

  it("seals the prototype", () => {
    const Settings = makeSettings();

    expect(Object.isSealed(Settings.prototype)).toBe(true);
    expect(() => {
      Object.defineProperty(Settings.prototype, "added", { value: 1 });
    }).toThrow(TypeError);
  });

  it("does not seal instances", () => {
    const Settings = makeSettings();
    const settings = new Settings();
    settings.theme = "light";

    expect(settings.theme).toBe("light");
    expect(Object.isSealed(settings)).toBe(false);
  });
});

describe("registerAs", () => {
  it("files the class under the given id", () => {
    reset();
    const Connection = makeConnection();

    expect(registry.get("connection")).toBe(Connection);
  });

  it("registers the class itself, not an instance", () => {
    reset();
    const Connection = makeConnection();
    const stored = registry.get("connection");

    expect(typeof stored).toBe("function");
    expect(new Connection("db").host).toBe("db");
  });

  it("leaves the class usable", () => {
    reset();
    const Connection = makeConnection();

    expect(new Connection("localhost").host).toBe("localhost");
  });
});

describe("singleton", () => {
  it("returns the same instance every time", () => {
    const Pool = makePool();
    const first = new Pool(10);
    const second = new Pool(20);

    expect(second).toBe(first);
    expect(second.size).toBe(10);
  });

  it("keeps instanceof working", () => {
    const Pool = makePool();

    expect(new Pool(1)).toBeInstanceOf(Pool);
  });

  it("is per class, so a fresh class gets a fresh instance", () => {
    const first = new (makePool())(1);
    const second = new (makePool())(2);

    expect(second).not.toBe(first);
    expect(second.size).toBe(2);
  });
});

describe("trace — evaluation vs application order", () => {
  it("evaluates factories top-down, then applies decorators bottom-up", () => {
    reset();
    makeService();

    expect(trail).toEqual([
      // Both decorator EXPRESSIONS are evaluated first, in source order.
      "eval:outer",
      "eval:inner",
      // Then the decorators are APPLIED, closest to the class first.
      "apply:inner",
      "apply:outer",
      // Then the initializers run, in the order they were registered.
      "ready:inner:Service",
      "ready:outer:Service",
    ]);
  });

  it("evaluates the factory once per class definition", () => {
    reset();
    makeService();
    makeService();

    expect(trail.filter((entry) => entry === "eval:outer")).toHaveLength(2);
  });
});
