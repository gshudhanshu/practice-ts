import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  unshift,
  type Head,
  type Last,
  type Length,
  type Pop,
  type Push,
  type Tail,
  type Unshift,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _len3 = Expect<Equal<Length<[1, 2, 3]>, 3>>;
type _len0 = Expect<Equal<Length<[]>, 0>>;
type _lenReadonly = Expect<Equal<Length<readonly ["a", "b"]>, 2>>;
// An array is not a tuple: its length is `number`, not a literal.
type _lenArray = Expect<Equal<Length<string[]>, number>>;

type _head = Expect<Equal<Head<[1, 2, 3]>, 1>>;
type _headOne = Expect<Equal<Head<["only"]>, "only">>;
type _headEmpty = Expect<Equal<Head<[]>, never>>;
type _headMixed = Expect<Equal<Head<[string, number]>, string>>;
type _headReadonly = Expect<Equal<Head<readonly [1, 2]>, 1>>;

type _tail = Expect<Equal<Tail<[1, 2, 3]>, [2, 3]>>;
type _tailOne = Expect<Equal<Tail<[1]>, []>>;
type _tailEmpty = Expect<Equal<Tail<[]>, []>>;
type _tailReadonly = Expect<Equal<Tail<readonly [1, 2, 3]>, [2, 3]>>;

type _last = Expect<Equal<Last<[1, 2, 3]>, 3>>;
type _lastOne = Expect<Equal<Last<["only"]>, "only">>;
type _lastEmpty = Expect<Equal<Last<[]>, never>>;

type _pop = Expect<Equal<Pop<[1, 2, 3]>, [1, 2]>>;
type _popOne = Expect<Equal<Pop<[1]>, []>>;
type _popEmpty = Expect<Equal<Pop<[]>, []>>;

type _push = Expect<Equal<Push<[1, 2], 3>, [1, 2, 3]>>;
type _pushEmpty = Expect<Equal<Push<[], "a">, ["a"]>>;
// A readonly input produces a mutable result.
type _pushReadonly = Expect<Equal<Push<readonly [1, 2], 3>, [1, 2, 3]>>;

type _unshift = Expect<Equal<Unshift<[2, 3], 1>, [1, 2, 3]>>;
type _unshiftEmpty = Expect<Equal<Unshift<[], "a">, ["a"]>>;

// The pieces compose: Head + Tail rebuild the original tuple.
type _roundTrip = Expect<
  Equal<Unshift<Tail<[1, 2, 3]>, Head<[1, 2, 3]>>, [1, 2, 3]>
>;

function _compileTimeOnly(): void {
  const numbers = unshift([2, 3], 1);
  type _numbers = Expect<Equal<typeof numbers, [1, 2, 3]>>;

  const strings = unshift(["b", "c"], "a");
  type _strings = Expect<Equal<typeof strings, ["a", "b", "c"]>>;

  const onEmpty = unshift([], "a");
  type _onEmpty = Expect<Equal<typeof onEmpty, ["a"]>>;

  const onReadonly = unshift(["b"] as const, "a");
  type _onReadonly = Expect<Equal<typeof onReadonly, ["a", "b"]>>;
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("unshift", () => {
  it("puts the value at the front", () => {
    expect(unshift([2, 3], 1)).toEqual([1, 2, 3]);
    expect(unshift(["b", "c"], "a")).toEqual(["a", "b", "c"]);
  });

  it("handles an empty list", () => {
    expect(unshift([], "a")).toEqual(["a"]);
  });

  it("does not mutate the input", () => {
    const original = [2, 3];
    unshift(original, 1);
    expect(original).toEqual([2, 3]);
  });

  it("agrees with the type-level version", () => {
    const result = unshift([2, 3], 1);
    const fromTypes: Unshift<[2, 3], 1> = [1, 2, 3];
    expect(result).toEqual(fromTypes);
  });
});
