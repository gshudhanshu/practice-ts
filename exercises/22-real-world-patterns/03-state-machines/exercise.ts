/**
 * Exercise 22/03 — state machines that will not compile in the wrong state
 *
 * Most "state" in an application is a bag of optional fields:
 *
 *   type Order = {
 *     status: string;
 *     submittedAt?: number;
 *     paymentId?: string;
 *     trackingId?: string;
 *     cancelReason?: string;
 *   };
 *
 * Every combination of those is representable, including "delivered but never
 * paid" and "cancelled with a tracking number". So every function that touches
 * an order defends itself, and the bugs live in the gaps between the guards.
 *
 * A discriminated union (02/04) makes the illegal combinations unrepresentable:
 * `paymentId` exists on `paid` and later, and nowhere else. There is no
 * `if (order.paymentId)` to forget, because on a `draft` the property does not
 * exist to check.
 *
 * This exercise adds the second half: illegal TRANSITIONS become compile
 * errors as well. `transition(draftOrder, { type: "pay", … })` will not build.
 *
 * Read README.md first. Replace every TODO.
 */

export type OrderStatus =
  | "draft"
  | "submitted"
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled";

/**
 * Each state carries EXACTLY the data that is known in it. Note what is
 * impossible: a `draft` with a `paymentId`, a `delivered` with no `trackingId`,
 * a `cancelled` that also claims to be shipped.
 */
export type OrderState =
  | {
      readonly status: "draft";
      readonly id: string;
      readonly totalCents: number;
    }
  | {
      readonly status: "submitted";
      readonly id: string;
      readonly totalCents: number;
      readonly submittedAt: number;
    }
  | {
      readonly status: "paid";
      readonly id: string;
      readonly totalCents: number;
      readonly submittedAt: number;
      readonly paymentId: string;
    }
  | {
      readonly status: "shipped";
      readonly id: string;
      readonly totalCents: number;
      readonly submittedAt: number;
      readonly paymentId: string;
      readonly trackingId: string;
    }
  | {
      readonly status: "delivered";
      readonly id: string;
      readonly totalCents: number;
      readonly submittedAt: number;
      readonly paymentId: string;
      readonly trackingId: string;
      readonly deliveredAt: number;
    }
  | {
      readonly status: "cancelled";
      readonly id: string;
      readonly totalCents: number;
      readonly reason: string;
    };

export type OrderEvent =
  | { readonly type: "submit"; readonly at: number }
  | { readonly type: "pay"; readonly paymentId: string }
  | { readonly type: "ship"; readonly trackingId: string }
  | { readonly type: "deliver"; readonly at: number }
  | { readonly type: "cancel"; readonly reason: string };

/** From 02/06. Given, so you apply it rather than rewrite it. */
export function assertNever(value: never): never {
  throw new Error(`unreachable state: ${JSON.stringify(value)}`);
}

export class IllegalTransitionError extends Error {
  constructor(
    readonly status: OrderStatus,
    readonly eventType: OrderEvent["type"],
  ) {
    super(`cannot ${eventType} an order that is ${status}`);
    this.name = "IllegalTransitionError";
  }
}

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// ONE table, driving both the runtime checks and the compile-time ones.
//
//   TRANSITIONS   a const object: status -> the event types legal in it.
//                 draft: submit, cancel · submitted: pay, cancel
//                 paid: ship, cancel    · shipped: deliver
//                 delivered and cancelled are TERMINAL — no events at all.
//
//                 Write it `as const satisfies Record<OrderStatus,
//                 readonly OrderEvent["type"][]>` (07/04) so the literal types
//                 survive AND a typo is caught.
//
//   LegalEvents   derived from the table with a mapped type (10/03) and
//                 `[number]` (10/02): { draft: "submit" | "cancel", … }.
//                 Deriving it means the table and the type cannot drift.
//
//   EventFor<S>   the EVENTS themselves, not their names:
//                 EventFor<"draft"> is
//                   { type: "submit"; at: number } | { type: "cancel"; reason: string }
//                 EventFor<"delivered"> is `never`.
export const TRANSITIONS = {};

export type LegalEvents = Record<OrderStatus, OrderEvent["type"]>;

export type EventFor<S extends OrderStatus> = OrderEvent;

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// The runtime half of the same question, for data that arrives at runtime and
// therefore has no useful static type.
//
//   canTransition("draft", "pay")   ->  false
//   isTerminal("delivered")         ->  true
//
// Both read TRANSITIONS. Do not write a second copy of the rules.
//
// Note: `TRANSITIONS[status].includes(eventType)` will NOT compile — the tuple
// is narrower than the full event union. Widen it first; see hint 2.
export function canTransition(
  status: OrderStatus,
  eventType: OrderEvent["type"],
): boolean {
  throw new Error("TODO 2: implement canTransition");
}

export function isTerminal(status: OrderStatus): boolean {
  throw new Error("TODO 2: implement isTerminal");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// The machine.
//
//   draft     + submit  -> submitted (submittedAt = event.at)
//   draft     + cancel  -> cancelled (reason)
//   submitted + pay     -> paid      (paymentId)
//   submitted + cancel  -> cancelled
//   paid      + ship    -> shipped   (trackingId)
//   paid      + cancel  -> cancelled
//   shipped   + deliver -> delivered (deliveredAt = event.at)
//
// The signature is what makes an illegal pair a COMPILE error: the event
// parameter's type is computed from the state's own status.
//
// Inside, widen both back to the plain unions and write an exhaustive switch
// on `status` with `assertNever` in the default — so that adding a seventh
// status tomorrow is a compile error here rather than a silent fallthrough.
//
// A pair that is illegal at RUNTIME (possible whenever the state was widened
// to `OrderState`, as it is for anything loaded from a database) throws
// `IllegalTransitionError`.
export function transition<S extends OrderState>(
  state: S,
  event: EventFor<S["status"]>,
): OrderState {
  throw new Error("TODO 3: implement transition");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Fold a stream of events over a starting state — an event log, replayed.
//
//   - a legal event is applied, and recorded in `applied`
//   - an illegal one is SKIPPED and recorded in `rejected`; replay never throws
//   - `state` is whatever the order ended up as
//
// Use canTransition to decide. Catching IllegalTransitionError would work too,
// and is worse: exceptions are for the unexpected, and this is expected.
export type ReplayResult = {
  readonly state: OrderState;
  readonly applied: readonly OrderEvent[];
  readonly rejected: readonly OrderEvent[];
};

export function replay(
  initial: OrderState,
  events: readonly OrderEvent[],
): ReplayResult {
  throw new Error("TODO 4: implement replay");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// One line per state, and a second exhaustive switch to prove the first was
// not a fluke. Amounts are pounds to two decimals.
//
//   draft      "draft order o1 for £89.99"
//   submitted  "order o1 submitted, awaiting payment"
//   paid       "order o1 paid (pay_1)"
//   shipped    "order o1 shipped (trk_1)"
//   delivered  "order o1 delivered"
//   cancelled  "order o1 cancelled: out of stock"
export function describeState(state: OrderState): string {
  throw new Error("TODO 5: implement describeState");
}
