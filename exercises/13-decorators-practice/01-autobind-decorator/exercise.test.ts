import { beforeEach, describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  Toolbar,
  autobind,
  callLog,
  deprecate,
  logCalls,
  once,
  warnings,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

function _compileTimeOnly(): void {
  const toolbar = new Toolbar("report");

  // Decorators must not change the public shape of the class.
  const save = toolbar.save;
  type _save = Expect<Equal<typeof save, () => string>>;

  const ticket = toolbar.ticket;
  type _ticket = Expect<Equal<typeof ticket, () => number>>;

  type _title = Expect<Equal<typeof toolbar.title, string>>;

  class _Wrong {
    // @ts-expect-error — a method decorator cannot decorate a field.
    @logCalls
    label = "x";
  }

  class _AlsoWrong {
    // @ts-expect-error — `deprecate` is a factory: it must be called.
    @deprecate
    go(): void {}
  }

  // @ts-expect-error — `autobind` is a method decorator, not a class one.
  @autobind
  class _NotAClassDecorator {}

  class _Memo {
    // `once` needs an object `this`, which every class instance is.
    @once
    value(): number {
      return 1;
    }
  }
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

beforeEach(() => {
  callLog.length = 0;
  warnings.length = 0;
});

describe("logCalls", () => {
  it("records the method name and still returns the result", () => {
    const toolbar = new Toolbar("report");
    expect(toolbar.reset()).toBe("reset: report");
    expect(callLog).toEqual(["reset"]);
  });

  it("records one entry per call, in order", () => {
    const toolbar = new Toolbar("report");
    toolbar.reset();
    toolbar.save();
    toolbar.reset();
    expect(callLog).toEqual(["reset", "save", "reset"]);
  });

  it("does not log at construction time", () => {
    new Toolbar("report");
    expect(callLog).toEqual([]);
  });
});

describe("autobind", () => {
  it("keeps `this` when the method is detached", () => {
    const toolbar = new Toolbar("report");
    const detached = toolbar.save;
    expect(detached()).toBe("saved: report");
  });

  it("leaves an undecorated method detachable-and-broken", () => {
    const toolbar = new Toolbar("report");
    const detached = toolbar.reset;
    expect(() => detached()).toThrow();
  });

  it("installs an own property, not a prototype one", () => {
    const toolbar = new Toolbar("report");
    expect(Object.hasOwn(toolbar, "save")).toBe(true);
    expect(Object.hasOwn(toolbar, "reset")).toBe(false);
  });

  it("does not make the bound copy enumerable", () => {
    const toolbar = new Toolbar("report");
    expect(Object.keys(toolbar)).not.toContain("save");
  });

  it("binds per instance", () => {
    const a = new Toolbar("a").save;
    const b = new Toolbar("b").save;
    expect(a()).toBe("saved: a");
    expect(b()).toBe("saved: b");
  });

  it("binds the logging wrapper, so a detached call still logs", () => {
    const detached = new Toolbar("report").save;
    detached();
    expect(callLog).toEqual(["save"]);
  });
});

describe("once", () => {
  it("runs the body only the first time", () => {
    const toolbar = new Toolbar("report");
    expect(toolbar.ticket()).toBe(1);
    expect(toolbar.ticket()).toBe(1);
    expect(toolbar.ticket()).toBe(1);
  });

  it("caches per instance", () => {
    expect(new Toolbar("a").ticket()).toBe(1);
    expect(new Toolbar("b").ticket()).toBe(1);
  });
});

// The deprecation flag belongs to the METHOD, so it is spent by the first call
// in the whole file. These two run in declaration order, and the second one
// re-clears `warnings` so it holds either way.
describe("deprecate", () => {
  it("warns on the first call, naming the method and the reason", () => {
    const toolbar = new Toolbar("report");
    expect(toolbar.store()).toBe("stored: report");
    expect(warnings).toEqual(["store is deprecated: use save() instead"]);
  });

  it("stays quiet afterwards, even on a different instance", () => {
    expect(new Toolbar("a").store()).toBe("stored: a");
    warnings.length = 0;

    new Toolbar("b").store();
    new Toolbar("c").store();
    expect(warnings).toEqual([]);
  });
});
