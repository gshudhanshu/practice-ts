import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import { loaded } from "./registry";
import {
  Codec,
  encode,
  eventName,
  render,
  type Format,
  type TelemetryEvent,
} from "./exercise";

/* ── Fixtures ───────────────────────────────────────────────────────────── */

const event: TelemetryEvent = { name: "click", at: 7 };

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _telemetryEvent = Expect<
  Equal<TelemetryEvent, { name: string; at: number }>
>;
type _format = Expect<Equal<Format, "short" | "long">>;
type _eventName = Expect<Equal<ReturnType<typeof eventName>, string>>;
type _encode = Expect<
  Equal<typeof encode, (event: TelemetryEvent, separator: string) => string>
>;

// `Codec` must come through as a VALUE, so it has a constructor…
type _codecCtor = Expect<
  Equal<ConstructorParameters<typeof Codec>, [separator: string]>
>;

function _compileTimeOnly(): void {
  // …and as a TYPE, so it can annotate. (Never called: with the starter,
  // `Codec` is not exported yet and `new Codec(…)` would die at import time.)
  const codec: Codec = new Codec("-");
  type _codecSeparator = Expect<Equal<typeof codec.separator, string>>;

  // @ts-expect-error — "medium" is not a Format.
  render(event, "medium");

  // @ts-expect-error — TelemetryEvent is a type; it has no runtime value.
  TelemetryEvent;
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("which modules actually loaded", () => {
  it("never evaluates the type-only module", () => {
    expect(loaded).not.toContain("telemetry");
  });

  it("evaluates the side-effect-only module", () => {
    expect(loaded).toContain("audit");
  });

  it("evaluates the modules it takes values from", () => {
    expect(loaded).toContain("formatter");
    expect(loaded).toContain("codec");
  });

  it("loads each module exactly once, and nothing else", () => {
    expect([...loaded].sort()).toEqual(["audit", "codec", "formatter"]);
  });
});

describe("eventName", () => {
  it("reads the name", () => {
    expect(eventName(event)).toBe("click");
    expect(eventName({ name: "scroll", at: 0 })).toBe("scroll");
  });
});

describe("render", () => {
  it("delegates to the imported value", () => {
    expect(render(event, "short")).toBe("click");
    expect(render(event, "long")).toBe("click @ 7");
  });
});

describe("encode", () => {
  it("constructs the imported class", () => {
    expect(encode(event, "|")).toBe("click|7");
    expect(encode(event, "::")).toBe("click::7");
  });
});

describe("re-exports", () => {
  it("forwards Codec as a working value", () => {
    expect(new Codec("-").encode(["a", "b", "c"])).toBe("a-b-c");
    expect(new Codec("").encode([])).toBe("");
  });

  it("forwards a real class, not a shape that happens to match", () => {
    expect(new Codec("-")).toBeInstanceOf(Codec);
    expect(Object.keys(new Codec("-"))).toEqual(["separator"]);
  });
});
