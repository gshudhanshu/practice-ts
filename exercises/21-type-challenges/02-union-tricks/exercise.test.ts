import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  mergeConfigs,
  type IsAny,
  type IsUnion,
  type IsUnknown,
  type UnionToIntersection,
  type UnionToTuple,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _anyIsAny = Expect<Equal<IsAny<any>, true>>;
type _unknownIsNotAny = Expect<Equal<IsAny<unknown>, false>>;
type _neverIsNotAny = Expect<Equal<IsAny<never>, false>>;
type _stringIsNotAny = Expect<Equal<IsAny<string>, false>>;
type _objectIsNotAny = Expect<Equal<IsAny<{ a: 1 }>, false>>;
type _unionIsNotAny = Expect<Equal<IsAny<string | number>, false>>;

type _unknownIsUnknown = Expect<Equal<IsUnknown<unknown>, true>>;
// The trap: `unknown extends any` is true, so `any` must be ruled out first.
type _anyIsNotUnknown = Expect<Equal<IsUnknown<any>, false>>;
type _neverIsNotUnknown = Expect<Equal<IsUnknown<never>, false>>;
type _stringIsNotUnknown = Expect<Equal<IsUnknown<string>, false>>;
type _objectIsNotUnknown = Expect<Equal<IsUnknown<{}>, false>>;

type _u2iObjects = Expect<
  Equal<
    UnionToIntersection<{ a: string } | { b: number }>,
    { a: string } & { b: number }
  >
>;
type _u2iThree = Expect<
  Equal<
    UnionToIntersection<{ a: 1 } | { b: 2 } | { c: 3 }>,
    { a: 1 } & { b: 2 } & { c: 3 }
  >
>;
// Two primitives have no common values, so their intersection is `never`.
type _u2iPrimitives = Expect<Equal<UnionToIntersection<string | number>, never>>;
// A single type is its own intersection.
type _u2iSingle = Expect<Equal<UnionToIntersection<"a">, "a">>;

type _isUnionTwo = Expect<Equal<IsUnion<string | number>, true>>;
type _isUnionThree = Expect<Equal<IsUnion<"a" | "b" | "c">, true>>;
type _isUnionSingle = Expect<Equal<IsUnion<string>, false>>;
type _isUnionLiteral = Expect<Equal<IsUnion<"a">, false>>;
// `boolean` is `true | false` internally.
type _isUnionBoolean = Expect<Equal<IsUnion<boolean>, true>>;
type _isUnionNever = Expect<Equal<IsUnion<never>, false>>;
// A union of an array and a primitive is still a union.
type _isUnionMixed = Expect<Equal<IsUnion<string[] | number>, true>>;
// An intersection is one type, not a union.
type _isUnionIntersection = Expect<
  Equal<IsUnion<{ a: 1 } & { b: 2 }>, false>
>;

type _tupleThree = Expect<Equal<UnionToTuple<"a" | "b" | "c">, ["a", "b", "c"]>>;
type _tupleTwo = Expect<Equal<UnionToTuple<"x" | "y">, ["x", "y"]>>;
type _tupleSingle = Expect<Equal<UnionToTuple<1>, [1]>>;
type _tupleNever = Expect<Equal<UnionToTuple<never>, []>>;
type _tupleLength = Expect<
  Equal<UnionToTuple<"a" | "b" | "c">["length"], 3>
>;

function _compileTimeOnly(): void {
  const merged = mergeConfigs({ retries: 2 }, { verbose: true });
  type _merged = Expect<
    Equal<typeof merged, { retries: number } & { verbose: boolean }>
  >;

  // The runtime merge and the type-level union-to-intersection agree.
  type _agree = Expect<
    Equal<
      typeof merged,
      UnionToIntersection<{ retries: number } | { verbose: boolean }>
    >
  >;

  // Both properties are visible on the result.
  const retries: number = merged.retries;
  const verbose: boolean = merged.verbose;
  void retries;
  void verbose;
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("mergeConfigs", () => {
  it("combines both objects", () => {
    expect(mergeConfigs({ retries: 2 }, { verbose: true })).toEqual({
      retries: 2,
      verbose: true,
    });
  });

  it("lets the override win", () => {
    expect(mergeConfigs({ retries: 2 }, { retries: 5 })).toEqual({
      retries: 5,
    });
  });

  it("does not mutate either argument", () => {
    const base = { retries: 2 };
    const override = { verbose: true };
    mergeConfigs(base, override);
    expect(base).toEqual({ retries: 2 });
    expect(override).toEqual({ verbose: true });
  });
});
