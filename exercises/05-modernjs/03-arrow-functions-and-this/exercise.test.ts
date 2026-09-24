import { describe, expect, it, vi } from "vitest";
import { Greeter, Timer, describePerson, makeCounter, once } from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

function _compileTimeOnly(): void {
  // @ts-expect-error — describePerson requires a Person as its `this`.
  describePerson();

  // @ts-expect-error — and the `this` value must actually be a Person.
  describePerson.call({ nope: true });

  // Calling it correctly must compile.
  const ok: string = describePerson.call({ name: "Ada", age: 36 });
  void ok;
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("makeCounter", () => {
  it("counts", () => {
    const counter = makeCounter();
    expect(counter.value()).toBe(0);
    counter.increment();
    counter.increment();
    expect(counter.value()).toBe(2);
  });

  it("gives each counter its own state", () => {
    const a = makeCounter();
    const b = makeCounter();
    a.increment();
    a.increment();
    b.increment();
    expect(a.value()).toBe(2);
    expect(b.value()).toBe(1);
  });

  it("does not expose the count directly", () => {
    const counter = makeCounter();
    counter.increment();
    // Only the two documented methods are reachable.
    expect(Object.keys(counter).sort()).toEqual(["increment", "value"]);
  });
});

describe("Timer", () => {
  it("ticks when called as a method", () => {
    const timer = new Timer();
    timer.tick();
    expect(timer.count).toBe(1);
  });

  it("still ticks when the method is detached", () => {
    const timer = new Timer();
    const detached = timer.tick;
    detached();
    detached();
    expect(timer.count).toBe(2);
  });

  it("survives being passed straight to an array method", () => {
    const timer = new Timer();
    [1, 2, 3].forEach(timer.tick);
    expect(timer.count).toBe(3);
  });

  it("keeps instances independent", () => {
    const a = new Timer();
    const b = new Timer();
    a.tick();
    expect(a.count).toBe(1);
    expect(b.count).toBe(0);
  });
});

describe("Greeter", () => {
  it("greets everyone using the instance greeting", () => {
    expect(new Greeter("Hi").greetAll(["Ada", "Grace"])).toEqual([
      "Hi, Ada",
      "Hi, Grace",
    ]);
  });

  it("handles an empty list", () => {
    expect(new Greeter("Hi").greetAll([])).toEqual([]);
  });
});

describe("describePerson", () => {
  it("reads its `this`", () => {
    expect(describePerson.call({ name: "Ada", age: 36 })).toBe("Ada (36)");
    expect(describePerson.call({ name: "Grace", age: 45 })).toBe("Grace (45)");
  });

  it("works when attached to an object", () => {
    const person = { name: "Alan", age: 41, describe: describePerson };
    expect(person.describe()).toBe("Alan (41)");
  });
});

describe("once", () => {
  it("invokes the wrapped function exactly once", () => {
    const inner = vi.fn(() => 42);
    const wrapped = once(inner);

    expect(wrapped()).toBe(42);
    expect(wrapped()).toBe(42);
    expect(wrapped()).toBe(42);
    expect(inner).toHaveBeenCalledTimes(1);
  });

  it("caches falsy results too", () => {
    const inner = vi.fn(() => 0);
    const wrapped = once(inner);

    expect(wrapped()).toBe(0);
    expect(wrapped()).toBe(0);
    expect(inner).toHaveBeenCalledTimes(1);
  });

  it("keeps separate state per wrapper", () => {
    let seed = 0;
    const next = () => ++seed;
    const a = once(next);
    const b = once(next);

    expect(a()).toBe(1);
    expect(b()).toBe(2);
    expect(a()).toBe(1);
  });
});
