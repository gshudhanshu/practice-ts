import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  area,
  contactLabel,
  formatValue,
  withDefault,
  type Shape,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

// Shape must be a three-member union discriminated on `kind`.
type _kinds = Expect<Equal<Shape["kind"], "circle" | "rectangle" | "triangle">>;

// Extracting one member by its discriminant must yield exactly that member.
type Circle = Extract<Shape, { kind: "circle" }>;
type _circle = Expect<Equal<Circle, { kind: "circle"; radius: number }>>;

type Rectangle = Extract<Shape, { kind: "rectangle" }>;
type _rectangle = Expect<
  Equal<Rectangle, { kind: "rectangle"; width: number; height: number }>
>;

type Triangle = Extract<Shape, { kind: "triangle" }>;
type _triangle = Expect<
  Equal<Triangle, { kind: "triangle"; base: number; height: number }>
>;

function _compileTimeOnly(shape: Shape): void {
  // @ts-expect-error — "hexagon" is not a member of the union.
  const _bad: Shape = { kind: "hexagon" };

  if (shape.kind === "circle") {
    // Narrowed: radius is reachable, width is not.
    type _hasRadius = Expect<Equal<typeof shape.radius, number>>;
    // @ts-expect-error — a circle has no width.
    shape.width;
  }
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("formatValue", () => {
  it("trims strings", () => {
    expect(formatValue("  hello  ")).toBe("hello");
    expect(formatValue("hi")).toBe("hi");
  });

  it("reports blank strings as (empty)", () => {
    expect(formatValue("")).toBe("(empty)");
    expect(formatValue("   ")).toBe("(empty)");
  });

  it("gives numbers two decimal places", () => {
    expect(formatValue(3.5)).toBe("3.50");
    expect(formatValue(0)).toBe("0.00");
    expect(formatValue(-2)).toBe("-2.00");
  });

  it("renders booleans as yes/no", () => {
    expect(formatValue(true)).toBe("yes");
    expect(formatValue(false)).toBe("no");
  });
});

describe("area", () => {
  it("handles every shape", () => {
    expect(area({ kind: "circle", radius: 2 })).toBeCloseTo(12.5664, 3);
    expect(area({ kind: "rectangle", width: 3, height: 4 })).toBe(12);
    expect(area({ kind: "triangle", base: 6, height: 5 })).toBe(15);
  });

  it("handles zero dimensions", () => {
    expect(area({ kind: "circle", radius: 0 })).toBe(0);
    expect(area({ kind: "rectangle", width: 0, height: 9 })).toBe(0);
  });
});

describe("withDefault", () => {
  it("substitutes only null and undefined", () => {
    expect(withDefault(null, 5)).toBe(5);
    expect(withDefault(undefined, "x")).toBe("x");
  });

  it("preserves falsy-but-valid values", () => {
    expect(withDefault(0, 5)).toBe(0);
    expect(withDefault("", "fallback")).toBe("");
    expect(withDefault(Number.NaN, 5)).toBeNaN();
  });

  it("passes through ordinary values", () => {
    expect(withDefault("hi", "x")).toBe("hi");
    expect(withDefault(42, 5)).toBe(42);
  });
});

describe("contactLabel", () => {
  it("narrows with the in operator", () => {
    expect(contactLabel({ email: "a@b.com" })).toBe("email: a@b.com");
    expect(contactLabel({ phone: "555-0100" })).toBe("phone: 555-0100");
  });
});
