/**
 * Exercise 16/04 — CHALLENGE: a typed facade over an untyped dependency
 *
 * `any` is not a type. It is a request that the compiler stop working, and it
 * spreads: every value derived from an `any` is an `any`, silently, until it
 * reaches a call site three modules away and produces `undefined is not a
 * function`.
 *
 * You cannot delete the `any` — it belongs to a dependency you do not own. What
 * you CAN do is decide where it stops. That is a facade:
 *
 *   1. ONE function calls the vendor and immediately widens `any` to `unknown`.
 *   2. Validators turn `unknown` into your own types.
 *   3. Everything above sees only your types, and the vendor's names, casing
 *      and quirks never leak into the rest of the application.
 *
 * Same containment idea as `safeJsonParse` in 02/06 — `JSON.parse` returns
 * `any`, and the fix is not to trust it more carefully but to narrow it once,
 * where it enters.
 *
 * `vendor-flags.ts` is the dependency. Read it first — its list endpoint
 * returns junk mixed in with real records, and its write endpoint reports
 * success as the number 1.
 *
 * Read README.md first. Replace every TODO.
 */

import { fetchAllFlags, fetchFlag, writeFlag } from "./vendor-flags";

/** The vendor's wire shape: snake_case, exactly as it comes back. */
export type RawFlag = {
  readonly key: string;
  readonly value: boolean;
  readonly updated_at: string;
};

/** Your domain shape. Note the casing: the vendor's spelling stops here too. */
export type Flag = {
  readonly key: string;
  readonly value: boolean;
  readonly updatedAt: string;
};

export type WriteResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: string };

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// The boundary. This is the only function in the file allowed to touch the
// vendor, and its return type is `unknown` — which is what stops `any` from
// travelling any further.
//
//   callVendor("fetchFlag", "checkout.v2")
//   callVendor("fetchAllFlags")
//   callVendor("writeFlag", "checkout.v2", false)
//
// Widening `any` to `unknown` needs no cast: it is an ordinary assignment.
export type VendorMethod = "fetchFlag" | "fetchAllFlags" | "writeFlag";

export function callVendor(
  method: VendorMethod,
  ...args: readonly unknown[]
): unknown {
  throw new Error("TODO 1: implement callVendor");
}

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// The gate. A type predicate (02/06, 07/05) that accepts only a complete
// record: `key` a string, `value` a real boolean, `updated_at` a string.
//
// `{ key: "legacy.mode" }`, `"beta.banner"`, `null` and `[]` are all rejected.
export function isRawFlag(value: unknown): value is RawFlag {
  throw new Error("TODO 2: implement isRawFlag");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// One flag, translated into your domain. `null` when the vendor has no such
// flag, and also when what came back does not survive `isRawFlag`.
//
// Give it a real return type — `unknown` is the boundary's job, not the
// facade's.
export function getFlag(key: string): unknown {
  throw new Error("TODO 3: implement getFlag");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// All the valid flags, in the order the vendor returned them, junk dropped.
// If the vendor does not even return an array, the answer is an empty one —
// a facade reports "nothing", not "something weird".
export function listFlags(): unknown {
  throw new Error("TODO 4: implement listFlags");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// The write path, normalised.
//
//   { ok: 1 }                          -> { ok: true }
//   { ok: 0, error: "unknown flag" }   -> { ok: false, reason: "unknown flag" }
//   anything else                      -> { ok: false, reason: "unexpected response from the vendor" }
//
// `ok: 1` is not `true`, and the last line is the one people forget: an
// untyped dependency can return a shape you have never seen, and the facade has
// to have an answer for that too.
export function setFlag(key: string, value: boolean): WriteResult {
  throw new Error("TODO 5: implement setFlag");
}
