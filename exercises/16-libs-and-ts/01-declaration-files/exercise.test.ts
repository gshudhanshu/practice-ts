import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  diagnose,
  firstTag,
  slugRuntime,
  slugTitle,
  typeSourceFor,
  type Cause,
  type LegacySlug,
  type Situation,
  type SlugRuntime,
  type Symptom,
  type TypeSource,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _runtimeReturn = Expect<Equal<ReturnType<typeof slugRuntime>, SlugRuntime>>;
type _firstTagReturn = Expect<Equal<ReturnType<typeof firstTag>, string | null>>;
type _sourceReturn = Expect<Equal<ReturnType<typeof typeSourceFor>, TypeSource>>;
type _causeReturn = Expect<Equal<ReturnType<typeof diagnose>, Cause>>;

function _declarationShape(mod: LegacySlug): void {
  const version = mod.VERSION;
  type _version = Expect<Equal<typeof version, string>>;

  const slug = mod.slugify("Hello");
  type _slug = Expect<Equal<typeof slug, string>>;

  const short = mod.truncate("Hello", 3);
  type _short = Expect<Equal<typeof short, string>>;

  // The honest declaration. `tags` really can hand back `undefined`, and a
  // declaration that says otherwise is a lie the compiler will defend.
  const list = mod.tags("a,b");
  type _list = Expect<Equal<typeof list, string[] | undefined>>;

  // @ts-expect-error — `truncate` takes a number for its second argument.
  mod.truncate("Hello", "3");

  // @ts-expect-error — `slugify` takes a string.
  mod.slugify(42);
}

function _globalIsDeclared(): void {
  // Only compiles once TODO 3's `declare global` block exists.
  const runtime = globalThis.__LEGACY_SLUG__;
  type _runtime = Expect<Equal<typeof runtime, SlugRuntime>>;
}

function _compileTimeOnly(): void {
  // @ts-expect-error — not a situation this exercise knows about.
  typeSourceFor("the-package-was-written-in-rust");

  // @ts-expect-error — not a symptom this exercise knows about.
  diagnose("the-types-were-ugly");
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("slugTitle", () => {
  it("slugifies, then truncates", () => {
    expect(slugTitle("Hello, World!", 8)).toBe("hello-wo...");
    expect(slugTitle("Hello", 20)).toBe("hello");
    expect(slugTitle("  Trailing punctuation!!  ", 40)).toBe(
      "trailing-punctuation",
    );
  });
});

describe("firstTag", () => {
  it("returns the first tag", () => {
    expect(firstTag("news, ts")).toBe("news");
    expect(firstTag("solo")).toBe("solo");
  });

  it("survives the undocumented undefined", () => {
    // `tags("")` returns undefined, not []. A declaration that promised
    // `string[]` compiles fine and throws right here.
    expect(firstTag("")).toBeNull();
    expect(firstTag("   ")).toBeNull();
    expect(firstTag(",,,")).toBeNull();
  });
});

describe("slugRuntime", () => {
  it("reads the global the vendor script installed", () => {
    expect(slugRuntime()).toEqual({
      version: "1.4.0",
      installedAt: "2019-04-02",
    });
  });
});

describe("typeSourceFor", () => {
  const cases: ReadonlyArray<readonly [Situation, TypeSource]> = [
    ["the-package-ships-its-own-declarations", "bundled-with-the-package"],
    [
      "the-package-is-javascript-only-and-@types-exists-on-npm",
      "definitely-typed",
    ],
    [
      "no-declarations-exist-anywhere-and-you-use-two-functions-from-it",
      "your-own-declaration-file",
    ],
    ["noImplicitAny-is-off-and-the-import-silently-became-any", "none"],
  ];

  for (const [situation, expected] of cases) {
    it(`${situation} -> ${expected}`, () => {
      expect(typeSourceFor(situation)).toBe(expected);
    });
  }
});

describe("diagnose", () => {
  const cases: ReadonlyArray<readonly [Symptom, Cause]> = [
    ["the-import-is-typed-any-and-noImplicitAny-reports-it", "no-declaration-file"],
    [
      "tsc-is-happy-and-the-property-is-undefined-at-runtime",
      "the-declaration-does-not-match-the-runtime",
    ],
    [
      "the-declarations-describe-an-older-major-version-of-the-package",
      "types-version-drift",
    ],
    [
      "declare-module-compiles-but-node-cannot-resolve-the-import",
      "a-declaration-without-a-runtime-module",
    ],
    ["editing-the-d-ts-changed-nothing-in-the-bundle", "declarations-emit-nothing"],
  ];

  for (const [symptom, expected] of cases) {
    it(`diagnoses ${symptom}`, () => {
      expect(diagnose(symptom)).toBe(expected);
    });
  }
});
