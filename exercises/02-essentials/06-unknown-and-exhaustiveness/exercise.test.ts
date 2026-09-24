import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  assertNever,
  describeEvent,
  isRecord,
  parseUser,
  safeJsonParse,
  type AppEvent,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

// safeJsonParse must return `unknown`, never `any`.
type _parseReturnsUnknown = Expect<
  Equal<ReturnType<typeof safeJsonParse>, unknown>
>;

// assertNever must accept only `never`, and must be typed as never-returning.
//
// The whole signature is compared in one go on purpose: `ReturnType<>` is
// useless here. `ReturnType<T> = T extends (...args: any) => infer R ? R : any`
// and `any` is NOT assignable to a `never` parameter, so the conditional fails
// and silently falls back to `any`. See EXPLANATION.md.
type _assertNeverSignature = Expect<
  Equal<typeof assertNever, (value: never) => never>
>;

function _compileTimeOnly(): void {
  const parsed = safeJsonParse("{}");

  // @ts-expect-error — `unknown` cannot be used before it is narrowed.
  parsed.anything;

  // isRecord must be a type predicate that unlocks property access.
  if (isRecord(parsed)) {
    type _narrowed = Expect<Equal<typeof parsed, Record<string, unknown>>>;
    // Reading a key is now legal, and yields `unknown`.
    type _value = Expect<Equal<(typeof parsed)["id"], unknown>>;
  }

  const event = { type: "click", x: 1, y: 2 } as AppEvent;
  switch (event.type) {
    case "click": {
      // Narrowing applies in VALUE position, so read the property into a local
      // first. `typeof event.x` in type position would use the declared type.
      const x = event.x;
      type _isClick = Expect<Equal<typeof x, number>>;
      break;
    }
  }
}

// Kept in its own function on purpose: a call to a `never`-returning function
// makes every statement after it unreachable, and narrowing is not computed in
// unreachable code. That would silently disable the assertions above it.
function _neverProbe(): void {
  // @ts-expect-error — a string is not `never`.
  assertNever("not never");
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("safeJsonParse", () => {
  it("parses valid JSON", () => {
    expect(safeJsonParse('{"a":1}')).toEqual({ a: 1 });
    expect(safeJsonParse("[1,2]")).toEqual([1, 2]);
    expect(safeJsonParse('"hi"')).toBe("hi");
  });

  it("returns undefined for invalid JSON", () => {
    expect(safeJsonParse("{bad")).toBeUndefined();
    expect(safeJsonParse("")).toBeUndefined();
  });
});

describe("isRecord", () => {
  it("accepts plain objects", () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord({ a: 1 })).toBe(true);
  });

  it("rejects null, arrays and primitives", () => {
    expect(isRecord(null)).toBe(false);
    expect(isRecord([])).toBe(false);
    expect(isRecord([1, 2])).toBe(false);
    expect(isRecord("x")).toBe(false);
    expect(isRecord(42)).toBe(false);
    expect(isRecord(undefined)).toBe(false);
  });
});

describe("parseUser", () => {
  it("accepts a valid user without age", () => {
    const result = parseUser({ id: "1", name: "Ada", email: "ada@x.com" });
    expect(result).toEqual({ id: "1", name: "Ada", email: "ada@x.com" });
    expect(result).not.toHaveProperty("age");
  });

  it("accepts a valid user with age", () => {
    expect(parseUser({ id: "1", name: "Ada", email: "ada@x.com", age: 36 })).toEqual(
      { id: "1", name: "Ada", email: "ada@x.com", age: 36 },
    );
  });

  it("ignores unknown extra properties", () => {
    const result = parseUser({
      id: "1",
      name: "Ada",
      email: "ada@x.com",
      isAdmin: true,
    });
    expect(result).toEqual({ id: "1", name: "Ada", email: "ada@x.com" });
  });

  it("rejects missing or mistyped fields", () => {
    expect(parseUser({ id: "1", name: "Ada" })).toBeNull();
    expect(parseUser({ id: 1, name: "Ada", email: "a@x.com" })).toBeNull();
    expect(parseUser({ id: "1", name: "Ada", email: "a@x.com", age: "36" })).toBeNull();
  });

  it("rejects non-objects", () => {
    expect(parseUser(null)).toBeNull();
    expect(parseUser("nope")).toBeNull();
    expect(parseUser([])).toBeNull();
    expect(parseUser(undefined)).toBeNull();
  });
});

describe("describeEvent", () => {
  it("describes every event type", () => {
    expect(describeEvent({ type: "click", x: 3, y: 4 })).toBe("click at (3, 4)");
    expect(describeEvent({ type: "keypress", key: "Enter" })).toBe("key: Enter");
    expect(describeEvent({ type: "scroll", delta: 100 })).toBe("scroll by 100");
  });
});

describe("assertNever", () => {
  it("throws when reached at runtime", () => {
    // Casting through unknown is the only way to reach it — which is the point.
    expect(() => assertNever("surprise" as unknown as never)).toThrow();
  });
});
