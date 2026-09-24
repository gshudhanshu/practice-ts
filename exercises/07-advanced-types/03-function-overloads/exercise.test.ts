import { describe as suite, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  ItemRepository,
  combine,
  describe,
  formatValue,
  makeRange,
  type Item,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

function _compileTimeOnly(): void {
  // TODO 2: the return type must follow the argument type.
  const text = combine("ab", "cd");
  type _text = Expect<Equal<typeof text, string>>;

  const numbers = combine([1, 2], [3]);
  type _numbers = Expect<Equal<typeof numbers, number[]>>;

  // @ts-expect-error — mixing the two overloads is not a valid call.
  combine("ab", [1]);

  // TODO 3: a single union signature, so the return is always string.
  const formatted = formatValue(1);
  type _formatted = Expect<Equal<typeof formatted, string>>;

  // TODO 5: ordering decides which signature wins.
  const forString = describe("a");
  type _forString = Expect<Equal<typeof forString, "text">>;

  const forNumber = describe(1);
  type _forNumber = Expect<Equal<typeof forNumber, "mixed">>;

  // TODO 1: both arities must be callable.
  makeRange(3);
  makeRange(2, 5);

  // @ts-expect-error — three arguments match no overload.
  makeRange(1, 2, 3);

  // TODO 4: both call forms on the method.
  const repo = new ItemRepository();
  repo.find("id");
  repo.find((item) => item.priceCents > 100);

  // @ts-expect-error — a number matches neither overload.
  repo.find(42);
}

/* ── Fixtures ───────────────────────────────────────────────────────────── */

const stocked = (): ItemRepository => {
  const repo = new ItemRepository();
  repo.add({ id: "a", name: "Cheap", priceCents: 50 });
  repo.add({ id: "b", name: "Mid", priceCents: 500 });
  repo.add({ id: "c", name: "Pricey", priceCents: 5000 });
  return repo;
};

/* ── Runtime spec ───────────────────────────────────────────────────────── */

suite("makeRange", () => {
  it("counts from zero with one argument", () => {
    expect(makeRange(3)).toEqual([0, 1, 2]);
    expect(makeRange(1)).toEqual([0]);
  });

  it("uses start and exclusive end with two arguments", () => {
    expect(makeRange(2, 5)).toEqual([2, 3, 4]);
    expect(makeRange(-2, 1)).toEqual([-2, -1, 0]);
  });

  it("returns [] for empty or inverted ranges", () => {
    expect(makeRange(0)).toEqual([]);
    expect(makeRange(-1)).toEqual([]);
    expect(makeRange(5, 2)).toEqual([]);
    expect(makeRange(3, 3)).toEqual([]);
  });
});

suite("combine", () => {
  it("concatenates strings", () => {
    expect(combine("ab", "cd")).toBe("abcd");
    expect(combine("", "")).toBe("");
  });

  it("concatenates arrays", () => {
    expect(combine([1, 2], [3])).toEqual([1, 2, 3]);
    expect(combine([], [])).toEqual([]);
  });

  it("does not mutate its array arguments", () => {
    const a = [1, 2];
    const b = [3];
    combine(a, b);
    expect(a).toEqual([1, 2]);
    expect(b).toEqual([3]);
  });
});

suite("formatValue", () => {
  it("handles every member of the union", () => {
    expect(formatValue("  hi  ")).toBe("hi");
    expect(formatValue(3.5)).toBe("3.50");
    expect(formatValue(0)).toBe("0.00");
    expect(formatValue(true)).toBe("yes");
    expect(formatValue(false)).toBe("no");
  });
});

suite("ItemRepository.find", () => {
  it("finds by id", () => {
    expect(stocked().find("b")?.name).toBe("Mid");
  });

  it("finds by predicate, returning the first match", () => {
    expect(stocked().find((item) => item.priceCents > 100)?.id).toBe("b");
  });

  it("returns undefined when nothing matches", () => {
    expect(stocked().find("zzz")).toBeUndefined();
    expect(stocked().find((item: Item) => item.priceCents > 99_999)).toBeUndefined();
  });

  it("still works as a normal repository", () => {
    expect(stocked().size).toBe(3);
  });
});

suite("describe", () => {
  it("reports the right label at runtime", () => {
    expect(describe("a")).toBe("text");
    expect(describe(1)).toBe("mixed");
  });
});
