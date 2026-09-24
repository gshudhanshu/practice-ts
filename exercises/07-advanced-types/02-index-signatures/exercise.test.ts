import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  flattenTranslations,
  pickDefined,
  translate,
  type Config,
  type Translations,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _translations = Expect<
  Equal<Translations, Record<string, Record<string, string>>>
>;

// A quirk worth knowing, asserted on local types so it does not constrain
// which form you chose above. These two are the SAME type…
type ViaRecord = Record<string, number>;
type ViaIndexSignature = { [key: string]: number };
type _sameType = Expect<Equal<ViaRecord, ViaIndexSignature>>;

// …yet `keyof` reports them differently: a declared index signature also admits
// numeric keys (JavaScript stringifies them), while the mapped form reports
// only its constraint.
type _keyofRecord = Expect<Equal<keyof ViaRecord, string>>;
type _keyofIndexSignature = Expect<
  Equal<keyof ViaIndexSignature, string | number>
>;

type _configName = Expect<Equal<Config["name"], string>>;

type _pickDefinedReturn = Expect<
  Equal<ReturnType<typeof pickDefined>, Record<string, string>>
>;

function _compileTimeOnly(): void {
  const config: Config = { name: "app", retries: 3, mode: "fast" };
  void config;

  // @ts-expect-error — booleans are not allowed by the index signature.
  const _badValue: Config = { name: "app", debug: true };

  // @ts-expect-error — `name` is required.
  const _missingName: Config = { retries: 1 };

  const catalogue: Translations = { en: { greeting: "Hello" } };

  // Reading is honest: both levels are possibly undefined.
  const locale = catalogue["en"];
  type _locale = Expect<
    Equal<typeof locale, Record<string, string> | undefined>
  >;
}

/* ── Fixtures ───────────────────────────────────────────────────────────── */

const catalogue: Translations = {
  en: { greeting: "Hello", bye: "Goodbye" },
  fr: { greeting: "Bonjour" },
};

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("translate", () => {
  it("finds an existing message", () => {
    expect(translate(catalogue, "en", "greeting", "??")).toBe("Hello");
    expect(translate(catalogue, "fr", "greeting", "??")).toBe("Bonjour");
  });

  it("falls back on an unknown key", () => {
    expect(translate(catalogue, "fr", "bye", "??")).toBe("??");
  });

  it("falls back on an unknown locale", () => {
    expect(translate(catalogue, "de", "greeting", "??")).toBe("??");
  });

  it("returns a stored empty string rather than the fallback", () => {
    const withBlank: Translations = { en: { blank: "" } };
    expect(translate(withBlank, "en", "blank", "??")).toBe("");
  });
});

describe("flattenTranslations", () => {
  it("joins the two levels with a dot", () => {
    expect(flattenTranslations(catalogue)).toEqual({
      "en.greeting": "Hello",
      "en.bye": "Goodbye",
      "fr.greeting": "Bonjour",
    });
  });

  it("returns an empty object for an empty catalogue", () => {
    expect(flattenTranslations({})).toEqual({});
  });

  it("skips a locale with no messages", () => {
    expect(flattenTranslations({ en: {} })).toEqual({});
  });
});

describe("pickDefined", () => {
  it("removes undefined values", () => {
    expect(pickDefined({ a: "1", b: undefined, c: "3" })).toEqual({
      a: "1",
      c: "3",
    });
  });

  it("keeps empty strings", () => {
    expect(pickDefined({ a: "", b: undefined })).toEqual({ a: "" });
  });

  it("removes the keys entirely, not just the values", () => {
    expect(Object.keys(pickDefined({ a: "1", b: undefined }))).toEqual(["a"]);
  });

  it("handles an empty object", () => {
    expect(pickDefined({})).toEqual({});
  });
});
