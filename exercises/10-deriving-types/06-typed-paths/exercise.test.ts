import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  describeChange,
  getPath,
  type AppState,
  type ChangeEvent,
  type Paths,
  type ValueAt,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _changeEvent = Expect<
  Equal<
    ChangeEvent<AppState>,
    | { key: "count"; value: number }
    | { key: "darkMode"; value: boolean }
    | { key: "user"; value: AppState["user"] }
  >
>;

type _paths = Expect<
  Equal<
    Paths<AppState>,
    | "count"
    | "darkMode"
    | "user"
    | "user.name"
    | "user.email"
    | "user.address"
    | "user.address.city"
  >
>;

type _valueTop = Expect<Equal<ValueAt<AppState, "count">, number>>;
type _valueBool = Expect<Equal<ValueAt<AppState, "darkMode">, boolean>>;
type _valueObject = Expect<
  Equal<ValueAt<AppState, "user.address">, { city: string }>
>;
type _valueNested = Expect<Equal<ValueAt<AppState, "user.name">, string>>;
type _valueDeep = Expect<Equal<ValueAt<AppState, "user.address.city">, string>>;
type _valueMissing = Expect<Equal<ValueAt<AppState, "nope">, never>>;

/* ── Fixtures ───────────────────────────────────────────────────────────── */

const state: AppState = {
  count: 5,
  darkMode: true,
  user: {
    name: "Ada",
    email: "ada@example.com",
    address: { city: "London" },
  },
};

function _compileTimeOnly(): void {
  // The return type follows the path.
  const count = getPath(state, "count");
  type _count = Expect<Equal<typeof count, number>>;

  const city = getPath(state, "user.address.city");
  type _city = Expect<Equal<typeof city, string>>;

  const address = getPath(state, "user.address");
  type _address = Expect<Equal<typeof address, { city: string }>>;

  // @ts-expect-error — not a valid path.
  getPath(state, "user.nope");

  // @ts-expect-error — not a valid path.
  getPath(state, "nope");

  // @ts-expect-error — partial paths through a primitive are not valid either.
  getPath(state, "count.toFixed");
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("getPath", () => {
  it("reads top-level values", () => {
    expect(getPath(state, "count")).toBe(5);
    expect(getPath(state, "darkMode")).toBe(true);
  });

  it("reads nested values", () => {
    expect(getPath(state, "user.name")).toBe("Ada");
    expect(getPath(state, "user.email")).toBe("ada@example.com");
    expect(getPath(state, "user.address.city")).toBe("London");
  });

  it("reads whole objects", () => {
    expect(getPath(state, "user.address")).toEqual({ city: "London" });
    expect(getPath(state, "user")).toEqual(state.user);
  });

  it("does not mutate the subject", () => {
    getPath(state, "user.address.city");
    expect(state.user.address.city).toBe("London");
  });
});

describe("describeChange", () => {
  it("describes every event kind", () => {
    expect(describeChange({ key: "count", value: 5 })).toBe("count -> 5");
    expect(describeChange({ key: "darkMode", value: true })).toBe(
      "darkMode -> true",
    );
    expect(describeChange({ key: "darkMode", value: false })).toBe(
      "darkMode -> false",
    );
    expect(
      describeChange({ key: "user", value: state.user }),
    ).toBe("user -> Ada");
  });

  it("handles falsy values", () => {
    expect(describeChange({ key: "count", value: 0 })).toBe("count -> 0");
  });
});
