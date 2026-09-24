import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import { loadRecord, searchRecords, type StoredRecord } from "./legacy-store";
import {
  loadRecordAsync,
  promisify1,
  readRecord,
  settle,
  type NodeCallback,
  type Settled,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _callback = Expect<
  Equal<NodeCallback<number>, (error: Error | null, value?: number) => void>
>;

function _inference(): void {
  // Both type parameters come from the argument — no explicit type arguments.
  const search = promisify1(searchRecords);
  const found = search("in");
  type _found = Expect<Equal<typeof found, Promise<readonly StoredRecord[]>>>;

  const loaded = loadRecordAsync("r1");
  type _loaded = Expect<Equal<typeof loaded, Promise<StoredRecord>>>;

  // The overloads: the return type depends on whether a callback was passed.
  const promised = readRecord("r1");
  type _promised = Expect<Equal<typeof promised, Promise<StoredRecord>>>;

  const nothing = readRecord("r1", () => {});
  type _nothing = Expect<Equal<typeof nothing, void>>;
}

function _narrowing(result: Settled<number>): void {
  if (result.ok) {
    const value = result.value;
    type _value = Expect<Equal<typeof value, number>>;
    return;
  }

  const error = result.error;
  type _error = Expect<Equal<typeof error, string>>;
}

function _compileTimeOnly(result: Settled<number>): void {
  // @ts-expect-error — the union must be discriminated, not a bag of optionals.
  result.value;

  // @ts-expect-error — the id is a string.
  loadRecordAsync(1);

  // @ts-expect-error — a callback-style call returns void, not a promise.
  readRecord("r1", () => {}).then(() => {});
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("promisify1", () => {
  it("resolves with the callback's value", async () => {
    const search = promisify1(searchRecords);

    await expect(search("in")).resolves.toEqual([
      { id: "r1", name: "Invoices", version: 3 },
      { id: "r3", name: "Inventory", version: 7 },
    ]);
  });

  it("resolves with an empty result rather than rejecting", async () => {
    const search = promisify1(searchRecords);

    await expect(search("zzz")).resolves.toEqual([]);
  });

  it("rejects with the callback's error", async () => {
    const search = promisify1(searchRecords);

    await expect(search("")).rejects.toThrow("term must not be empty");
  });

  it("rejects when the callback produces neither", async () => {
    const load = promisify1(loadRecord);

    await expect(load("ghost")).rejects.toThrow(
      "the callback produced neither an error nor a value",
    );
    await expect(load("ghost")).rejects.toBeInstanceOf(TypeError);
  });
});

describe("loadRecordAsync", () => {
  it("resolves a known record", async () => {
    await expect(loadRecordAsync("r2")).resolves.toEqual({
      id: "r2",
      name: "Contacts",
      version: 1,
    });
  });

  it("rejects the store's own error", async () => {
    await expect(loadRecordAsync("boom")).rejects.toThrow("store offline");
  });

  it("rejects the missing record", async () => {
    await expect(loadRecordAsync("ghost")).rejects.toThrow(
      "the callback produced neither an error nor a value",
    );
  });
});

describe("readRecord", () => {
  it("returns a promise when called without a callback", async () => {
    await expect(readRecord("r1")).resolves.toEqual({
      id: "r1",
      name: "Invoices",
      version: 3,
    });
  });

  it("calls back when called with a callback", async () => {
    const result = await new Promise<StoredRecord | undefined>(
      (resolve, reject) => {
        readRecord("r3", (error, record) => {
          if (error !== null) {
            reject(error);
            return;
          }
          resolve(record);
        });
      },
    );

    expect(result).toEqual({ id: "r3", name: "Inventory", version: 7 });
  });

  it("reports errors through the callback", async () => {
    const error = await new Promise<Error | null>((resolve) => {
      readRecord("boom", (err) => {
        resolve(err);
      });
    });

    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe("store offline");
  });
});

describe("settle", () => {
  it("wraps a resolved promise", async () => {
    await expect(settle(loadRecordAsync("r1"))).resolves.toEqual({
      ok: true,
      value: { id: "r1", name: "Invoices", version: 3 },
    });
  });

  it("wraps a rejection as a message", async () => {
    await expect(settle(loadRecordAsync("boom"))).resolves.toEqual({
      ok: false,
      error: "store offline",
    });
  });

  it("stringifies a non-Error rejection", async () => {
    await expect(settle(Promise.reject("socket hang up"))).resolves.toEqual({
      ok: false,
      error: "socket hang up",
    });
  });

  it("never rejects", async () => {
    await expect(settle(loadRecordAsync("ghost"))).resolves.toEqual({
      ok: false,
      error: "the callback produced neither an error nor a value",
    });
  });
});
