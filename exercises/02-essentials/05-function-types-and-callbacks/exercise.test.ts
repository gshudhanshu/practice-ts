import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  applyAll,
  fail,
  forEachIndexed,
  getOrFail,
  slugify,
  type Transformer,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _transformer = Expect<Equal<Transformer, (value: number) => number>>;

// `fail` must be typed as never-returning.
type _failNever = Expect<Equal<ReturnType<typeof fail>, never>>;

// `separator` must be optional, so a one-argument call has to compile.
function _separatorIsOptional(): void {
  const _oneArg: string = slugify("Hello World");
  const _twoArgs: string = slugify("Hello World", "_");
}

function _compileTimeOnly(): void {
  // A `void`-returning callback parameter must still accept a function that
  // returns a value. This is the "void return" rule.
  const collected: number[] = [];
  forEachIndexed(["a", "b"], (_item, index) => collected.push(index));

  // @ts-expect-error — a transformer returns a number, not a string.
  const _bad: Transformer = (value: number) => String(value);

  // @ts-expect-error — applyAll only accepts transformers.
  applyAll([1], (value: string) => value);
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

const double: Transformer = (value) => value * 2;
const increment: Transformer = (value) => value + 1;

describe("applyAll", () => {
  it("applies transformers left to right", () => {
    expect(applyAll([1, 2], double, increment)).toEqual([3, 5]);
    expect(applyAll([1, 2], increment, double)).toEqual([4, 6]);
  });

  it("returns the values unchanged when given no transformers", () => {
    expect(applyAll([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it("handles an empty input", () => {
    expect(applyAll([], double)).toEqual([]);
  });
});

describe("slugify", () => {
  it("lowercases, trims and joins words with a hyphen", () => {
    expect(slugify("  Hello   World!  ")).toBe("hello-world");
    expect(slugify("Rock & Roll -- Vol. 2")).toBe("rock-roll-vol-2");
  });

  it("honours a custom separator", () => {
    expect(slugify("Hello World", "_")).toBe("hello_world");
  });

  it("never leaves leading or trailing separators", () => {
    expect(slugify("!!!Hello!!!")).toBe("hello");
    expect(slugify("---")).toBe("");
  });

  it("keeps digits", () => {
    expect(slugify("Top 10 Songs")).toBe("top-10-songs");
  });
});

describe("forEachIndexed", () => {
  it("visits every item with its index", () => {
    const seen: string[] = [];
    forEachIndexed(["a", "b", "c"], (item, index) => {
      seen.push(`${index}:${item}`);
      return item;
    });
    expect(seen).toEqual(["0:a", "1:b", "2:c"]);
  });

  it("does nothing for an empty list", () => {
    let calls = 0;
    forEachIndexed([], () => {
      calls++;
      return "";
    });
    expect(calls).toBe(0);
  });
});

describe("fail / getOrFail", () => {
  it("fail always throws", () => {
    expect(() => fail("boom")).toThrowError("boom");
  });

  it("getOrFail returns a present value", () => {
    expect(getOrFail("hello")).toBe("hello");
  });

  it("getOrFail throws on null", () => {
    expect(() => getOrFail(null)).toThrow();
  });
});
