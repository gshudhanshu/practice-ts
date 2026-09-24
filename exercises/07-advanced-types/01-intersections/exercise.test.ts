import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  InMemoryStore,
  copyKey,
  toClientUser,
  type ApiUser,
  type ClientUser,
  type Store,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

// The store combines all three capabilities.
type _storeKeys = Expect<Equal<keyof Store, "read" | "write" | "clear">>;
type _storeIsReadable = Expect<
  Store extends { read(key: string): string | undefined } ? true : false
>;

// ClientUser keeps every field but swaps the id's type.
type _clientId = Expect<Equal<ClientUser["id"], string>>;
type _clientName = Expect<Equal<ClientUser["name"], string>>;
type _clientEmail = Expect<Equal<ClientUser["email"], string>>;
type _apiIdUntouched = Expect<Equal<ApiUser["id"], number>>;

// An intersection of conflicting primitives collapses to `never`.
type Conflict = { value: string } & { value: number };
type _conflict = Expect<Equal<Conflict["value"], never>>;

function _compileTimeOnly(): void {
  const store: Store = new InMemoryStore();
  void store;

  // A store satisfies each capability on its own.
  copyKey(new InMemoryStore(), new InMemoryStore(), "k");

  // @ts-expect-error — a plain object missing `clear` is not a Store.
  const _partial: Store = {
    read: () => undefined,
    write: () => undefined,
  };

  // @ts-expect-error — the client id is a string, not a number.
  const _wrongId: ClientUser = { id: 1, name: "a", email: "b" };
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("InMemoryStore", () => {
  it("writes and reads", () => {
    const store = new InMemoryStore();
    store.write("a", "1");
    expect(store.read("a")).toBe("1");
  });

  it("returns undefined for a missing key", () => {
    expect(new InMemoryStore().read("nope")).toBeUndefined();
  });

  it("overwrites an existing key", () => {
    const store = new InMemoryStore();
    store.write("a", "1");
    store.write("a", "2");
    expect(store.read("a")).toBe("2");
  });

  it("clears everything", () => {
    const store = new InMemoryStore();
    store.write("a", "1");
    store.write("b", "2");
    store.clear();
    expect(store.read("a")).toBeUndefined();
    expect(store.read("b")).toBeUndefined();
  });
});

describe("copyKey", () => {
  it("copies an existing key and reports true", () => {
    const source = new InMemoryStore();
    const target = new InMemoryStore();
    source.write("greeting", "hello");

    expect(copyKey(source, target, "greeting")).toBe(true);
    expect(target.read("greeting")).toBe("hello");
  });

  it("reports false and writes nothing for a missing key", () => {
    const source = new InMemoryStore();
    const target = new InMemoryStore();

    expect(copyKey(source, target, "absent")).toBe(false);
    expect(target.read("absent")).toBeUndefined();
  });

  it("copies an empty string rather than treating it as missing", () => {
    const source = new InMemoryStore();
    const target = new InMemoryStore();
    source.write("blank", "");

    expect(copyKey(source, target, "blank")).toBe(true);
    expect(target.read("blank")).toBe("");
  });
});

describe("toClientUser", () => {
  it("stringifies the id and passes everything else through", () => {
    expect(toClientUser({ id: 42, name: "Ada", email: "ada@x.com" })).toEqual({
      id: "42",
      name: "Ada",
      email: "ada@x.com",
    });
  });

  it("handles a zero id", () => {
    expect(toClientUser({ id: 0, name: "Z", email: "z@x.com" }).id).toBe("0");
  });
});
