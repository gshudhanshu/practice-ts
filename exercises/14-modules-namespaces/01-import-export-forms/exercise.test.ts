import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import * as barrel from "./exercise";
import {
  FORMAT_PRECISION,
  area,
  formatLength,
  km,
  label,
  m,
  perimeter,
  summarise,
  toMetres,
  unitNames,
  type Circle,
  type Rect,
  type Shape,
  type UnitName,
} from "./exercise";

/* ── Fixtures ───────────────────────────────────────────────────────────── */

const circle: Circle = { kind: "circle", radius: 2 };
const rect: Rect = { kind: "rect", width: 3, height: 4 };

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _unitName = Expect<Equal<UnitName, "mm" | "cm" | "m" | "km">>;
type _unitNames = Expect<Equal<ReturnType<typeof unitNames>, string[]>>;
type _toMetres = Expect<Equal<ReturnType<typeof toMetres>, number>>;
type _shape = Expect<Equal<Shape, Circle | Rect>>;

// The re-exports must keep their original signatures.
type _area = Expect<Equal<typeof area, (shape: Shape) => number>>;
type _perimeter = Expect<Equal<typeof perimeter, (shape: Shape) => number>>;
type _formatLength = Expect<
  Equal<typeof formatLength, (value: number, unit: string) => string>
>;

// `export *` forwarded the unit constants.
type _km = Expect<Equal<typeof km, 1000>>;
type _precision = Expect<Equal<typeof FORMAT_PRECISION, 2>>;

function _compileTimeOnly(): void {
  // @ts-expect-error — not a unit.
  toMetres(1, "furlong");

  // @ts-expect-error — `export *` does not forward a default export, so the
  // barrel has no `default`.
  barrel.default;

  // @ts-expect-error — `PRECISION` was re-exported under a different name.
  barrel.PRECISION;
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("summarise (named import)", () => {
  it("uses both imported functions", () => {
    expect(summarise(rect)).toBe("area 12, perimeter 14");
  });

  it("rounds to two decimals", () => {
    expect(summarise(circle)).toBe("area 12.57, perimeter 12.57");
  });
});

describe("label (default import)", () => {
  it("formats through the default export", () => {
    expect(label(3.14159, "cm")).toBe("3.14cm");
    expect(label(2, "m")).toBe("2.00m");
  });
});

describe("units (namespace import)", () => {
  it("lists every export of ./units, sorted", () => {
    expect(unitNames()).toEqual(["cm", "km", "m", "mm"]);
  });

  it("converts through the namespace", () => {
    expect(toMetres(2, "km")).toBe(2000);
    expect(toMetres(250, "cm")).toBe(2.5);
    expect(toMetres(7, "m")).toBe(7);
  });
});

describe("re-exports", () => {
  it("forwards the named exports of ./shapes", () => {
    expect(area(rect)).toBe(12);
    expect(perimeter(rect)).toBe(14);
  });

  it("forwards ./format's default under a name", () => {
    expect(formatLength(1.005, "kg")).toBe("1.00kg");
  });

  it("forwards ./units wholesale via `export *`", () => {
    expect(m).toBe(1);
    expect(km).toBe(1000);
    expect(barrel.mm).toBe(0.001);
    expect(barrel.cm).toBe(0.01);
  });

  it("does not forward a default through `export *`", () => {
    expect(Object.keys(barrel)).not.toContain("default");
  });

  it("renames on re-export", () => {
    expect(FORMAT_PRECISION).toBe(2);
    expect(Object.keys(barrel)).not.toContain("PRECISION");
  });
});
