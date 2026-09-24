import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  diagnose,
  modeFor,
  relativeSpecifier,
  resolveExports,
  supports,
  type BuildTarget,
  type Cause,
  type ExportsMap,
  type Feature,
  type ResolutionMode,
  type Symptom,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _diagnoseReturn = Expect<Equal<ReturnType<typeof diagnose>, Cause>>;
type _modeForReturn = Expect<Equal<ReturnType<typeof modeFor>, ResolutionMode>>;
type _resolveReturn = Expect<
  Equal<ReturnType<typeof resolveExports>, string | null>
>;

function _compileTimeOnly(): void {
  // @ts-expect-error — "node16" is a real TS mode but not one this exercise models.
  supports("node16", "extensionless-relative-imports");

  // @ts-expect-error — not a feature this exercise knows about.
  supports("bundler", "path-aliases");

  // @ts-expect-error — not a symptom this exercise knows about.
  diagnose("the-import-was-ugly");

  // @ts-expect-error — conditions is readonly and must be strings.
  resolveExports({}, ".", [1]);
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("relativeSpecifier", () => {
  it("drops the extension for bundler and node10", () => {
    expect(relativeSpecifier("bundler", "util.ts")).toBe("./util");
    expect(relativeSpecifier("node10", "util.ts")).toBe("./util");
    expect(relativeSpecifier("bundler", "models/order.ts")).toBe(
      "./models/order",
    );
    expect(relativeSpecifier("node10", "models/order.ts")).toBe(
      "./models/order",
    );
  });

  it("writes the OUTPUT extension for nodenext", () => {
    expect(relativeSpecifier("nodenext", "util.ts")).toBe("./util.js");
    expect(relativeSpecifier("nodenext", "models/order.ts")).toBe(
      "./models/order.js",
    );
    expect(relativeSpecifier("nodenext", "util.mts")).toBe("./util.mjs");
  });
});

describe("supports", () => {
  const matrix: ReadonlyArray<readonly [ResolutionMode, Feature, boolean]> = [
    ["bundler", "extensionless-relative-imports", true],
    ["bundler", "directory-index-imports", true],
    ["bundler", "package-json-exports", true],
    ["bundler", "package-json-imports-subpaths", true],

    ["node10", "extensionless-relative-imports", true],
    ["node10", "directory-index-imports", true],
    ["node10", "package-json-exports", false],
    ["node10", "package-json-imports-subpaths", false],

    ["nodenext", "extensionless-relative-imports", false],
    ["nodenext", "directory-index-imports", false],
    ["nodenext", "package-json-exports", true],
    ["nodenext", "package-json-imports-subpaths", true],
  ];

  for (const [mode, feature, expected] of matrix) {
    it(`${mode} / ${feature} -> ${expected}`, () => {
      expect(supports(mode, feature)).toBe(expected);
    });
  }
});

describe("diagnose", () => {
  const cases: ReadonlyArray<readonly [Symptom, Cause]> = [
    ["tsc-cannot-find-a-sibling-module", "missing-js-extension"],
    [
      "node-cannot-find-a-module-that-tsc-resolved-happily",
      "bundler-resolution-with-a-node-runtime",
    ],
    [
      "a-deep-import-into-a-dependency-fails-although-the-file-is-there",
      "exports-does-not-list-the-subpath",
    ],
    [
      "a-package-ships-types-but-tsc-says-it-has-no-declarations",
      "exports-has-no-types-condition-first",
    ],
    [
      "a-default-import-of-a-commonjs-package-is-undefined-at-runtime",
      "commonjs-default-interop",
    ],
  ];

  for (const [symptom, expected] of cases) {
    it(`diagnoses ${symptom}`, () => {
      expect(diagnose(symptom)).toBe(expected);
    });
  }
});

describe("resolveExports", () => {
  const map: ExportsMap = {
    ".": {
      types: "./dist/index.d.ts",
      import: "./dist/index.mjs",
      require: "./dist/index.cjs",
    },
    "./package.json": "./package.json",
    "./feature/*": {
      types: "./dist/feature/*.d.ts",
      default: "./dist/feature/*.js",
    },
    "./feature/legacy/*": "./dist/legacy/*.js",
    "./internal/*": null,
  };

  it("resolves the root subpath by condition", () => {
    expect(resolveExports(map, ".", ["types", "import"])).toBe(
      "./dist/index.d.ts",
    );
    expect(resolveExports(map, ".", ["import"])).toBe("./dist/index.mjs");
    expect(resolveExports(map, ".", ["require"])).toBe("./dist/index.cjs");
  });

  it("returns null when no condition matches and there is no default", () => {
    expect(resolveExports(map, ".", ["deno"])).toBeNull();
    expect(resolveExports(map, ".", [])).toBeNull();
  });

  it("resolves a plain string target", () => {
    expect(resolveExports(map, "./package.json", [])).toBe("./package.json");
  });

  it("substitutes the wildcard", () => {
    expect(resolveExports(map, "./feature/flags", ["import"])).toBe(
      "./dist/feature/flags.js",
    );
    expect(resolveExports(map, "./feature/flags", ["types"])).toBe(
      "./dist/feature/flags.d.ts",
    );
    expect(resolveExports(map, "./feature/a/b", ["import"])).toBe(
      "./dist/feature/a/b.js",
    );
  });

  it("prefers the longest matching prefix", () => {
    expect(resolveExports(map, "./feature/legacy/grid", ["import"])).toBe(
      "./dist/legacy/grid.js",
    );
  });

  it("treats a null target as deliberately blocked", () => {
    expect(resolveExports(map, "./internal/db", ["import"])).toBeNull();
  });

  it("returns null for a subpath the map does not list", () => {
    expect(resolveExports(map, "./secret", ["import"])).toBeNull();
    expect(resolveExports(map, "./feature", ["import"])).toBeNull();
  });

  it("reproduces the types-listed-last bug", () => {
    // Exactly the same targets, only the key order differs. Because conditions
    // are tried in declaration order, tsc's own condition list ("types",
    // "import", …) matches "import" first and never sees the declarations.
    const wrongOrder: ExportsMap = {
      ".": {
        import: "./dist/index.mjs",
        types: "./dist/index.d.ts",
      },
    };

    expect(resolveExports(wrongOrder, ".", ["types", "import"])).toBe(
      "./dist/index.mjs",
    );
  });
});

describe("modeFor", () => {
  const cases: ReadonlyArray<readonly [BuildTarget, ResolutionMode]> = [
    ["vite-application", "bundler"],
    ["published-node-library", "nodenext"],
    ["legacy-webpack-4-build", "node10"],
    ["script-run-by-node-directly", "nodenext"],
  ];

  for (const [target, expected] of cases) {
    it(`${target} -> ${expected}`, () => {
      expect(modeFor(target)).toBe(expected);
    });
  }
});
