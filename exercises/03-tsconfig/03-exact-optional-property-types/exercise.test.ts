import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  isConfigured,
  mergeSettings,
  withoutLanguage,
  type Settings,
  type SettingsPatch,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _autoSave = Expect<Equal<Settings["autoSave"], boolean | undefined>>;
type _language = Expect<Equal<Settings["language"], string | undefined>>;
type _theme = Expect<Equal<Settings["theme"], "light" | "dark">>;

const base: Settings = { theme: "light", fontSize: 12 };

// A patch may legally be empty, partial, or contain explicit undefined.
const _emptyPatch: SettingsPatch = {};
const _partialPatch: SettingsPatch = { fontSize: 14 };
const _undefinedPatch: SettingsPatch = { fontSize: undefined, theme: undefined };

function _compileTimeOnly(): void {
  // @ts-expect-error — under exactOptionalPropertyTypes, Settings may NOT
  // carry an explicit undefined for an optional property.
  const _bad: Settings = { theme: "light", fontSize: 12, autoSave: undefined };

  // @ts-expect-error — theme and fontSize are required in Settings.
  const _missing: Settings = { theme: "dark" };
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("mergeSettings", () => {
  it("applies provided values", () => {
    expect(mergeSettings(base, { fontSize: 14 })).toEqual({
      theme: "light",
      fontSize: 14,
    });
    expect(mergeSettings(base, { theme: "dark" })).toEqual({
      theme: "dark",
      fontSize: 12,
    });
  });

  it("ignores keys explicitly set to undefined", () => {
    expect(mergeSettings(base, { fontSize: undefined })).toEqual({
      theme: "light",
      fontSize: 12,
    });
    expect(
      mergeSettings(base, { theme: undefined, fontSize: undefined }),
    ).toEqual({ theme: "light", fontSize: 12 });
  });

  it("never produces an undefined-valued key", () => {
    const merged = mergeSettings(base, { autoSave: undefined });
    expect("autoSave" in merged).toBe(false);
  });

  it("adds optional values when supplied", () => {
    expect(mergeSettings(base, { autoSave: true, language: "en" })).toEqual({
      theme: "light",
      fontSize: 12,
      autoSave: true,
      language: "en",
    });
  });

  it("keeps false and 0 rather than treating them as missing", () => {
    const merged = mergeSettings(base, { autoSave: false, fontSize: 0 });
    expect(merged.autoSave).toBe(false);
    expect(merged.fontSize).toBe(0);
  });

  it("does not mutate the base object", () => {
    const original: Settings = { theme: "light", fontSize: 12 };
    mergeSettings(original, { fontSize: 99 });
    expect(original.fontSize).toBe(12);
  });
});

describe("withoutLanguage", () => {
  it("removes the key entirely", () => {
    const result = withoutLanguage({ ...base, language: "en" });
    expect("language" in result).toBe(false);
    expect(result).toEqual({ theme: "light", fontSize: 12 });
  });

  it("is a no-op when language was already absent", () => {
    const result = withoutLanguage(base);
    expect("language" in result).toBe(false);
  });
});

describe("isConfigured", () => {
  it("reports present keys, even when falsy", () => {
    expect(isConfigured({ ...base, autoSave: false }, "autoSave")).toBe(true);
    expect(isConfigured({ ...base, autoSave: true }, "autoSave")).toBe(true);
    expect(isConfigured({ ...base, language: "" }, "language")).toBe(true);
  });

  it("reports absent keys", () => {
    expect(isConfigured(base, "autoSave")).toBe(false);
    expect(isConfigured(base, "language")).toBe(false);
  });
});
