import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  range,
  type Add,
  type BuildTuple,
  type Enumerate,
  type GreaterThan,
  type Range,
  type Subtract,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _build3 = Expect<Equal<BuildTuple<3>, [unknown, unknown, unknown]>>;
type _build0 = Expect<Equal<BuildTuple<0>, []>>;
type _buildFill = Expect<Equal<BuildTuple<2, string>, [string, string]>>;
type _buildLength = Expect<Equal<BuildTuple<7>["length"], 7>>;

type _add = Expect<Equal<Add<2, 3>, 5>>;
type _addZero = Expect<Equal<Add<0, 0>, 0>>;
type _addIdentity = Expect<Equal<Add<9, 0>, 9>>;
type _addBig = Expect<Equal<Add<64, 36>, 100>>;
type _addNested = Expect<Equal<Add<Add<1, 2>, 3>, 6>>;

type _sub = Expect<Equal<Subtract<5, 2>, 3>>;
type _subZero = Expect<Equal<Subtract<3, 3>, 0>>;
type _subIdentity = Expect<Equal<Subtract<7, 0>, 7>>;
// No negatives: the prefix simply does not match.
type _subNegative = Expect<Equal<Subtract<2, 5>, never>>;
// Addition and subtraction are inverses.
type _roundTrip = Expect<Equal<Subtract<Add<12, 5>, 5>, 12>>;

type _gtTrue = Expect<Equal<GreaterThan<3, 2>, true>>;
type _gtFalse = Expect<Equal<GreaterThan<2, 3>, false>>;
type _gtEqual = Expect<Equal<GreaterThan<3, 3>, false>>;
type _gtZero = Expect<Equal<GreaterThan<1, 0>, true>>;
type _gtBoth = Expect<Equal<GreaterThan<0, 0>, false>>;

type _enum3 = Expect<Equal<Enumerate<3>, [0, 1, 2]>>;
type _enum0 = Expect<Equal<Enumerate<0>, []>>;
type _enum5 = Expect<Equal<Enumerate<5>, [0, 1, 2, 3, 4]>>;

type _range = Expect<Equal<Range<2, 5>, [2, 3, 4]>>;
type _rangeFromZero = Expect<Equal<Range<0, 3>, [0, 1, 2]>>;
type _rangeEmpty = Expect<Equal<Range<3, 3>, []>>;
type _rangeLength = Expect<Equal<Range<2, 5>["length"], 3>>;
// A range's length is the difference between its bounds.
type _rangeMatchesSubtract = Expect<
  Equal<Range<4, 9>["length"], Subtract<9, 4>>
>;

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("range", () => {
  it("counts from start up to (not including) end", () => {
    expect(range(2, 5)).toEqual([2, 3, 4]);
    expect(range(0, 3)).toEqual([0, 1, 2]);
  });

  it("returns [] for an empty or backwards range", () => {
    expect(range(3, 3)).toEqual([]);
    expect(range(5, 2)).toEqual([]);
  });

  it("agrees with the type-level version", () => {
    const fromTypes: Range<2, 5> = [2, 3, 4];
    expect(range(2, 5)).toEqual(fromTypes);

    const empty: Range<3, 3> = [];
    expect(range(3, 3)).toEqual(empty);
  });

  it("produces as many elements as Subtract predicts", () => {
    const length: Subtract<9, 4> = 5;
    expect(range(4, 9)).toHaveLength(length);
  });
});
