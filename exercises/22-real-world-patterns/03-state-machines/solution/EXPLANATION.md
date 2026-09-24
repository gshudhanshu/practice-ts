# 22/03 — State machines

## Make illegal states unrepresentable

The optional-field version of `Order` has five `?` properties, so 32
representable shapes for six real states. The union has six, and every one of
them carries exactly the data that is known in it:

```ts
| { status: "draft";  id; totalCents }
| { status: "paid";   id; totalCents; submittedAt; paymentId }
```

`draft.paymentId` is not `undefined` — it is a **compile error**. There is no
guard to forget, because there is nothing to guard.

This also removes a whole category of "defensive" code. `describeState` reads
`state.paymentId` in the `paid` branch with no check at all, and cannot read it
anywhere else. The narrowing is doing the work a runtime guard used to.

## Make illegal transitions uncompilable

```ts
export function transition<S extends OrderState>(
  state: S,
  event: EventFor<S["status"]>,
): OrderState
```

Three moves stacked:

1. `S` is inferred from the argument, so a draft order gives `S["status"]` of
   `"draft"`.
2. `LegalEvents["draft"]` is `"submit" | "cancel"`, read out of the table.
3. `EventFor` turns those names into the events themselves, so only a `submit`
   or a `cancel` object is assignable.

For `delivered` the table is empty, `LegalEvents["delivered"]` is `never`, and
`Extract<OrderEvent, { type: never }>` is `never` — a parameter type that
**nothing** satisfies. Terminal states enforce themselves.

### Why the body widens

```ts
const current: OrderState = state;
const incoming: OrderEvent = event;
```

Inside the function `S` is still an unresolved type parameter, so `state.status`
cannot narrow the union — this is the deferred-conditional problem from 10/04
in a different costume. Assigning to the plain unions restores ordinary
narrowing, and costs nothing, because the check that matters already happened at
the call site.

## One table, two consumers

```ts
export const TRANSITIONS = { … } as const satisfies Record<OrderStatus, readonly OrderEvent["type"][]>;

export type LegalEvents = { [S in OrderStatus]: (typeof TRANSITIONS)[S][number] };
```

The rules are written **once**, as a value, and the type is derived from it —
section 10's central rule applied to a state machine. Add a `refund` event to
the table and `EventFor<"paid">` widens automatically; there is no second
declaration to forget.

`as const satisfies` is the exact tool for this (07/04):

| | Does what |
|---|---|
| `as const` | keeps `["submit", "cancel"]` as a literal tuple rather than `string[]` |
| `satisfies` | checks every status is present and every value is a real event name… |
| | …**without widening** the type, which a `: Record<…>` annotation would |

Drop `as const` and `[number]` gives you `string`. Use an annotation instead of
`satisfies` and `LegalEvents["draft"]` becomes the whole event union. Both
mistakes compile and silently disable the compile-time checking.

## The static check and the runtime check are both needed

This is the part people get wrong in interviews.

```ts
transition(loadFromDatabase(), { type: "cancel", reason: "any" }); // compiles
```

`loadFromDatabase()` returns `OrderState`, not a specific member, so
`LegalEvents[OrderStatus]` is the union of *everything* and every event is
assignable. **Types are erased.** A state machine fed by a database, a queue or
an HTTP body has no static knowledge of which state it is in, so it still needs
`canTransition` and `IllegalTransitionError`.

The right way to describe it: the static check is for **your code** (a
programmer writing `pay` on a draft is a bug caught at build time), and the
runtime check is for **your data** (a stale event in a log is a normal Tuesday).
Neither replaces the other.

## `assertNever`, twice

```ts
default:
  return assertNever(current);
```

Add a seventh status and both switches stop compiling, pointing at the exact
places that need a new branch. That is the whole value: exhaustiveness is not
about the current code being right, it is about the *next* change being safe.

Note it is `return assertNever(...)`, not a bare call — the `never` return type
tells the compiler the function ends there, which is what satisfies the
`string` / `OrderState` return type on every path.

## `replay`: ask, don't catch

```ts
if (!canTransition(state.status, event.type)) { rejected.push(event); continue; }
```

An event log containing an event that no longer applies is expected — a
duplicate delivery from a queue, a retry, an out-of-order message. Handling it
with `try/catch` around `transition` would work and would be worse, for exactly
the reason 22/02 gives: exceptions are for the unexpected.

The `ReplayResult` shape (`state`, `applied`, `rejected`) also makes the skipped
events *visible*. Silently dropping them is how a queue consumer quietly loses
messages for a month.

## Common mistakes

| Mistake | What happens |
|---|---|
| Optional fields instead of a union | Every reader needs a guard; illegal shapes stay representable |
| `TRANSITIONS` without `as const` | Entries widen to `string[]`; `LegalEvents` becomes the whole union |
| `: Record<…>` annotation instead of `satisfies` | Same widening, silently |
| Hand-writing `LegalEvents` | Two sources of truth; they drift |
| `TRANSITIONS[status].includes(eventType)` | Does not compile — widen to `readonly string[]` first |
| Narrowing `state` without widening it first | `S` is generic; the switch narrows nothing |
| `default: throw new Error(...)` | Compiles for ever; a new status is never flagged |
| `replay` catching `IllegalTransitionError` | Works, but treats an expected case as exceptional |

## Interview angle

> *"How would you model something with a lifecycle — an order, a subscription,
> a job?"*

A discriminated union with one member per state, each carrying only the data
that state actually has, so the illegal combinations cannot be constructed. Then
the transition function, exhaustive over the discriminant with `assertNever` in
the default. If you want to go further — and this is the part that lands — a
transition table as a `const` object with `as const satisfies`, from which the
legal-event types are *derived*, so the runtime check and the compile-time check
cannot disagree.

> *"Doesn't the compiler check make the runtime check unnecessary?"*

No, and this is the question that separates people who have used the pattern
from people who have read about it. Types are erased. The moment a state comes
from a database, a queue or a request body its static type is the whole union,
so every event is assignable and only the runtime table can reject it. The
static check protects the code you write; the runtime check protects the data
you receive.
