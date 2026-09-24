import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  cityOf,
  compact,
  firstNonEmpty,
  getInitials,
  safeLength,
  type Person,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

// compact must return a plain string[], with no nulls left in the type.
type _compactReturn = Expect<Equal<ReturnType<typeof compact>, string[]>>;
type _firstReturn = Expect<
  Equal<ReturnType<typeof firstNonEmpty>, string | undefined>
>;
type _cityReturn = Expect<Equal<ReturnType<typeof cityOf>, string>>;

function _compileTimeOnly(person: Person): void {
  // @ts-expect-error — address may be absent, so this needs `?.`
  person.address.city;

  // Optional chaining short-circuits the whole chain to undefined.
  const city = person.address?.city;
  type _city = Expect<Equal<typeof city, string | undefined>>;
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("safeLength", () => {
  it("measures real strings", () => {
    expect(safeLength("hello")).toBe(5);
    expect(safeLength("")).toBe(0);
  });
  it("treats nullish as zero", () => {
    expect(safeLength(null)).toBe(0);
    expect(safeLength(undefined)).toBe(0);
  });
});

describe("firstNonEmpty", () => {
  it("finds the first usable string", () => {
    expect(firstNonEmpty([null, "", "  ", "ada", "grace"])).toBe("ada");
    expect(firstNonEmpty(["first", "second"])).toBe("first");
  });
  it("returns undefined when nothing qualifies", () => {
    expect(firstNonEmpty([])).toBeUndefined();
    expect(firstNonEmpty([null, undefined, "", "   "])).toBeUndefined();
  });
});

describe("compact", () => {
  it("removes null and undefined only", () => {
    expect(compact(["a", null, "b", undefined, ""])).toEqual(["a", "b", ""]);
  });
  it("handles an all-nullish list", () => {
    expect(compact([null, undefined])).toEqual([]);
  });
});

describe("getInitials", () => {
  it("uppercases the first letter of each word", () => {
    expect(getInitials("Ada Lovelace")).toBe("AL");
    expect(getInitials("grace hopper")).toBe("GH");
    expect(getInitials("  Alan   Mathison Turing ")).toBe("AMT");
    expect(getInitials("Cher")).toBe("C");
  });
  it("returns null when there is nothing to use", () => {
    expect(getInitials(null)).toBeNull();
    expect(getInitials("")).toBeNull();
    expect(getInitials("   ")).toBeNull();
  });
});

describe("cityOf", () => {
  it("reads a present city", () => {
    expect(cityOf({ name: "Ada", address: { city: "London" } })).toBe("London");
  });
  it("falls back to unknown at every broken link", () => {
    expect(cityOf({ name: "Ada", address: {} })).toBe("unknown");
    expect(cityOf({ name: "Ada" })).toBe("unknown");
    expect(cityOf(null)).toBe("unknown");
    expect(cityOf(undefined)).toBe("unknown");
  });
});
