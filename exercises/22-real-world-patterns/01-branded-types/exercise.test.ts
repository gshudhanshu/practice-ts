import { describe, expect, it } from "vitest";
import type {
  Equal,
  Expect,
  ExpectFalse,
  Extends,
} from "../../../src/type-testing";
import {
  addCents,
  assign,
  describeAssignment,
  formatCents,
  isOrderId,
  toCents,
  toOrderId,
  toUserId,
  type Assignment,
  type Cents,
  type OrderId,
  type UserId,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

/** A branded string is still a string… */
type _userIdIsString = Expect<Extends<UserId, string>>;
type _centsIsNumber = Expect<Extends<Cents, number>>;

/** …but a string is not a UserId. That asymmetry is the whole pattern. */
type _stringIsNotUserId = ExpectFalse<Extends<string, UserId>>;
type _numberIsNotCents = ExpectFalse<Extends<number, Cents>>;

/** And two brands over the same primitive never mix. */
type _userIsNotOrder = ExpectFalse<Extends<UserId, OrderId>>;
type _orderIsNotUser = ExpectFalse<Extends<OrderId, UserId>>;

type _toUserId = Expect<Equal<ReturnType<typeof toUserId>, UserId>>;
type _toOrderId = Expect<Equal<ReturnType<typeof toOrderId>, OrderId | null>>;
type _toCents = Expect<Equal<ReturnType<typeof toCents>, Cents>>;
type _addCents = Expect<Equal<ReturnType<typeof addCents>, Cents>>;
type _assign = Expect<Equal<ReturnType<typeof assign>, Assignment>>;

declare const userId: UserId;
declare const orderId: OrderId;
declare const cents: Cents;

function _compileTimeOnly(): void {
  // The point of the exercise: these arguments can no longer be shuffled.
  assign(userId, orderId, cents);

  // @ts-expect-error — the ids are the wrong way round.
  assign(orderId, userId, cents);

  // @ts-expect-error — a raw string is not a UserId.
  assign("usr_ada", orderId, cents);

  // @ts-expect-error — a raw number is not Cents.
  assign(userId, orderId, 8999);

  // @ts-expect-error — arithmetic produces a plain number; the brand is gone.
  const summed: Cents = cents + cents;
  void summed;

  // @ts-expect-error — and so does any other numeric operation.
  formatCents(Math.round(cents * 1.2));

  // A branded string keeps every string method.
  const shouted: string = userId.toUpperCase();
  const length: number = userId.length;
  void shouted, length;

  // A branded number keeps every number method.
  const fixed: string = cents.toFixed(0);
  void fixed;

  // The predicate brands by narrowing — no cast at the call site.
  const raw = "ord_42";
  if (isOrderId(raw)) {
    const narrowed: OrderId = raw;
    void narrowed;
  }

  const assignment = assign(userId, orderId, cents);
  // @ts-expect-error — an Assignment is read-only.
  assignment.userId = userId;
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("toUserId", () => {
  it("returns the string unchanged", () => {
    expect(toUserId("usr_ada")).toBe("usr_ada");
    expect(toUserId("usr_42")).toBe("usr_42");
  });

  it.each(["", "ada", "usr_", "USR_ada", "usr_Ada", " usr_ada", "usr_ada "])(
    "rejects %j",
    (raw) => {
      expect(() => toUserId(raw)).toThrow(TypeError);
      expect(() => toUserId(raw)).toThrow(`invalid UserId: ${raw}`);
    },
  );
});

describe("isOrderId / toOrderId", () => {
  it("recognises a valid order id", () => {
    expect(isOrderId("ord_42")).toBe(true);
    expect(isOrderId("ord_")).toBe(false);
    expect(isOrderId("ord_abc")).toBe(false);
    expect(isOrderId("usr_42")).toBe(false);
  });

  it("returns null instead of throwing", () => {
    expect(toOrderId("ord_42")).toBe("ord_42");
    expect(toOrderId("nope")).toBeNull();
  });
});

describe("toCents", () => {
  it("accepts non-negative integers", () => {
    expect(toCents(0)).toBe(0);
    expect(toCents(8999)).toBe(8999);
  });

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects %p",
    (value) => {
      expect(() => toCents(value)).toThrow(TypeError);
      expect(() => toCents(value)).toThrow(`invalid Cents: ${value}`);
    },
  );
});

describe("addCents", () => {
  it("adds and re-brands", () => {
    expect(addCents(toCents(100), toCents(250))).toBe(350);
    expect(addCents(toCents(0), toCents(0))).toBe(0);
  });
});

describe("formatCents", () => {
  it.each([
    [0, "£0.00"],
    [5, "£0.05"],
    [50, "£0.50"],
    [8999, "£89.99"],
    [10000, "£100.00"],
  ])("formats %i as %s", (value, expected) => {
    expect(formatCents(toCents(value))).toBe(expected);
  });
});

describe("assign / describeAssignment", () => {
  const orderIdOrThrow = (raw: string): OrderId => {
    const id = toOrderId(raw);
    if (id === null) throw new Error(`bad fixture: ${raw}`);
    return id;
  };

  const build = (): Assignment =>
    assign(toUserId("usr_ada"), orderIdOrThrow("ord_42"), toCents(8999));

  it("keeps the three fields", () => {
    expect(build()).toEqual({
      userId: "usr_ada",
      orderId: "ord_42",
      totalCents: 8999,
    });
  });

  it("describes it in one line", () => {
    expect(describeAssignment(build())).toBe(
      "usr_ada owes £89.99 for ord_42",
    );
  });
});

describe("the brand is a compile-time fiction", () => {
  it("has no runtime footprint at all", () => {
    const id = toUserId("usr_ada");

    expect(typeof id).toBe("string");
    expect(Object.prototype.hasOwnProperty.call(id, "__brand")).toBe(false);
    expect(JSON.stringify({ id })).toBe('{"id":"usr_ada"}');
    expect(toCents(8999) + 1).toBe(9000);
  });
});
