/**
 * Solution — 16/03 Typing callback APIs
 */

import { loadRecord, type StoredRecord } from "./legacy-store";

export type { StoredRecord };

// The conventional error-first shape. Note what it CANNOT say: that `value` is
// present exactly when `error` is null. Four combinations are representable;
// two are real.
export type NodeCallback<T> = (error: Error | null, value?: T) => void;

export function promisify1<Arg, Value>(
  operation: (arg: Arg, done: NodeCallback<Value>) => void,
): (arg: Arg) => Promise<Value> {
  return (arg) =>
    new Promise<Value>((resolve, reject) => {
      operation(arg, (error, value) => {
        if (error !== null) {
          reject(error);
          return;
        }

        // The case the callback type allowed and the API really does produce.
        // Turning it into a rejection is what lets every caller above this
        // line stop checking: `Promise<Value>` means a Value.
        if (value === undefined) {
          reject(
            new TypeError(
              "the callback produced neither an error nor a value",
            ),
          );
          return;
        }

        resolve(value);
      });
    });
}

export const loadRecordAsync: (id: string) => Promise<StoredRecord> =
  promisify1(loadRecord);

// Overload signatures: two shapes, chosen by arity. First match wins, so the
// specific (no callback) one goes first.
export function readRecord(id: string): Promise<StoredRecord>;
export function readRecord(id: string, done: NodeCallback<StoredRecord>): void;
// The implementation signature is not callable from outside — it only has to
// be compatible with both overloads above.
export function readRecord(
  id: string,
  done?: NodeCallback<StoredRecord>,
): Promise<StoredRecord> | void {
  if (done === undefined) {
    return loadRecordAsync(id);
  }

  loadRecord(id, done);
}

export type Settled<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: string };

export async function settle<T>(promise: Promise<T>): Promise<Settled<T>> {
  try {
    return { ok: true, value: await promise };
  } catch (error) {
    // `useUnknownInCatchVariables` — a thrown value can be anything at all.
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: message };
  }
}
