import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  PALETTE,
  ROUTES,
  firstUpper,
  getColor,
  toStatusCode,
  type StatusCode,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

// `satisfies` checks WITHOUT widening: the keys stay literal…
type _paletteKeys = Expect<
  Equal<keyof typeof PALETTE, "primary" | "danger" | "muted">
>;

// …and so do the values. A plain `: Theme` annotation would give ColorValue.
type _primaryLiteral = Expect<Equal<typeof PALETTE.primary, "#0055ff">>;

// `as const satisfies` keeps the exact tuple while validating every member.
type _routes = Expect<
  Equal<typeof ROUTES, readonly ["/", "/about", "/contact"]>
>;

type _statusReturn = Expect<
  Equal<ReturnType<typeof toStatusCode>, StatusCode | undefined>
>;
type _firstUpperReturn = Expect<Equal<ReturnType<typeof firstUpper>, string>>;

function _compileTimeOnly(): void {
  // @ts-expect-error — the keys are literal, so a typo cannot compile.
  getColor("primry");

  // @ts-expect-error — ROUTES is a readonly tuple.
  ROUTES.push("/new");

  const code = toStatusCode(200);
  type _code = Expect<Equal<typeof code, StatusCode | undefined>>;
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("PALETTE", () => {
  it("keeps its values", () => {
    expect(PALETTE.primary).toBe("#0055ff");
    expect(PALETTE.danger).toBe("#ff0033");
    expect(PALETTE.muted).toBe("#888888");
  });
});

describe("ROUTES", () => {
  it("keeps its members in order", () => {
    expect([...ROUTES]).toEqual(["/", "/about", "/contact"]);
  });
});

describe("getColor", () => {
  it("reads a colour by key", () => {
    expect(getColor("primary")).toBe("#0055ff");
    expect(getColor("muted")).toBe("#888888");
  });
});

describe("toStatusCode", () => {
  it("accepts every declared code", () => {
    expect(toStatusCode(200)).toBe(200);
    expect(toStatusCode(404)).toBe(404);
    expect(toStatusCode(500)).toBe(500);
  });

  it("rejects unknown numbers", () => {
    expect(toStatusCode(999)).toBeUndefined();
    expect(toStatusCode(0)).toBeUndefined();
  });

  it("rejects non-numbers", () => {
    expect(toStatusCode("200")).toBeUndefined();
    expect(toStatusCode(null)).toBeUndefined();
    expect(toStatusCode(undefined)).toBeUndefined();
    expect(toStatusCode({ code: 200 })).toBeUndefined();
  });
});

describe("firstUpper", () => {
  it("uppercases the first entry", () => {
    expect(firstUpper(["ada", "grace"])).toBe("ADA");
  });

  it("returns an empty string rather than throwing", () => {
    expect(firstUpper([])).toBe("");
  });

  it("handles a stored empty string", () => {
    expect(firstUpper([""])).toBe("");
  });
});
