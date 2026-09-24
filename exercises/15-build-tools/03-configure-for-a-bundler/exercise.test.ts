import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  APP_COMPILER_OPTIONS,
  LIBRARY_COMPILER_OPTIONS,
  optionForSymptom,
  ownerOf,
  reasonFor,
  type BuildJob,
  type BundlerOption,
  type Reason,
  type Symptom,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

// `as const` or nothing: these must be literal types, not widened strings.
type _appResolution = Expect<
  Equal<(typeof APP_COMPILER_OPTIONS)["moduleResolution"], "bundler">
>;
type _appNoEmit = Expect<Equal<(typeof APP_COMPILER_OPTIONS)["noEmit"], true>>;
type _appLib = Expect<
  Equal<
    (typeof APP_COMPILER_OPTIONS)["lib"],
    readonly ["ES2022", "DOM", "DOM.Iterable"]
  >
>;
type _appTypes = Expect<Equal<(typeof APP_COMPILER_OPTIONS)["types"], readonly []>>;

type _libModule = Expect<
  Equal<(typeof LIBRARY_COMPILER_OPTIONS)["module"], "nodenext">
>;
type _libNoEmit = Expect<
  Equal<(typeof LIBRARY_COMPILER_OPTIONS)["noEmit"], false>
>;
type _libDeclaration = Expect<
  Equal<(typeof LIBRARY_COMPILER_OPTIONS)["declaration"], true>
>;

type _ownerReturn = Expect<
  Equal<ReturnType<typeof ownerOf>, "tsc" | "bundler">
>;
type _reasonReturn = Expect<Equal<ReturnType<typeof reasonFor>, Reason>>;
type _symptomReturn = Expect<
  Equal<ReturnType<typeof optionForSymptom>, BundlerOption>
>;

function _compileTimeOnly(): void {
  // @ts-expect-error — `as const` makes the config readonly.
  APP_COMPILER_OPTIONS.noEmit = false;

  // @ts-expect-error — not a job this exercise knows about.
  ownerOf("linting");

  // @ts-expect-error — not an option this exercise knows about.
  reasonFor("strict");

  // @ts-expect-error — not a symptom this exercise knows about.
  optionForSymptom("the-build-was-slow");
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("APP_COMPILER_OPTIONS", () => {
  it("matches the specification in README.md exactly", () => {
    expect(APP_COMPILER_OPTIONS).toEqual({
      target: "ES2022",
      lib: ["ES2022", "DOM", "DOM.Iterable"],
      module: "ESNext",
      moduleResolution: "bundler",
      moduleDetection: "force",
      types: [],
      noEmit: true,
      isolatedModules: true,
      verbatimModuleSyntax: true,
      resolveJsonModule: true,
      skipLibCheck: true,
    });
  });

  it("leaves emit to the bundler", () => {
    const options: Record<string, unknown> = APP_COMPILER_OPTIONS;
    expect(options["noEmit"]).toBe(true);
    expect(options["outDir"]).toBeUndefined();
    expect(options["declaration"]).toBeUndefined();
  });
});

describe("LIBRARY_COMPILER_OPTIONS", () => {
  it("matches the specification in README.md exactly", () => {
    expect(LIBRARY_COMPILER_OPTIONS).toEqual({
      target: "ES2022",
      lib: ["ES2022"],
      module: "nodenext",
      moduleResolution: "nodenext",
      types: ["node"],
      noEmit: false,
      declaration: true,
      declarationMap: true,
      sourceMap: true,
      outDir: "dist",
      rootDir: "src",
      isolatedModules: true,
      verbatimModuleSyntax: true,
      skipLibCheck: true,
    });
  });

  it("does not ship DOM types in a Node package", () => {
    const options: Record<string, unknown> = LIBRARY_COMPILER_OPTIONS;
    expect(options["lib"]).toEqual(["ES2022"]);
  });
});

describe("ownerOf", () => {
  const cases: ReadonlyArray<readonly [BuildJob, "tsc" | "bundler"]> = [
    ["type-checking", "tsc"],
    ["transpiling-typescript-to-javascript", "bundler"],
    ["emitting-declaration-files", "tsc"],
    ["tree-shaking-unused-exports", "bundler"],
    ["minifying-and-hashing-the-output", "bundler"],
    ["catching-an-import-of-a-name-that-does-not-exist", "tsc"],
  ];

  for (const [job, expected] of cases) {
    it(`${job} -> ${expected}`, () => {
      expect(ownerOf(job)).toBe(expected);
    });
  }
});

describe("reasonFor", () => {
  const cases: ReadonlyArray<readonly [BundlerOption, Reason]> = [
    ["target", "set-the-syntax-level-tsc-downlevels-to"],
    ["lib", "declare-which-runtime-apis-exist"],
    ["module", "keep-esm-so-the-bundler-can-tree-shake"],
    ["moduleResolution", "resolve-the-way-the-bundler-resolves"],
    ["moduleDetection", "treat-every-file-as-a-module"],
    ["types", "stop-every-installed-types-package-entering-global-scope"],
    ["noEmit", "the-bundler-writes-the-output-not-tsc"],
    ["isolatedModules", "reject-what-a-single-file-transpiler-cannot-handle"],
    ["verbatimModuleSyntax", "emit-imports-exactly-as-written"],
    ["resolveJsonModule", "type-json-imports"],
    ["skipLibCheck", "trade-dependency-type-conflicts-for-build-speed"],
  ];

  for (const [option, expected] of cases) {
    it(`explains ${option}`, () => {
      expect(reasonFor(option)).toBe(expected);
    });
  }
});

describe("optionForSymptom", () => {
  const cases: ReadonlyArray<readonly [Symptom, BundlerOption]> = [
    ["tsc-wrote-javascript-next-to-my-sources", "noEmit"],
    [
      "an-import-with-only-side-effects-vanished-from-the-bundle",
      "verbatimModuleSyntax",
    ],
    ["the-bundle-failed-on-a-re-exported-type", "isolatedModules"],
    ["tsc-resolves-a-package-that-vite-cannot-find", "moduleResolution"],
    ["globals-from-an-unrelated-types-package-are-in-scope", "types"],
    ["document-is-not-a-known-name-in-a-browser-project", "lib"],
  ];

  for (const [symptom, expected] of cases) {
    it(`diagnoses ${symptom}`, () => {
      expect(optionForSymptom(symptom)).toBe(expected);
    });
  }
});
