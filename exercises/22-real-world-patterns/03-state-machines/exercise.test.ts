import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  IllegalTransitionError,
  TRANSITIONS,
  canTransition,
  describeState,
  isTerminal,
  replay,
  transition,
  type EventFor,
  type LegalEvents,
  type OrderEvent,
  type OrderState,
  type OrderStatus,
} from "./exercise";

type OrderOf<S extends OrderStatus> = Extract<OrderState, { status: S }>;

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _tableDraft = Expect<
  Equal<(typeof TRANSITIONS)["draft"], readonly ["submit", "cancel"]>
>;
type _tableShipped = Expect<
  Equal<(typeof TRANSITIONS)["shipped"], readonly ["deliver"]>
>;
type _tableDelivered = Expect<
  Equal<(typeof TRANSITIONS)["delivered"], readonly []>
>;

type _legalDraft = Expect<Equal<LegalEvents["draft"], "submit" | "cancel">>;
type _legalPaid = Expect<Equal<LegalEvents["paid"], "ship" | "cancel">>;
type _legalShipped = Expect<Equal<LegalEvents["shipped"], "deliver">>;
/** Terminal states admit no event at all, and `never` says exactly that. */
type _legalDelivered = Expect<Equal<LegalEvents["delivered"], never>>;
type _legalCancelled = Expect<Equal<LegalEvents["cancelled"], never>>;

type _eventForDraft = Expect<
  Equal<EventFor<"draft">, Extract<OrderEvent, { type: "submit" | "cancel" }>>
>;
type _eventForShipped = Expect<
  Equal<EventFor<"shipped">, Extract<OrderEvent, { type: "deliver" }>>
>;
type _eventForDelivered = Expect<Equal<EventFor<"delivered">, never>>;

declare const draft: OrderOf<"draft">;
declare const submitted: OrderOf<"submitted">;
declare const paid: OrderOf<"paid">;
declare const shipped: OrderOf<"shipped">;
declare const delivered: OrderOf<"delivered">;
declare const cancelled: OrderOf<"cancelled">;
declare function loadFromDatabase(): OrderState;

function _compileTimeOnly(): void {
  /* Every legal move compiles. */
  const next = transition(draft, { type: "submit", at: 1 });
  type _next = Expect<Equal<typeof next, OrderState>>;

  transition(draft, { type: "cancel", reason: "changed my mind" });
  transition(submitted, { type: "pay", paymentId: "pay_1" });
  transition(paid, { type: "ship", trackingId: "trk_1" });
  transition(paid, { type: "cancel", reason: "out of stock" });
  transition(shipped, { type: "deliver", at: 2 });

  /* Every illegal one does not. This is the exercise. */

  // @ts-expect-error — a draft has not been submitted, so it cannot be paid.
  transition(draft, { type: "pay", paymentId: "pay_1" });

  // @ts-expect-error — an unpaid order cannot ship.
  transition(submitted, { type: "ship", trackingId: "trk_1" });

  // @ts-expect-error — a shipped order can no longer be cancelled.
  transition(shipped, { type: "cancel", reason: "too late" });

  // @ts-expect-error — delivered is terminal.
  transition(delivered, { type: "ship", trackingId: "trk_2" });

  // @ts-expect-error — cancelled is terminal.
  transition(cancelled, { type: "submit", at: 3 });

  /* The data each state carries is the data it actually has. */

  const paymentId: string = paid.paymentId;
  const trackingId: string = shipped.trackingId;
  void paymentId, trackingId;

  // @ts-expect-error — a draft has no paymentId to read.
  void draft.paymentId;

  // @ts-expect-error — a cancelled order was never shipped.
  void cancelled.trackingId;

  // @ts-expect-error — a delivered order has no cancellation reason.
  void delivered.reason;

  // @ts-expect-error — states are read-only.
  draft.id = "o2";

  /* A state whose type has been widened — anything from a database — accepts
     every event at compile time, and is checked at runtime instead. */
  transition(loadFromDatabase(), { type: "cancel", reason: "any" });
}

/* ── Fixtures ───────────────────────────────────────────────────────────── */

const draftOrder = (): OrderOf<"draft"> => ({
  status: "draft",
  id: "o1",
  totalCents: 8999,
});

const submittedOrder = (): OrderOf<"submitted"> => ({
  status: "submitted",
  id: "o1",
  totalCents: 8999,
  submittedAt: 100,
});

const paidOrder = (): OrderOf<"paid"> => ({
  status: "paid",
  id: "o1",
  totalCents: 8999,
  submittedAt: 100,
  paymentId: "pay_1",
});

const shippedOrder = (): OrderOf<"shipped"> => ({
  status: "shipped",
  id: "o1",
  totalCents: 8999,
  submittedAt: 100,
  paymentId: "pay_1",
  trackingId: "trk_1",
});

const deliveredOrder = (): OrderOf<"delivered"> => ({
  status: "delivered",
  id: "o1",
  totalCents: 8999,
  submittedAt: 100,
  paymentId: "pay_1",
  trackingId: "trk_1",
  deliveredAt: 300,
});

const cancelledOrder = (): OrderOf<"cancelled"> => ({
  status: "cancelled",
  id: "o1",
  totalCents: 8999,
  reason: "out of stock",
});

/** Erases the precise member type, the way loading from a database would. */
const widen = (state: OrderState): OrderState => state;

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("TRANSITIONS", () => {
  it("is the single source of truth", () => {
    expect(TRANSITIONS).toEqual({
      draft: ["submit", "cancel"],
      submitted: ["pay", "cancel"],
      paid: ["ship", "cancel"],
      shipped: ["deliver"],
      delivered: [],
      cancelled: [],
    });
  });
});

describe("canTransition / isTerminal", () => {
  it("allows what the table allows", () => {
    expect(canTransition("draft", "submit")).toBe(true);
    expect(canTransition("draft", "cancel")).toBe(true);
    expect(canTransition("paid", "ship")).toBe(true);
    expect(canTransition("shipped", "deliver")).toBe(true);
  });

  it("refuses everything else", () => {
    expect(canTransition("draft", "pay")).toBe(false);
    expect(canTransition("submitted", "ship")).toBe(false);
    expect(canTransition("shipped", "cancel")).toBe(false);
    expect(canTransition("delivered", "deliver")).toBe(false);
    expect(canTransition("cancelled", "submit")).toBe(false);
  });

  it("knows the terminal states", () => {
    expect(isTerminal("delivered")).toBe(true);
    expect(isTerminal("cancelled")).toBe(true);
    expect(isTerminal("draft")).toBe(false);
    expect(isTerminal("shipped")).toBe(false);
  });
});

describe("transition", () => {
  it("submits a draft", () => {
    expect(transition(draftOrder(), { type: "submit", at: 100 })).toEqual({
      status: "submitted",
      id: "o1",
      totalCents: 8999,
      submittedAt: 100,
    });
  });

  it("pays a submitted order and keeps what came before", () => {
    expect(
      transition(submittedOrder(), { type: "pay", paymentId: "pay_1" }),
    ).toEqual({
      status: "paid",
      id: "o1",
      totalCents: 8999,
      submittedAt: 100,
      paymentId: "pay_1",
    });
  });

  it("ships a paid order", () => {
    expect(
      transition(paidOrder(), { type: "ship", trackingId: "trk_1" }),
    ).toEqual(shippedOrder());
  });

  it("delivers a shipped order", () => {
    expect(transition(shippedOrder(), { type: "deliver", at: 300 })).toEqual(
      deliveredOrder(),
    );
  });

  it("cancels from any pre-shipping state, dropping the shipping data", () => {
    expect(
      transition(draftOrder(), { type: "cancel", reason: "out of stock" }),
    ).toEqual(cancelledOrder());

    expect(
      transition(paidOrder(), { type: "cancel", reason: "out of stock" }),
    ).toEqual(cancelledOrder());
  });

  it("does not mutate the state it was given", () => {
    const before = draftOrder();
    transition(before, { type: "submit", at: 100 });
    expect(before).toEqual(draftOrder());
  });

  it("throws when a widened state meets an illegal event", () => {
    expect(() =>
      transition(widen(shippedOrder()), { type: "cancel", reason: "too late" }),
    ).toThrow(IllegalTransitionError);

    expect(() =>
      transition(widen(draftOrder()), { type: "pay", paymentId: "pay_1" }),
    ).toThrow("cannot pay an order that is draft");
  });

  it("reports the status and the event on the error", () => {
    try {
      transition(widen(deliveredOrder()), { type: "ship", trackingId: "x" });
      throw new Error("expected a rejection");
    } catch (error) {
      if (!(error instanceof IllegalTransitionError)) throw error;
      expect(error.status).toBe("delivered");
      expect(error.eventType).toBe("ship");
      expect(error.name).toBe("IllegalTransitionError");
    }
  });
});

describe("replay", () => {
  it("folds a full happy path", () => {
    const result = replay(widen(draftOrder()), [
      { type: "submit", at: 100 },
      { type: "pay", paymentId: "pay_1" },
      { type: "ship", trackingId: "trk_1" },
      { type: "deliver", at: 300 },
    ]);

    expect(result.state).toEqual(deliveredOrder());
    expect(result.applied).toHaveLength(4);
    expect(result.rejected).toEqual([]);
  });

  it("skips illegal events instead of throwing", () => {
    const result = replay(widen(draftOrder()), [
      { type: "pay", paymentId: "pay_0" },
      { type: "submit", at: 100 },
      { type: "submit", at: 101 },
      { type: "pay", paymentId: "pay_1" },
    ]);

    expect(result.state).toEqual(paidOrder());
    expect(result.applied).toEqual([
      { type: "submit", at: 100 },
      { type: "pay", paymentId: "pay_1" },
    ]);
    expect(result.rejected).toEqual([
      { type: "pay", paymentId: "pay_0" },
      { type: "submit", at: 101 },
    ]);
  });

  it("rejects everything once a terminal state is reached", () => {
    const result = replay(widen(cancelledOrder()), [
      { type: "submit", at: 1 },
      { type: "pay", paymentId: "pay_1" },
    ]);

    expect(result.state).toEqual(cancelledOrder());
    expect(result.applied).toEqual([]);
    expect(result.rejected).toHaveLength(2);
  });

  it("handles an empty log", () => {
    const result = replay(widen(draftOrder()), []);
    expect(result.state).toEqual(draftOrder());
    expect(result.applied).toEqual([]);
    expect(result.rejected).toEqual([]);
  });
});

describe("describeState", () => {
  const cases: [string, OrderState, string][] = [
    ["draft", draftOrder(), "draft order o1 for £89.99"],
    ["submitted", submittedOrder(), "order o1 submitted, awaiting payment"],
    ["paid", paidOrder(), "order o1 paid (pay_1)"],
    ["shipped", shippedOrder(), "order o1 shipped (trk_1)"],
    ["delivered", deliveredOrder(), "order o1 delivered"],
    ["cancelled", cancelledOrder(), "order o1 cancelled: out of stock"],
  ];

  it.each(cases)("describes %s", (_label, state, expected) => {
    expect(describeState(state)).toBe(expected);
  });
});
