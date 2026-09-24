import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  LOG_LEVELS,
  formatCoordinate,
  isLogLevel,
  parseCoordinate,
  type Coordinate,
  type LogLevel,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

// Exactly two numbers — not number[].
type _coordinateShape = Expect<Equal<Coordinate, [number, number]>>;

// The runtime array must keep its literal element types AND its order.
type _levelsAreFrozen = Expect<
  Equal<typeof LOG_LEVELS, readonly ["debug", "info", "warn", "error"]>
>;

// The union must be derived, and must be exactly these four members.
type _levelUnion = Expect<
  Equal<LogLevel, "debug" | "info" | "warn" | "error">
>;

// @ts-expect-error — a coordinate has exactly two elements.
const _tooLong: Coordinate = [1, 2, 3];

// @ts-expect-error — and never fewer.
const _tooShort: Coordinate = [1];

// Negative assertions live inside a function that is never called.
// `@ts-expect-error` only silences the compiler — the statement would still
// RUN if it sat at module scope, and `readonly` is erased at runtime.
function _compileTimeOnly(): void {
  // @ts-expect-error — LOG_LEVELS is readonly, push must not compile.
  LOG_LEVELS.push("trace");
}

// isLogLevel must be a type predicate, not a plain boolean check.
function _narrowsToLogLevel(): void {
  const raw: string = "info";
  if (isLogLevel(raw)) {
    type _narrowed = Expect<Equal<typeof raw, LogLevel>>;
  }
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("parseCoordinate", () => {
  it("parses two comma-separated numbers", () => {
    expect(parseCoordinate("12.5,-3.2")).toEqual([12.5, -3.2]);
    expect(parseCoordinate("0,0")).toEqual([0, 0]);
    expect(parseCoordinate("-90,180")).toEqual([-90, 180]);
  });

  it("rejects the wrong number of parts", () => {
    expect(parseCoordinate("1,2,3")).toBeNull();
    expect(parseCoordinate("1")).toBeNull();
    expect(parseCoordinate("")).toBeNull();
  });

  it("rejects non-numeric parts", () => {
    expect(parseCoordinate("a,b")).toBeNull();
    expect(parseCoordinate("12.5,")).toBeNull();
  });

  it("rejects out-of-range values", () => {
    expect(parseCoordinate("91,0")).toBeNull();
    expect(parseCoordinate("-91,0")).toBeNull();
    expect(parseCoordinate("0,181")).toBeNull();
    expect(parseCoordinate("0,-181")).toBeNull();
  });
});

describe("formatCoordinate", () => {
  it("uses exactly four decimal places", () => {
    expect(formatCoordinate([12.5, -3.2])).toBe("12.5000, -3.2000");
    expect(formatCoordinate([0, 0])).toBe("0.0000, 0.0000");
  });
});

describe("isLogLevel", () => {
  it("accepts every declared level", () => {
    for (const level of LOG_LEVELS) {
      expect(isLogLevel(level)).toBe(true);
    }
  });

  it("rejects anything else", () => {
    expect(isLogLevel("trace")).toBe(false);
    expect(isLogLevel("INFO")).toBe(false);
    expect(isLogLevel("")).toBe(false);
  });
});
