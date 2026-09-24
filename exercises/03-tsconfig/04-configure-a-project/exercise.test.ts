import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  RECOMMENDED_COMPILER_OPTIONS,
  STRICT_IMPLIED_FLAGS,
  flagForProblem,
  isImpliedByStrict,
  type CompilerFlag,
  type Problem,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

// The list must hold CompilerFlag literals, not widened `string`.
// (It is a strict subset of CompilerFlag, so `extends` is the right check.)
type _flagsAreLiteral = Expect<
  (typeof STRICT_IMPLIED_FLAGS)[number] extends CompilerFlag ? true : false
>;
type _flagsNotWidened = Expect<
  Equal<string extends (typeof STRICT_IMPLIED_FLAGS)[number] ? true : false, false>
>;

type _diagnosisReturn = Expect<
  Equal<ReturnType<typeof flagForProblem>, CompilerFlag>
>;

function _compileTimeOnly(): void {
  // @ts-expect-error — the flag list must be readonly.
  STRICT_IMPLIED_FLAGS.push("noImplicitAny");

  // @ts-expect-error — not a flag this exercise knows about.
  isImpliedByStrict("noSuchFlag");

  // @ts-expect-error — not a problem this exercise knows about.
  flagForProblem("made-up-problem");
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("STRICT_IMPLIED_FLAGS", () => {
  it("lists exactly the eight flags that `strict: true` enables", () => {
    expect([...STRICT_IMPLIED_FLAGS].sort()).toEqual([
      "alwaysStrict",
      "noImplicitAny",
      "noImplicitThis",
      "strictBindCallApply",
      "strictFunctionTypes",
      "strictNullChecks",
      "strictPropertyInitialization",
      "useUnknownInCatchVariables",
    ]);
  });
});

describe("isImpliedByStrict", () => {
  it("recognises flags inside strict", () => {
    expect(isImpliedByStrict("noImplicitAny")).toBe(true);
    expect(isImpliedByStrict("strictNullChecks")).toBe(true);
    expect(isImpliedByStrict("useUnknownInCatchVariables")).toBe(true);
  });

  it("recognises the valuable flags strict does NOT cover", () => {
    expect(isImpliedByStrict("noUncheckedIndexedAccess")).toBe(false);
    expect(isImpliedByStrict("exactOptionalPropertyTypes")).toBe(false);
    expect(isImpliedByStrict("noImplicitOverride")).toBe(false);
    expect(isImpliedByStrict("noFallthroughCasesInSwitch")).toBe(false);
    expect(isImpliedByStrict("noUnusedLocals")).toBe(false);
    expect(isImpliedByStrict("noPropertyAccessFromIndexSignature")).toBe(false);
    expect(isImpliedByStrict("allowUnreachableCode")).toBe(false);
  });
});

describe("flagForProblem", () => {
  const cases: ReadonlyArray<readonly [Problem, CompilerFlag]> = [
    ["index-access-crashed", "noUncheckedIndexedAccess"],
    ["spread-erased-a-default", "exactOptionalPropertyTypes"],
    ["orphaned-override", "noImplicitOverride"],
    ["switch-fell-through", "noFallthroughCasesInSwitch"],
    ["parameter-was-implicitly-any", "noImplicitAny"],
    ["null-dereference", "strictNullChecks"],
    ["catch-variable-assumed-to-be-an-error", "useUnknownInCatchVariables"],
  ];

  for (const [problem, expected] of cases) {
    it(`diagnoses ${problem}`, () => {
      expect(flagForProblem(problem)).toBe(expected);
    });
  }
});

describe("RECOMMENDED_COMPILER_OPTIONS", () => {
  it("matches the specification in README.md", () => {
    expect(RECOMMENDED_COMPILER_OPTIONS).toEqual({
      target: "ES2022",
      module: "ESNext",
      moduleResolution: "bundler",
      strict: true,
      noUncheckedIndexedAccess: true,
      exactOptionalPropertyTypes: true,
      noImplicitOverride: true,
      noFallthroughCasesInSwitch: true,
      verbatimModuleSyntax: true,
      isolatedModules: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
    });
  });

  it("does not enable allowUnreachableCode or disable strict", () => {
    const options: Record<string, unknown> = RECOMMENDED_COMPILER_OPTIONS;
    expect(options["allowUnreachableCode"]).toBeUndefined();
    expect(options["strict"]).toBe(true);
  });
});
