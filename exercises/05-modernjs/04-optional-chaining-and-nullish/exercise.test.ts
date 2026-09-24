import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  bumpVisit,
  callSafely,
  displayName,
  firstLabel,
  totalOf,
  type ApiResponse,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _firstLabel = Expect<Equal<ReturnType<typeof firstLabel>, string>>;
type _totalOf = Expect<Equal<ReturnType<typeof totalOf>, number>>;

function _compileTimeOnly(response: ApiResponse): void {
  // @ts-expect-error — data may be absent.
  response.data.items;

  // Optional chaining short-circuits the entire chain.
  const label = response.data?.items?.[0]?.label;
  type _label = Expect<Equal<typeof label, string | undefined>>;

  // callSafely must be callable with no argument at all.
  const n: number = callSafely();
  void n;
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("firstLabel", () => {
  it("reads through the whole chain", () => {
    expect(
      firstLabel({ data: { items: [{ id: "1", label: "First" }] } }),
    ).toBe("First");
  });

  it("falls back at every broken link", () => {
    expect(firstLabel({})).toBe("none");
    expect(firstLabel({ data: {} })).toBe("none");
    expect(firstLabel({ data: { items: [] } })).toBe("none");
    expect(firstLabel({ data: { items: [{ id: "1" }] } })).toBe("none");
  });
});

describe("totalOf", () => {
  it("reads a present total", () => {
    expect(totalOf({ meta: { total: 42 } })).toBe(42);
  });

  it("defaults to 0 when absent", () => {
    expect(totalOf({})).toBe(0);
    expect(totalOf({ meta: {} })).toBe(0);
  });

  it("reports a real zero as zero", () => {
    expect(totalOf({ meta: { total: 0 } })).toBe(0);
  });
});

describe("callSafely", () => {
  it("calls the callback and returns its result", () => {
    expect(callSafely(() => 7)).toBe(7);
  });

  it("returns a real 0 from the callback", () => {
    expect(callSafely(() => 0)).toBe(0);
  });

  it("returns -1 when there is no callback", () => {
    expect(callSafely()).toBe(-1);
    expect(callSafely(undefined)).toBe(-1);
  });
});

describe("bumpVisit", () => {
  it("initialises then increments", () => {
    const visits: { count?: number } = {};
    expect(bumpVisit(visits)).toBe(1);
    expect(bumpVisit(visits)).toBe(2);
    expect(bumpVisit(visits)).toBe(3);
    expect(visits.count).toBe(3);
  });

  it("respects an existing count", () => {
    const visits = { count: 10 };
    expect(bumpVisit(visits)).toBe(11);
  });

  it("treats an existing 0 as a real value", () => {
    const visits = { count: 0 };
    expect(bumpVisit(visits)).toBe(1);
  });
});

describe("displayName", () => {
  it("prefers a real nickname", () => {
    expect(displayName({ username: "ada", nickname: "Ada L" })).toBe("Ada L");
  });

  it("falls back when the nickname is absent", () => {
    expect(displayName({ username: "ada" })).toBe("ada");
  });

  it("falls back when the nickname was cleared to an empty string", () => {
    expect(displayName({ username: "ada", nickname: "" })).toBe("ada");
  });
});
