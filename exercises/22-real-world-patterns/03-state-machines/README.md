# 22/03 — State machines that will not compile in the wrong state

**Tier:** Core → Challenge · **Time:** ~35 min · **Course section:** 22 — Real-world patterns

---

## The bag of optional fields

Almost every codebase has this type:

```ts
type Order = {
  status: string;
  submittedAt?: number;
  paymentId?: string;
  trackingId?: string;
  cancelReason?: string;
};
```

Five optional fields is 32 representable shapes, of which about six are real.
"Delivered but never paid" is representable. "Cancelled with a tracking number"
is representable. So every function that touches an order defends itself with
`if (order.paymentId)`, and the bugs live in the gaps between the guards.

A discriminated union makes the illegal *states* unrepresentable: `paymentId`
exists on `paid` and later, and nowhere else. There is no check to forget,
because on a `draft` the property does not exist to check.

This exercise adds the other half — making illegal **transitions** compile
errors:

```ts
transition(draftOrder, { type: "pay", paymentId: "pay_1" });
//                      ^^^^^^^^^^^^^^ not assignable
```

## Your task

Open `exercise.ts` and resolve all five TODOs. The state and event unions,
`assertNever` and `IllegalTransitionError` are given.

| # | Requirement |
|---|---|
| 1 | `TRANSITIONS` (the table), `LegalEvents` (derived from it), `EventFor<S>`. |
| 2 | `canTransition(status, eventType)` and `isTerminal(status)`. |
| 3 | `transition(state, event)` — exhaustive, with `assertNever`. |
| 4 | `replay(initial, events)` — apply what is legal, collect what is not. |
| 5 | `describeState(state)` — a second exhaustive switch. |

### The machine

| From | Event | To |
|---|---|---|
| `draft` | `submit` | `submitted` (records `submittedAt`) |
| `draft` | `cancel` | `cancelled` |
| `submitted` | `pay` | `paid` (records `paymentId`) |
| `submitted` | `cancel` | `cancelled` |
| `paid` | `ship` | `shipped` (records `trackingId`) |
| `paid` | `cancel` | `cancelled` |
| `shipped` | `deliver` | `delivered` (records `deliveredAt`) |
| `delivered`, `cancelled` | — | terminal |

### Strings `describeState` produces

```
draft order o1 for £89.99
order o1 submitted, awaiting payment
order o1 paid (pay_1)
order o1 shipped (trk_1)
order o1 delivered
order o1 cancelled: out of stock
```

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`. `as const` is fine and you will need it.
- **One table.** `canTransition` must read `TRANSITIONS`, and `LegalEvents` must
  be *derived* from it — a second hand-written copy of the rules will pass the
  tests today and drift next week.
- Both `switch`es end in `default: return assertNever(...)`, so a seventh status
  is a compile error rather than a silent fallthrough.
- `replay` never throws.

## Done when

```bash
npm run check 22/03
```

<details>
<summary>Hint 1 — the table, and the type derived from it</summary>

```ts
export const TRANSITIONS = {
  draft: ["submit", "cancel"],
  // …
  delivered: [],
} as const satisfies Record<OrderStatus, readonly OrderEvent["type"][]>;

export type LegalEvents = {
  [S in OrderStatus]: (typeof TRANSITIONS)[S][number];
};
```

`as const` keeps the literal types (without it every entry is `string[]`);
`satisfies` checks the keys and values without widening (07/04); `[number]`
turns each tuple into a union of its members (10/02). `delivered: []` maps to
`never`, which is exactly "no event is legal here".
</details>

<details>
<summary>Hint 2 — <code>.includes</code> on a narrow tuple</summary>

`TRANSITIONS[status].includes(eventType)` does **not** compile: the tuple is
`readonly ["submit", "cancel"]` and `eventType` is the full event union. Widen
first, with no cast:

```ts
const allowed: readonly string[] = TRANSITIONS[status];
return allowed.includes(eventType);
```
</details>

<details>
<summary>Hint 3 — the signature that does the work</summary>

```ts
export function transition<S extends OrderState>(
  state: S,
  event: EventFor<S["status"]>,
): OrderState
```

`S` is inferred from the argument, so `S["status"]` is `"draft"` for a draft
order, and `EventFor<"draft">` admits only `submit` and `cancel`. For a
`delivered` order it is `never`, so nothing is assignable at all.
</details>

<details>
<summary>Hint 4 — widen inside the body</summary>

```ts
const current: OrderState = state;
const incoming: OrderEvent = event;
```

Inside the function `S` is still generic, so narrowing cannot see through it.
Assign both to the plain unions first, then `switch (current.status)` narrows
normally. The caller has already had the check that matters.
</details>

<details>
<summary>Hint 5 — ask, do not catch</summary>

```ts
if (!canTransition(state.status, event.type)) {
  rejected.push(event);
  continue;
}
state = transition(state, event);
```

An event log with a stale entry is an expected situation. Using `try/catch` for
it would work and would be worse — exceptions are for the unexpected, which is
the same argument 22/02 makes.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md).

Next: [22/04 — a typed API client](../04-typed-api-client/).
