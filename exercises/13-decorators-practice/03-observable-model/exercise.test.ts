import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  ImportedSettings,
  Settings,
  batch,
  clamp,
  observable,
  snapshot,
  subscribe,
  type Change,
} from "./exercise";

/* ── Fixtures ───────────────────────────────────────────────────────────── */

/** Built lazily: the starter throws inside `subscribe`, and a throw at
 *  describe-scope would kill collection and hide every other failure. */
function watched(): {
  settings: Settings;
  batches: (readonly Change[])[];
  off: () => void;
} {
  const settings = new Settings();
  const batches: (readonly Change[])[] = [];
  const off = subscribe(settings, (changes) => batches.push(changes));
  return { settings, batches, off };
}

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _snapshot = Expect<
  Equal<ReturnType<typeof snapshot>, Record<string, unknown>>
>;
type _subscribe = Expect<Equal<ReturnType<typeof subscribe>, () => void>>;

function _compileTimeOnly(): void {
  const settings = new Settings();

  // `accessor` fields keep an ordinary property type.
  type _theme = Expect<Equal<typeof settings.theme, string>>;
  type _fontSize = Expect<Equal<typeof settings.fontSize, number>>;
  type _createdAt = Expect<Equal<typeof settings.createdAt, string>>;

  // `batch` passes the callback's result straight through.
  const count = batch(settings, () => 42);
  type _count = Expect<Equal<typeof count, number>>;

  const nothing = batch(settings, () => {});
  type _nothing = Expect<Equal<typeof nothing, void>>;

  class _Ok {
    @observable
    @clamp(0, 10)
    accessor score = 5;
  }

  class _WrongValueType {
    // @ts-expect-error — a number rule cannot guard a string accessor.
    @clamp(0, 10)
    accessor label = "";
  }

  class _NotAFactory {
    // @ts-expect-error — `clamp` is a factory: it must be called.
    @clamp
    accessor score = 5;
  }

  class _WrongKind {
    // @ts-expect-error — an accessor decorator cannot decorate a plain field.
    @observable
    score = 5;
  }
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("observable + subscribe", () => {
  it("announces a real change", () => {
    const { settings, batches } = watched();
    settings.theme = "dark";
    expect(batches).toEqual([
      [{ property: "theme", from: "light", to: "dark" }],
    ]);
  });

  it("stays silent when the value does not change", () => {
    const { settings, batches } = watched();
    settings.theme = "light";
    settings.theme = "light";
    expect(batches).toEqual([]);
  });

  it("announces each change separately outside a batch", () => {
    const { settings, batches } = watched();
    settings.theme = "dark";
    settings.fontSize = 16;
    expect(batches).toHaveLength(2);
  });

  it("still reads back the value", () => {
    const { settings } = watched();
    settings.theme = "dark";
    expect(settings.theme).toBe("dark");
  });

  it("compares with Object.is, so NaN is not a change", () => {
    const { settings, batches } = watched();
    settings.fontSize = Number.NaN;
    settings.fontSize = Number.NaN;
    expect(batches).toHaveLength(1);
  });

  it("keeps models independent", () => {
    const a = watched();
    const b = watched();
    a.settings.theme = "dark";
    expect(a.batches).toHaveLength(1);
    expect(b.batches).toEqual([]);
  });

  it("stops after unsubscribing, and unsubscribing twice is harmless", () => {
    const { settings, batches, off } = watched();
    off();
    off();
    settings.theme = "dark";
    expect(batches).toEqual([]);
  });

  it("supports several listeners", () => {
    const settings = new Settings();
    const seen: string[] = [];
    subscribe(settings, () => seen.push("a"));
    subscribe(settings, () => seen.push("b"));
    settings.theme = "dark";
    expect(seen).toEqual(["a", "b"]);
  });
});

describe("snapshot", () => {
  it("lists every observable property, in declaration order", () => {
    const settings = new Settings();
    expect(snapshot(settings)).toEqual({
      theme: "light",
      fontSize: 14,
      volume: 50,
    });
    expect(Object.keys(snapshot(settings))).toEqual([
      "theme",
      "fontSize",
      "volume",
    ]);
  });

  it("skips undecorated accessors and plain fields", () => {
    const keys = Object.keys(snapshot(new Settings()));
    expect(keys).not.toContain("sessionId");
    expect(keys).not.toContain("createdAt");
  });

  it("follows later mutations", () => {
    const settings = new Settings();
    settings.theme = "dark";
    settings.fontSize = 20;
    expect(snapshot(settings)).toEqual({
      theme: "dark",
      fontSize: 20,
      volume: 50,
    });
  });

  it("returns a fresh object each time", () => {
    const settings = new Settings();
    expect(snapshot(settings)).not.toBe(snapshot(settings));
  });

  it("is empty for an object with no observables", () => {
    expect(snapshot({})).toEqual({});
  });
});

describe("clamp", () => {
  it("clamps on assignment, at both ends", () => {
    const { settings } = watched();
    settings.volume = 150;
    expect(settings.volume).toBe(100);
    settings.volume = -20;
    expect(settings.volume).toBe(0);
    settings.volume = 30;
    expect(settings.volume).toBe(30);
  });

  it("clamps the initial value too", () => {
    expect(new ImportedSettings().volume).toBe(100);
  });

  it("announces the stored value, not the value that was passed in", () => {
    const { settings, batches } = watched();
    settings.volume = 150;
    expect(batches).toEqual([
      [{ property: "volume", from: 50, to: 100 }],
    ]);
  });

  it("stays silent when clamping lands on the current value", () => {
    const { settings, batches } = watched();
    settings.volume = 150;
    settings.volume = 200;
    expect(batches).toHaveLength(1);
  });
});

describe("batch", () => {
  it("coalesces into one notification", () => {
    const { settings, batches } = watched();
    batch(settings, () => {
      settings.theme = "dark";
      settings.fontSize = 16;
    });
    expect(batches).toEqual([
      [
        { property: "theme", from: "light", to: "dark" },
        { property: "fontSize", from: 14, to: 16 },
      ],
    ]);
  });

  it("keeps the earliest `from` and the latest `to` per property", () => {
    const { settings, batches } = watched();
    batch(settings, () => {
      settings.fontSize = 16;
      settings.fontSize = 18;
      settings.fontSize = 20;
    });
    expect(batches).toEqual([
      [{ property: "fontSize", from: 14, to: 20 }],
    ]);
  });

  it("orders by when a property first changed", () => {
    const { settings, batches } = watched();
    batch(settings, () => {
      settings.fontSize = 16;
      settings.theme = "dark";
      settings.fontSize = 18;
    });
    expect(batches[0]?.map((c) => c.property)).toEqual(["fontSize", "theme"]);
  });

  it("drops a property that ends where it started", () => {
    const { settings, batches } = watched();
    batch(settings, () => {
      settings.theme = "dark";
      settings.theme = "light";
      settings.fontSize = 16;
    });
    expect(batches).toEqual([
      [{ property: "fontSize", from: 14, to: 16 }],
    ]);
  });

  it("sends nothing at all when nothing survives", () => {
    const { settings, batches } = watched();
    batch(settings, () => {
      settings.theme = "dark";
      settings.theme = "light";
    });
    expect(batches).toEqual([]);
  });

  it("sends nothing for an empty batch", () => {
    const { settings, batches } = watched();
    batch(settings, () => {});
    expect(batches).toEqual([]);
  });

  it("only the outermost batch flushes", () => {
    const { settings, batches } = watched();
    batch(settings, () => {
      settings.theme = "dark";
      batch(settings, () => {
        settings.fontSize = 16;
      });
      expect(batches).toEqual([]);
    });
    expect(batches).toHaveLength(1);
    expect(batches[0]).toHaveLength(2);
  });

  it("returns whatever the callback returned", () => {
    const { settings } = watched();
    expect(batch(settings, () => 42)).toBe(42);
    expect(batch(settings, () => "done")).toBe("done");
  });

  it("flushes and reopens correctly when the callback throws", () => {
    const { settings, batches } = watched();

    expect(() =>
      batch(settings, () => {
        settings.theme = "dark";
        throw new Error("boom");
      }),
    ).toThrow("boom");

    expect(batches).toEqual([
      [{ property: "theme", from: "light", to: "dark" }],
    ]);

    // The batch must not still be open.
    settings.fontSize = 16;
    expect(batches).toHaveLength(2);
  });

  it("notifies once per batch, not once per listener call", () => {
    const { settings, batches } = watched();
    batch(settings, () => {
      settings.volume = 150;
      settings.volume = 10;
    });
    expect(batches).toEqual([[{ property: "volume", from: 50, to: 10 }]]);
  });
});
