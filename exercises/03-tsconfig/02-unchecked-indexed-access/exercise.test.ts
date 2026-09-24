import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import { at, chunk, sumAll, tally, zip } from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _atReturn = Expect<Equal<ReturnType<typeof at>, string | undefined>>;
type _tallyReturn = Expect<
  Equal<ReturnType<typeof tally>, Record<string, number>>
>;
type _zipReturn = Expect<Equal<ReturnType<typeof zip>, [string, number][]>>;

function _compileTimeOnly(values: readonly string[]): void {
  // The flag in action: element access is possibly undefined.
  const first = values[0];
  type _first = Expect<Equal<typeof first, string | undefined>>;

  // @ts-expect-error — cannot call a method on a possibly-undefined value.
  values[0].toUpperCase();

  // Records behave the same way.
  const counts = tally(values);
  const one = counts["a"];
  type _one = Expect<Equal<typeof one, number | undefined>>;

  // for...of yields the element type directly — no `| undefined`.
  for (const value of values) {
    type _value = Expect<Equal<typeof value, string>>;
    value.toUpperCase();
  }
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("at", () => {
  it("indexes from the front", () => {
    expect(at(["a", "b", "c"], 0)).toBe("a");
    expect(at(["a", "b", "c"], 2)).toBe("c");
  });
  it("indexes from the back with negatives", () => {
    expect(at(["a", "b", "c"], -1)).toBe("c");
    expect(at(["a", "b", "c"], -3)).toBe("a");
  });
  it("returns undefined when out of range", () => {
    expect(at(["a"], 5)).toBeUndefined();
    expect(at(["a"], -5)).toBeUndefined();
    expect(at([], 0)).toBeUndefined();
  });
});

describe("sumAll", () => {
  it("adds everything up", () => {
    expect(sumAll([1, 2, 3])).toBe(6);
    expect(sumAll([-1, 1])).toBe(0);
  });
  it("returns 0 for an empty list", () => {
    expect(sumAll([])).toBe(0);
  });
});

describe("tally", () => {
  it("counts occurrences", () => {
    expect(tally(["a", "b", "a"])).toEqual({ a: 2, b: 1 });
    expect(tally(["x"])).toEqual({ x: 1 });
  });
  it("returns an empty object for no words", () => {
    expect(tally([])).toEqual({});
  });
});

describe("zip", () => {
  it("stops at the shorter array", () => {
    expect(zip(["a", "b"], [1, 2, 3])).toEqual([
      ["a", 1],
      ["b", 2],
    ]);
    expect(zip(["a", "b", "c"], [1])).toEqual([["a", 1]]);
  });
  it("handles empties", () => {
    expect(zip([], [1, 2])).toEqual([]);
    expect(zip(["a"], [])).toEqual([]);
  });
});

describe("chunk", () => {
  it("splits into fixed-size groups", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
    expect(chunk([1, 2, 3], 5)).toEqual([[1, 2, 3]]);
  });
  it("returns no chunks for a non-positive size", () => {
    expect(chunk([1, 2, 3], 0)).toEqual([]);
    expect(chunk([1, 2, 3], -1)).toEqual([]);
  });
  it("handles an empty input", () => {
    expect(chunk([], 2)).toEqual([]);
  });
});
