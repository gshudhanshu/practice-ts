import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  maxOf,
  mergeUnique,
  sum,
  updateCity,
  withName,
  type State,
  type User,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _sumParams = Expect<Equal<Parameters<typeof sum>, number[]>>;
type _mergeParams = Expect<
  Equal<Parameters<typeof mergeUnique>, (readonly string[])[]>
>;
type _maxReturn = Expect<Equal<ReturnType<typeof maxOf>, number | undefined>>;

/* ── Fixtures ───────────────────────────────────────────────────────────── */

const user: User = {
  name: "Ada",
  email: "ada@example.com",
  tags: ["admin"],
};

const state: State = {
  user: {
    name: "Ada",
    address: { city: "London", country: "UK" },
  },
  version: 1,
};

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("sum", () => {
  it("adds its arguments", () => {
    expect(sum(1, 2, 3)).toBe(6);
    expect(sum(5)).toBe(5);
  });
  it("is 0 with no arguments", () => {
    expect(sum()).toBe(0);
  });
});

describe("mergeUnique", () => {
  it("merges and dedupes, keeping first-seen order", () => {
    expect(mergeUnique(["a", "b"], ["b", "c"], ["a"])).toEqual(["a", "b", "c"]);
    expect(mergeUnique(["z"], ["y"])).toEqual(["z", "y"]);
  });
  it("handles empties", () => {
    expect(mergeUnique()).toEqual([]);
    expect(mergeUnique([], [])).toEqual([]);
  });
  it("accepts readonly arrays", () => {
    const frozen: readonly string[] = ["a", "a", "b"];
    expect(mergeUnique(frozen)).toEqual(["a", "b"]);
  });
});

describe("withName", () => {
  it("returns a copy with the new name", () => {
    const renamed = withName(user, "Grace");
    expect(renamed).toEqual({
      name: "Grace",
      email: "ada@example.com",
      tags: ["admin"],
    });
  });

  it("does not mutate the original", () => {
    withName(user, "Grace");
    expect(user.name).toBe("Ada");
  });

  it("returns a new object", () => {
    expect(withName(user, "Grace")).not.toBe(user);
  });
});

describe("maxOf", () => {
  it("finds the maximum", () => {
    expect(maxOf([3, 9, 2])).toBe(9);
    expect(maxOf([-5, -1])).toBe(-1);
    expect(maxOf([7])).toBe(7);
  });
  it("returns undefined for an empty list, not -Infinity", () => {
    expect(maxOf([])).toBeUndefined();
  });
});

describe("updateCity", () => {
  it("changes the city and bumps the version", () => {
    const next = updateCity(state, "Paris");
    expect(next.user.address.city).toBe("Paris");
    expect(next.user.address.country).toBe("UK");
    expect(next.user.name).toBe("Ada");
    expect(next.version).toBe(2);
  });

  it("leaves the original state completely untouched", () => {
    updateCity(state, "Paris");
    expect(state.user.address.city).toBe("London");
    expect(state.version).toBe(1);
  });

  it("creates new objects all the way down the changed path", () => {
    const next = updateCity(state, "Paris");
    expect(next).not.toBe(state);
    expect(next.user).not.toBe(state.user);
    expect(next.user.address).not.toBe(state.user.address);
  });
});
