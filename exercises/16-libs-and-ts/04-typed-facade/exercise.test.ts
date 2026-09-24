import { describe, expect, it } from "vitest";
import type { Equal, Expect, IsAny } from "../../../src/type-testing";
import { fetchAllFlags, fetchFlag } from "./vendor-flags";
import {
  callVendor,
  getFlag,
  isRawFlag,
  listFlags,
  setFlag,
  type Flag,
  type RawFlag,
  type WriteResult,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

// The dependency really is `any` — this is the thing being contained.
type _vendorIsAny = Expect<IsAny<ReturnType<typeof fetchFlag>>>;
type _vendorListIsAny = Expect<IsAny<ReturnType<typeof fetchAllFlags>>>;

// …and it stops at the boundary. `unknown`, not `any`.
type _boundaryIsUnknown = Expect<Equal<ReturnType<typeof callVendor>, unknown>>;

// Nothing above the boundary is `any`.
type _getFlagNotAny = Expect<Equal<IsAny<ReturnType<typeof getFlag>>, false>>;
type _listFlagsNotAny = Expect<Equal<IsAny<ReturnType<typeof listFlags>>, false>>;
type _setFlagNotAny = Expect<Equal<IsAny<ReturnType<typeof setFlag>>, false>>;

type _getFlag = Expect<Equal<ReturnType<typeof getFlag>, Flag | null>>;
type _listFlags = Expect<Equal<ReturnType<typeof listFlags>, readonly Flag[]>>;
type _setFlag = Expect<Equal<ReturnType<typeof setFlag>, WriteResult>>;

function _predicateNarrows(value: unknown): void {
  if (isRawFlag(value)) {
    type _narrowed = Expect<Equal<typeof value, RawFlag>>;
    const updated = value.updated_at;
    type _updated = Expect<Equal<typeof updated, string>>;
  }
}

function _resultNarrows(result: WriteResult): void {
  if (result.ok) {
    // @ts-expect-error — there is no reason on the success branch.
    result.reason;
    return;
  }

  const reason = result.reason;
  type _reason = Expect<Equal<typeof reason, string>>;
}

function _compileTimeOnly(): void {
  // @ts-expect-error — the facade takes a string key.
  getFlag(42);

  // @ts-expect-error — and a boolean value.
  setFlag("checkout.v2", "off");

  // @ts-expect-error — not a method the boundary exposes.
  callVendor("deleteEverything");
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("callVendor", () => {
  it("passes calls through to the vendor", () => {
    expect(callVendor("fetchFlag", "checkout.v2")).toEqual({
      key: "checkout.v2",
      value: true,
      updated_at: "2026-01-05",
    });
  });

  it("returns the vendor's null unchanged", () => {
    expect(callVendor("fetchFlag", "nope")).toBeNull();
  });

  it("passes further arguments along", () => {
    expect(callVendor("writeFlag", "checkout.v2", false)).toEqual({ ok: 1 });
    expect(callVendor("writeFlag", "nope", false)).toEqual({
      ok: 0,
      error: "unknown flag",
    });
  });

  it("does not clean anything up — that is not its job", () => {
    const all = callVendor("fetchAllFlags");
    expect(Array.isArray(all)).toBe(true);
    expect(all).toHaveLength(6);
  });
});

describe("isRawFlag", () => {
  it("accepts a complete record", () => {
    expect(
      isRawFlag({ key: "a", value: false, updated_at: "2026-01-01" }),
    ).toBe(true);
  });

  it("rejects everything else the vendor returns", () => {
    for (const bad of [
      { key: "legacy.mode" },
      { key: "a", value: true },
      { key: "a", value: "true", updated_at: "2026-01-01" },
      { key: 1, value: true, updated_at: "2026-01-01" },
      { key: "a", value: true, updated_at: 20260101 },
      "beta.banner",
      null,
      undefined,
      [],
      42,
    ]) {
      expect(isRawFlag(bad)).toBe(false);
    }
  });
});

describe("getFlag", () => {
  it("translates the wire shape into the domain shape", () => {
    expect(getFlag("checkout.v2")).toEqual({
      key: "checkout.v2",
      value: true,
      updatedAt: "2026-01-05",
    });
    expect(getFlag("search.fuzzy")).toEqual({
      key: "search.fuzzy",
      value: false,
      updatedAt: "2025-11-20",
    });
  });

  it("returns null for an unknown flag", () => {
    expect(getFlag("no.such.flag")).toBeNull();
  });
});

describe("listFlags", () => {
  it("drops everything that is not a flag, keeping the order", () => {
    expect(listFlags()).toEqual([
      { key: "checkout.v2", value: true, updatedAt: "2026-01-05" },
      { key: "search.fuzzy", value: false, updatedAt: "2025-11-20" },
      { key: "beta.banner", value: true, updatedAt: "2026-02-14" },
    ]);
  });
});

describe("setFlag", () => {
  it("normalises the vendor's numeric ok", () => {
    expect(setFlag("checkout.v2", false)).toEqual({ ok: true });
  });

  it("reports the vendor's error", () => {
    expect(setFlag("no.such.flag", true)).toEqual({
      ok: false,
      reason: "unknown flag",
    });
  });

  it("has an answer for a response nobody documented", () => {
    // "beta.banner" is still served by an endpoint that replies with a bare
    // string. The facade must not let that reach the caller.
    expect(setFlag("beta.banner", true)).toEqual({
      ok: false,
      reason: "unexpected response from the vendor",
    });
  });
});
