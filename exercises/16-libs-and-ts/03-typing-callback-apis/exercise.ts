/**
 * Exercise 16/03 — wrapping a callback API in a typed facade
 *
 * Half the JavaScript in the world still hands you an error-first callback.
 * The signature everyone writes is:
 *
 *   (error: Error | null, value?: T) => void
 *
 * and it is a bad type — not because it is wrong, but because it permits four
 * combinations while the API produces two. `error` and `value` are correlated
 * and the type cannot say so, so every caller writes the same defensive dance.
 *
 * The fix is not a cleverer callback type. It is a BOUNDARY: wrap the callback
 * API once, in a promise-returning facade that turns "either/or" back into a
 * shape the type system can prove — exactly what 02/06 did for `JSON.parse`.
 *
 * `legacy-store.ts` in this directory is the callback API. Read it first: one
 * of its calls back with neither an error nor a value.
 *
 * Read README.md first. Replace every TODO.
 */

import {
  loadRecord,
  type StoredRecord,
} from "./legacy-store";

export type { StoredRecord };

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// The error-first callback type, generic in its value.
//
//   NodeCallback<number> === (error: Error | null, value?: number) => void
export type NodeCallback<T> = never;

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// The generic bridge. Take a one-argument callback function and return the same
// operation as a promise.
//
//   const load = promisify1(loadRecord);   // (id: string) => Promise<StoredRecord>
//
// Three cases to resolve, and the third is the one the callback type could not
// express:
//   error   -> reject with that error
//   value   -> resolve with it
//   neither -> reject with
//              new TypeError("the callback produced neither an error nor a value")
//
// No casts. The type parameters must be inferred at the call site.
export function promisify1<Arg, Value>(
  operation: (arg: Arg, done: NodeCallback<Value>) => void,
): (arg: Arg) => Promise<Value> {
  throw new Error("TODO 2: implement promisify1");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// The typed facade for one operation. Build it with promisify1 — do not write
// a second `new Promise` by hand.
export const loadRecordAsync: (id: string) => Promise<StoredRecord> = () => {
  throw new Error("TODO 3: implement loadRecordAsync");
};

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// The dual API Node itself shipped for a decade: call it with a callback and it
// calls you back, call it without and you get a promise.
//
//   readRecord("r1")            -> Promise<StoredRecord>
//   readRecord("r1", callback)  -> void, and `callback` is called
//
// This needs OVERLOADS (07/03): one return type cannot depend on whether an
// optional argument was passed. Write the two overload signatures, then one
// implementation signature that satisfies both.
export function readRecord(id: string, done?: NodeCallback<StoredRecord>): unknown {
  throw new Error("TODO 4: implement readRecord");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// The other way to model "either/or": a discriminated union instead of a
// rejection (02/04, 02/06). Never rejects, never throws.
//
//   await settle(loadRecordAsync("r1"))    -> { ok: true, value: {…} }
//   await settle(loadRecordAsync("boom"))  -> { ok: false, error: "store offline" }
//
// A non-Error thrown value becomes `String(value)`.
export type Settled<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: string };

export function settle<T>(promise: Promise<T>): Promise<Settled<T>> {
  throw new Error("TODO 5: implement settle");
}
