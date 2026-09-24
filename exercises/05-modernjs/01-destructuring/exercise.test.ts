import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  greet,
  headAndRest,
  locationOf,
  swap,
  toCoordinateLabel,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _swapReturn = Expect<Equal<ReturnType<typeof swap>, [number, string]>>;
type _headReturn = Expect<
  Equal<
    ReturnType<typeof headAndRest>,
    { first: string | undefined; rest: string[] }
  >
>;

function _compileTimeOnly(): void {
  // Destructuring a tuple gives exact element types, with no `| undefined`.
  const [first, second] = ["a", 1] as [string, number];
  type _first = Expect<Equal<typeof first, string>>;
  type _second = Expect<Equal<typeof second, number>>;

  // Destructuring an ARRAY does carry `| undefined` (noUncheckedIndexedAccess).
  const words: string[] = ["a", "b"];
  const [head] = words;
  type _head = Expect<Equal<typeof head, string | undefined>>;

  // A default removes `undefined` from the destructured local's type.
  const maybeTitled: { title?: string } = {};
  const { title = "friend" } = maybeTitled;
  type _title = Expect<Equal<typeof title, string>>;
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("greet", () => {
  it("uses the supplied title", () => {
    expect(greet({ name: "Ada", title: "Dr" })).toBe("Hello, Dr Ada");
  });
  it("falls back to 'friend'", () => {
    expect(greet({ name: "Ada" })).toBe("Hello, friend Ada");
  });
});

describe("swap", () => {
  it("flips the pair", () => {
    expect(swap(["a", 1])).toEqual([1, "a"]);
    expect(swap(["", 0])).toEqual([0, ""]);
  });
});

describe("headAndRest", () => {
  it("splits head from tail", () => {
    expect(headAndRest(["a", "b", "c"])).toEqual({
      first: "a",
      rest: ["b", "c"],
    });
  });
  it("handles a single element", () => {
    expect(headAndRest(["only"])).toEqual({ first: "only", rest: [] });
  });
  it("handles an empty list", () => {
    expect(headAndRest([])).toEqual({ first: undefined, rest: [] });
  });
});

describe("toCoordinateLabel", () => {
  it("renames while destructuring", () => {
    expect(toCoordinateLabel({ x: 3, y: 4 })).toBe("lat 4, lon 3");
    expect(toCoordinateLabel({ x: 0, y: 0 })).toBe("lat 0, lon 0");
  });
});

describe("locationOf", () => {
  it("reads both levels when present", () => {
    expect(
      locationOf({ name: "Ada", address: { city: "London", country: "UK" } }),
    ).toBe("London, UK");
  });
  it("defaults each missing level", () => {
    expect(locationOf({ name: "Ada", address: { city: "London" } })).toBe(
      "London, unknown",
    );
    expect(locationOf({ name: "Ada", address: {} })).toBe("unknown, unknown");
    expect(locationOf({ name: "Ada" })).toBe("unknown, unknown");
  });
});
