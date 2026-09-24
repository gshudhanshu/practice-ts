/**
 * Solution — 16/04 A typed facade over an untyped dependency
 */

import { fetchAllFlags, fetchFlag, writeFlag } from "./vendor-flags";

export type RawFlag = {
  readonly key: string;
  readonly value: boolean;
  readonly updated_at: string;
};

export type Flag = {
  readonly key: string;
  readonly value: boolean;
  readonly updatedAt: string;
};

export type WriteResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: string };

export type VendorMethod = "fetchFlag" | "fetchAllFlags" | "writeFlag";

// The whole containment strategy is this return type. The vendor's `any` is
// assignable to `unknown` without a cast, and `unknown` is assignable to
// nothing without a check — so every caller below is forced to validate.
export function callVendor(
  method: VendorMethod,
  ...args: readonly unknown[]
): unknown {
  switch (method) {
    case "fetchFlag":
      return fetchFlag(args[0]);
    case "fetchAllFlags":
      return fetchAllFlags();
    case "writeFlag":
      return writeFlag(args[0], args[1]);
  }
}

export function isRawFlag(value: unknown): value is RawFlag {
  if (typeof value !== "object" || value === null) return false;

  // `"key" in value` narrows an `object` to one that has the property, so the
  // typeof checks below compile with no cast and no index signature.
  if (!("key" in value) || !("value" in value) || !("updated_at" in value)) {
    return false;
  }

  return (
    typeof value.key === "string" &&
    typeof value.value === "boolean" &&
    typeof value.updated_at === "string"
  );
}

/** `Array.isArray` is declared `arg is any[]`, which would put `any` back into
 *  the pipeline. This predicate says the same thing without it. */
function isUnknownArray(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}

/** The vendor's spelling stops here. Nothing above sees `updated_at`. */
function toFlag(raw: RawFlag): Flag {
  return { key: raw.key, value: raw.value, updatedAt: raw.updated_at };
}

export function getFlag(key: string): Flag | null {
  const raw = callVendor("fetchFlag", key);
  return isRawFlag(raw) ? toFlag(raw) : null;
}

export function listFlags(): readonly Flag[] {
  const raw = callVendor("fetchAllFlags");
  if (!isUnknownArray(raw)) return [];

  // `filter` with a type predicate narrows the element type, so `map` gets
  // RawFlag and never sees the junk.
  return raw.filter(isRawFlag).map(toFlag);
}

const UNEXPECTED: WriteResult = {
  ok: false,
  reason: "unexpected response from the vendor",
};

export function setFlag(key: string, value: boolean): WriteResult {
  const raw = callVendor("writeFlag", key, value);

  if (typeof raw !== "object" || raw === null || !("ok" in raw)) {
    // Covers the legacy endpoint's bare "accepted" string. An untyped
    // dependency can always return a shape you have never seen; the facade is
    // where that stops being everyone else's problem.
    return UNEXPECTED;
  }

  // `ok: 1` is not `true`. Translating the vendor's dialect into yours is the
  // other half of a facade's job.
  if (raw.ok === 1) return { ok: true };

  if (raw.ok === 0 && "error" in raw && typeof raw.error === "string") {
    return { ok: false, reason: raw.error };
  }

  return UNEXPECTED;
}
