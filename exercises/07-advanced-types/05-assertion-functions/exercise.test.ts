import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  assertIsOrder,
  assertIsRecord,
  assertIsString,
  describeOrder,
  parseOrder,
  type Order,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _parseReturn = Expect<Equal<ReturnType<typeof parseOrder>, Order>>;

function _compileTimeOnly(value: unknown, other: unknown): void {
  // @ts-expect-error — `unknown` cannot be indexed before it is narrowed.
  value["id"];

  assertIsRecord(value);
  // The narrowing survives past the call — no `if` needed.
  type _record = Expect<Equal<typeof value, Record<string, unknown>>>;
  const id = value["id"];
  type _idIsUnknown = Expect<Equal<typeof id, unknown>>;

  assertIsString(other, "other");
  type _string = Expect<Equal<typeof other, string>>;
  other.toUpperCase();
}

function _orderNarrowing(value: unknown): void {
  assertIsOrder(value);
  type _order = Expect<Equal<typeof value, Order>>;
  const total: number = value.totalCents;
  void total;
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("assertIsRecord", () => {
  it("accepts plain objects", () => {
    expect(() => assertIsRecord({})).not.toThrow();
    expect(() => assertIsRecord({ a: 1 })).not.toThrow();
  });

  it("rejects arrays, null and primitives", () => {
    for (const bad of [null, [], [1], "x", 42, undefined]) {
      expect(() => assertIsRecord(bad)).toThrow(TypeError);
      expect(() => assertIsRecord(bad)).toThrow("expected an object");
    }
  });
});

describe("assertIsString", () => {
  it("accepts strings, including empty ones", () => {
    expect(() => assertIsString("", "field")).not.toThrow();
    expect(() => assertIsString("x", "field")).not.toThrow();
  });

  it("labels the failure", () => {
    expect(() => assertIsString(1, "id")).toThrow("id must be a string");
    expect(() => assertIsString(null, "name")).toThrow("name must be a string");
  });
});

describe("assertIsOrder", () => {
  const valid = { id: "a", totalCents: 1250, items: ["x", "y"] };

  it("accepts a valid order", () => {
    expect(() => assertIsOrder(valid)).not.toThrow();
    expect(() => assertIsOrder({ ...valid, items: [] })).not.toThrow();
    expect(() => assertIsOrder({ ...valid, totalCents: 0 })).not.toThrow();
  });

  it("reports failures in a predictable order", () => {
    expect(() => assertIsOrder([])).toThrow("expected an object");
    expect(() => assertIsOrder({ ...valid, id: 1 })).toThrow("id must be a string");
    expect(() => assertIsOrder({ ...valid, totalCents: -1 })).toThrow(
      "totalCents must be a non-negative integer",
    );
    expect(() => assertIsOrder({ ...valid, totalCents: 1.5 })).toThrow(
      "totalCents must be a non-negative integer",
    );
    expect(() => assertIsOrder({ ...valid, items: "x" })).toThrow(
      "items must be an array of strings",
    );
    expect(() => assertIsOrder({ ...valid, items: [1] })).toThrow(
      "items must be an array of strings",
    );
  });

  it("checks the object first", () => {
    // A non-object must report the object error, not a field error.
    expect(() => assertIsOrder("nope")).toThrow("expected an object");
  });
});

describe("parseOrder", () => {
  it("parses a valid order", () => {
    expect(parseOrder('{"id":"a","totalCents":1250,"items":["x"]}')).toEqual({
      id: "a",
      totalCents: 1250,
      items: ["x"],
    });
  });

  it("throws on malformed JSON", () => {
    expect(() => parseOrder("{bad")).toThrow("malformed JSON");
    expect(() => parseOrder("")).toThrow("malformed JSON");
  });

  it("throws on a bad shape", () => {
    expect(() => parseOrder('{"id":1}')).toThrow("id must be a string");
  });
});

describe("describeOrder", () => {
  it("describes a valid order", () => {
    expect(
      describeOrder('{"id":"a","totalCents":1250,"items":["x","y"]}'),
    ).toBe("Order a: 2 items, 12.50");
  });

  it("uses the singular for exactly one item", () => {
    expect(describeOrder('{"id":"b","totalCents":500,"items":["x"]}')).toBe(
      "Order b: 1 item, 5.00",
    );
  });

  it("handles zero items", () => {
    expect(describeOrder('{"id":"c","totalCents":0,"items":[]}')).toBe(
      "Order c: 0 items, 0.00",
    );
  });

  it("never throws — it reports instead", () => {
    expect(describeOrder("not json")).toBe("invalid order: malformed JSON");
    expect(describeOrder("[]")).toBe("invalid order: expected an object");
    expect(describeOrder('{"id":1,"totalCents":0,"items":[]}')).toBe(
      "invalid order: id must be a string",
    );
    expect(
      describeOrder('{"id":"a","totalCents":-1,"items":[]}'),
    ).toBe("invalid order: totalCents must be a non-negative integer");
    expect(describeOrder('{"id":"a","totalCents":1,"items":[1]}')).toBe(
      "invalid order: items must be an array of strings",
    );
  });
});
