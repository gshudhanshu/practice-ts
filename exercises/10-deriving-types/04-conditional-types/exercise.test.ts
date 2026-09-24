import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  firstElement,
  type Collected,
  type DeepAwaited,
  type Distributed,
  type ElementOf,
  type IsArray,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _isArrayTrue = Expect<Equal<IsArray<string[]>, true>>;
type _isArrayReadonly = Expect<Equal<IsArray<readonly number[]>, true>>;
type _isArrayFalse = Expect<Equal<IsArray<string>, false>>;
type _isArrayObject = Expect<Equal<IsArray<{ length: number }>, false>>;

type _elementString = Expect<Equal<ElementOf<string[]>, string>>;
type _elementReadonly = Expect<Equal<ElementOf<readonly number[]>, number>>;
type _elementNested = Expect<Equal<ElementOf<string[][]>, string[]>>;
type _elementNonArray = Expect<Equal<ElementOf<string>, never>>;

type _awaitedOnce = Expect<Equal<DeepAwaited<Promise<number>>, number>>;
type _awaitedTwice = Expect<Equal<DeepAwaited<Promise<Promise<string>>>, string>>;
type _awaitedThrice = Expect<
  Equal<DeepAwaited<Promise<Promise<Promise<boolean>>>>, boolean>
>;
type _awaitedPlain = Expect<Equal<DeepAwaited<number>, number>>;

// The distribution difference — the whole point of TODO 4.
type _distributed = Expect<
  Equal<Distributed<string | number>, string[] | number[]>
>;
type _collected = Expect<
  Equal<Collected<string | number>, (string | number)[]>
>;

// They agree on a single type.
type _sameForOne = Expect<Equal<Distributed<string>, string[]>>;
type _sameForOne2 = Expect<Equal<Collected<string>, string[]>>;

function _compileTimeOnly(): void {
  const strings = firstElement(["a", "b"]);
  type _strings = Expect<Equal<typeof strings, string | undefined>>;

  const numbers = firstElement([1, 2]);
  type _numbers = Expect<Equal<typeof numbers, number | undefined>>;
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("firstElement", () => {
  it("returns the first element", () => {
    expect(firstElement(["a", "b"])).toBe("a");
    expect(firstElement([1])).toBe(1);
  });

  it("returns undefined for an empty array", () => {
    expect(firstElement([])).toBeUndefined();
  });

  it("returns a falsy first element rather than undefined", () => {
    expect(firstElement([0, 1])).toBe(0);
    expect(firstElement([""])).toBe("");
  });
});
