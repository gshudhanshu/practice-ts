import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import { first, identity, pair, partition, totalLength } from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

function _compileTimeOnly(): void {
  declareUsage();

  // TODO 5: no type parameter left — one plain parameter type.
  type _totalLengthParam = Expect<
    Equal<Parameters<typeof totalLength>[0], readonly { length: number }[]>
  >;
  type _totalLengthReturn = Expect<Equal<ReturnType<typeof totalLength>, number>>;
}

function declareUsage(): void {
  const text: string = "a";
  const count: number = 1;

  // TODO 1: the type comes back unchanged, with no explicit type argument.
  const sameString = identity(text);
  type _identityString = Expect<Equal<typeof sameString, string>>;

  const sameNumber = identity(count);
  type _identityNumber = Expect<Equal<typeof sameNumber, number>>;

  // TODO 2: the element type flows through, plus `undefined`.
  const firstString = first([text]);
  type _first = Expect<Equal<typeof firstString, string | undefined>>;

  const firstObject = first([{ id: 1 }]);
  type _firstObject = Expect<
    Equal<typeof firstObject, { id: number } | undefined>
  >;

  // TODO 3: two independent type parameters.
  const tuple = pair(text, count);
  type _pair = Expect<Equal<typeof tuple, [string, number]>>;

  const flipped = pair(count, text);
  type _flipped = Expect<Equal<typeof flipped, [number, string]>>;

  // TODO 4: both halves keep the element type.
  const split = partition([1, 2, 3], (n) => n > 1);
  type _partition = Expect<Equal<typeof split, [number[], number[]]>>;

  // The predicate parameter is inferred — no annotation needed.
  partition(["a", "bb"], (word) => word.length > 1);
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("identity", () => {
  it("returns exactly what it was given", () => {
    expect(identity("a")).toBe("a");
    expect(identity(1)).toBe(1);

    const object = { id: 1 };
    expect(identity(object)).toBe(object); // same reference
  });
});

describe("first", () => {
  it("returns the first element", () => {
    expect(first([1, 2, 3])).toBe(1);
    expect(first(["only"])).toBe("only");
  });

  it("returns undefined for an empty list", () => {
    expect(first([])).toBeUndefined();
  });
});

describe("pair", () => {
  it("builds a two-element tuple", () => {
    expect(pair("a", 1)).toEqual(["a", 1]);
    expect(pair(null, undefined)).toEqual([null, undefined]);
  });
});

describe("partition", () => {
  it("splits matching from non-matching, preserving order", () => {
    expect(partition([1, 2, 3, 4], (n) => n % 2 === 0)).toEqual([
      [2, 4],
      [1, 3],
    ]);
  });

  it("handles all-matching and none-matching", () => {
    expect(partition([1, 2], () => true)).toEqual([[1, 2], []]);
    expect(partition([1, 2], () => false)).toEqual([[], [1, 2]]);
  });

  it("handles an empty list", () => {
    expect(partition([], () => true)).toEqual([[], []]);
  });

  it("does not mutate the input", () => {
    const input = [1, 2, 3];
    partition(input, (n) => n > 1);
    expect(input).toEqual([1, 2, 3]);
  });
});

describe("totalLength", () => {
  it("sums the lengths", () => {
    expect(totalLength(["ab", "c"])).toBe(3);
    expect(totalLength([[1, 2], [3]])).toBe(3);
    expect(totalLength([])).toBe(0);
  });
});
