import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import type { Shape as ShapeSource } from "./shapes";
import {
  DIRECTION,
  diagnose,
  emitsAnImport,
  flaggedByTheCompiler,
  summarise,
  type Construct,
  type Direction,
  type ImportForm,
  type Problem,
  type Shape,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

// The type must be re-exported, and must be the SAME type — not a copy someone
// re-declared by hand.
type _shapeIsReexported = Expect<Equal<Shape, ShapeSource>>;

// Derived from DIRECTION, not hand-written.
type _direction = Expect<Equal<Direction, "up" | "down" | "left" | "right">>;
type _directionIsNotWidened = Expect<
  Equal<string extends Direction ? true : false, false>
>;

type _diagnoseReturn = Expect<Equal<ReturnType<typeof diagnose>, Construct>>;

function _compileTimeOnly(): void {
  // @ts-expect-error — DIRECTION must be a frozen literal object (`as const`).
  DIRECTION.up = "sideways";

  // @ts-expect-error — not a problem this exercise knows about.
  diagnose("the-build-was-slow");

  // @ts-expect-error — not a construct this exercise knows about.
  flaggedByTheCompiler("jsx");

  // @ts-expect-error — not an import form this exercise knows about.
  emitsAnImport("export * from 'm'");
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("summarise", () => {
  it("uses the imported value helper", () => {
    expect(summarise({ kind: "square", side: 3 })).toBe("square: 9.00");
    expect(summarise({ kind: "circle", radius: 1 })).toBe("circle: 3.14");
  });
});

describe("DIRECTION", () => {
  it("replaces the const enum with a plain object", () => {
    expect(DIRECTION).toEqual({
      up: "up",
      down: "down",
      left: "left",
      right: "right",
    });
  });

  it("is readable at runtime, unlike an inlined const enum", () => {
    expect(Object.values(DIRECTION).sort()).toEqual([
      "down",
      "left",
      "right",
      "up",
    ]);
  });
});

describe("diagnose", () => {
  const cases: ReadonlyArray<readonly [Problem, Construct]> = [
    ["bundler-cannot-find-an-exported-name", "type-reexport-without-export-type"],
    ["enum-member-is-undefined-at-runtime", "ambient-const-enum"],
    ["enum-object-survives-into-the-bundle", "const-enum"],
    ["half-the-namespace-members-vanished", "namespace-merged-across-files"],
    ["require-is-not-defined-in-the-browser", "import-equals-require"],
  ];

  for (const [problem, expected] of cases) {
    it(`diagnoses ${problem}`, () => {
      expect(diagnose(problem)).toBe(expected);
    });
  }
});

describe("flaggedByTheCompiler", () => {
  it("knows what tsc rejects outright", () => {
    expect(flaggedByTheCompiler("type-reexport-without-export-type")).toBe(true);
    expect(flaggedByTheCompiler("ambient-const-enum")).toBe(true);
    expect(flaggedByTheCompiler("import-equals-require")).toBe(true);
  });

  it("knows what compiles and breaks anyway", () => {
    expect(flaggedByTheCompiler("const-enum")).toBe(false);
    expect(flaggedByTheCompiler("namespace-merged-across-files")).toBe(false);
  });
});

describe("emitsAnImport", () => {
  const cases: ReadonlyArray<readonly [ImportForm, boolean]> = [
    ["import type { T } from 'm'", false],
    ["import { type T } from 'm'", true],
    ["import { value } from 'm'", true],
    ["import 'm'", true],
    ["import type * as NS from 'm'", false],
  ];

  for (const [form, expected] of cases) {
    it(`${form} -> ${expected ? "keeps" : "drops"} the import`, () => {
      expect(emitsAnImport(form)).toBe(expected);
    });
  }
});
