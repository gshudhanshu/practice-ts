/**
 * Solution — 22/03 State machines
 */

export type OrderStatus =
  | "draft"
  | "submitted"
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled";

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

/**
 * The single source of truth. `as const` keeps the literal types (without it
 * every entry would widen to `string[]`); `satisfies` checks that the keys
 * cover every status and the values are real event names, without widening the
 * type the way an annotation would (07/04).
 */
export const TRANSITIONS = {
  draft: ["submit", "cancel"],
  submitted: ["pay", "cancel"],
  paid: ["ship", "cancel"],
  shipped: ["deliver"],
  delivered: [],
  cancelled: [],
} as const satisfies Record<OrderStatus, readonly OrderEvent["type"][]>;

/**
 * Derived, not written twice: a mapped type over the statuses, indexing each
 * tuple with `[number]` to turn it into a union of its members. The terminal
 * states have empty tuples, so they map to `never` — which is precisely the
 * type that accepts no event at all.
 */
export type LegalEvents = {
  [S in OrderStatus]: (typeof TRANSITIONS)[S][number];
};

/** From the event NAMES to the events themselves. */
export type EventFor<S extends OrderStatus> = Extract<
  OrderEvent,
  { type: LegalEvents[S] }
>;

export function canTransition(
  status: OrderStatus,
  eventType: OrderEvent["type"],
): boolean {
  // `TRANSITIONS[status]` is a narrow tuple like `readonly ["submit",
  // "cancel"]`, so `.includes` rejects the wider event union. Widening to
  // `readonly string[]` first is the cast-free fix.
  const allowed: readonly string[] = TRANSITIONS[status];
  return allowed.includes(eventType);
}

export function isTerminal(status: OrderStatus): boolean {
  return TRANSITIONS[status].length === 0;
}

export function transition<S extends OrderState>(
  state: S,
  event: EventFor<S["status"]>,
): OrderState {
  // Widen both back to the plain unions. Inside the function `S` is still
  // generic, so narrowing cannot see through it — and the caller has already
  // had the check that matters.
  const current: OrderState = state;
  const incoming: OrderEvent = event;

  const illegal = (): never => {
    throw new IllegalTransitionError(current.status, incoming.type);
  };

  switch (current.status) {
    case "draft":
      if (incoming.type === "submit") {
        return { ...current, status: "submitted", submittedAt: incoming.at };
      }
      if (incoming.type === "cancel") {
        return {
          status: "cancelled",
          id: current.id,
          totalCents: current.totalCents,
          reason: incoming.reason,
        };
      }
      return illegal();

    case "submitted":
      if (incoming.type === "pay") {
        return { ...current, status: "paid", paymentId: incoming.paymentId };
      }
      if (incoming.type === "cancel") {
        return {
          status: "cancelled",
          id: current.id,
          totalCents: current.totalCents,
          reason: incoming.reason,
        };
      }
      return illegal();

    case "paid":
      if (incoming.type === "ship") {
        return {
          ...current,
          status: "shipped",
          trackingId: incoming.trackingId,
        };
      }
      if (incoming.type === "cancel") {
        return {
          status: "cancelled",
          id: current.id,
          totalCents: current.totalCents,
          reason: incoming.reason,
        };
      }
      return illegal();

    case "shipped":
      if (incoming.type === "deliver") {
        return {
          ...current,
          status: "delivered",
          deliveredAt: incoming.at,
        };
      }
      return illegal();

    case "delivered":
    case "cancelled":
      // Terminal. Nothing can happen to these.
      return illegal();

    default:
      // Add a seventh status and this line stops compiling — which is the
      // entire reason the default is here rather than a `throw`.
      return assertNever(current);
  }
}

export type ReplayResult = {
  readonly state: OrderState;
  readonly applied: readonly OrderEvent[];
  readonly rejected: readonly OrderEvent[];
};

export function replay(
  initial: OrderState,
  events: readonly OrderEvent[],
): ReplayResult {
  let state = initial;
  const applied: OrderEvent[] = [];
  const rejected: OrderEvent[] = [];

  for (const event of events) {
    // Asking first, rather than catching afterwards: an event log with a
    // stale entry in it is an expected situation, not an exceptional one.
    if (!canTransition(state.status, event.type)) {
      rejected.push(event);
      continue;
    }

    state = transition(state, event);
    applied.push(event);
  }

  return { state, applied, rejected };
}

export function describeState(state: OrderState): string {
  switch (state.status) {
    case "draft":
      return `draft order ${state.id} for £${(state.totalCents / 100).toFixed(2)}`;
    case "submitted":
      return `order ${state.id} submitted, awaiting payment`;
    case "paid":
      // `state.paymentId` is readable here and NOWHERE else in this function —
      // the narrowing is doing the work an optional field would have left to a
      // runtime guard.
      return `order ${state.id} paid (${state.paymentId})`;
    case "shipped":
      return `order ${state.id} shipped (${state.trackingId})`;
    case "delivered":
      return `order ${state.id} delivered`;
    case "cancelled":
      return `order ${state.id} cancelled: ${state.reason}`;
    default:
      return assertNever(state);
  }
}
