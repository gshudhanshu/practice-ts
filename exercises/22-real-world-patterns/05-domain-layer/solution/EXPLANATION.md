# 22/05 — A domain layer

## What the three patterns buy together

Each one removes a category of bug, and they compose:

| Pattern | Removes |
|---|---|
| Branded ids | passing an agent id where a ticket id belongs |
| `Result<T, E>` | an unhandled failure, and an unnamed one |
| Exhaustive state union | reading data the current state does not have, and forgetting a case |

Count what is *not* in this module: no `throw`, no `?` on any field, no
`if (ticket.assignee)`, no `undefined` check anywhere, and no `default: throw
new Error("unreachable")` that could go stale. Every one of those absences is a
class of bug that cannot occur rather than one that has been handled.

## Constructors that return, not throw

```ts
export function parseTicketId(raw: string): Result<TicketId, DomainError> {
  if (!TICKET_ID.test(raw)) return err({ kind: "invalid-id", field: "ticketId", raw });
  return ok(brand<string, "TicketId">(raw));
}
```

22/01 offered three constructor shapes — throw, `null`, predicate. This is the
fourth and the best one for a domain boundary: it carries the *reason*, so the
caller can put "invalid ticketId: nope" in front of a user without inventing the
message.

**The return-type annotation is doing real work.** Without it,
`err({ kind: "invalid-id", … })` infers `kind: string`, because object literals
widen their string properties when there is no contextual type — and
`{ kind: string; … }` is not a `DomainError`. The annotation supplies the
context, the literal is checked against the union, and a typo in `"invalid-id"`
becomes a compile error. This trips up nearly everyone the first time.

## A closed error union, not `Error`

```ts
export type DomainError =
  | { kind: "invalid-id"; field: string; raw: string }
  | { kind: "empty-subject" }
  | { kind: "illegal-transition"; status: TicketStatus; command: TicketCommand["type"] }
  | { kind: "wrong-agent"; expected: AgentId; actual: AgentId };
```

Three things follow from it being closed:

- **`describeError` can be exhaustive.** Add a fifth variant and `assertNever`
  flags the missing message at build time.
- **Each variant carries what its own handler needs.** `wrong-agent` has both
  ids, so the UI can offer to reassign; `illegal-transition` has the status and
  the command, so a log line explains itself.
- **Callers can branch on `kind`.** With `Error` subclasses they would be
  writing `instanceof` chains that the compiler cannot check for completeness.

Note that `wrong-agent` is deliberately *not* an `illegal-transition`. The
transition is perfectly legal — an assigned ticket can be resolved — but this
particular agent may not do it. Different cause, different remedy, different
variant. Collapsing them would force the UI to parse a message to decide what to
offer.

## Rules the type system can enforce, and rules it cannot

```ts
if (command.agent !== ticket.assignee) {
  return err({ kind: "wrong-agent", expected: ticket.assignee, actual: command.agent });
}
```

"Resolve is legal from `assigned`" is a **shape** rule, and the union enforces
it for free. "Only the assignee may resolve" compares two runtime values, so no
type can express it — it is a check, inside the branch where the transition is
already known to be legal.

Knowing which is which is most of domain modelling. Trying to encode the second
kind in types is how you end up with a type-level programme nobody can maintain;
leaving the first kind to runtime is how you end up with `if (!ticket.assignee)
throw` in fourteen places.

## `reopen` shows why the states are separate types

```ts
// resolved -> assigned: built field by field, NOT spread
return ok({ status: "assigned", id: ticket.id, subject: ticket.subject, assignee: ticket.assignee });
```

`{ ...ticket, status: "assigned" }` does not compile, because the spread carries
`resolution` along and an `assigned` ticket has no such property. The compiler
is enforcing a real business rule: **reopening discards the resolution.** With
`resolution?: string` on one flat type, the stale resolution would have survived
and been displayed on a ticket that is not resolved.

That is the whole argument for the union in one error message.

## `applyAll` needs no control flow

```ts
let current: Result<Ticket, DomainError> = ok(ticket);
for (const command of commands) {
  current = flatMap(current, (next) => applyCommand(next, command));
}
```

No `break`, no `if (failed)`. `flatMap` short-circuits by construction: once
`current` is an `Err`, the callback stops being invoked and the *original* error
travels to the end untouched. The test that feeds it an illegal command in the
middle checks exactly that the first error is what comes out.

This is the payoff for having built the combinators in 22/02 rather than
hand-rolling `if (result.ok)` at every step.

## Common mistakes

| Mistake | What happens |
|---|---|
| No return-type annotation on the parsers | `kind` widens to `string`; the object is not a `DomainError` |
| `resolution?: string` on one flat Ticket type | Reopening silently keeps a stale resolution |
| Throwing from `applyCommand` | The failure leaves the type; callers stop being forced to handle it |
| One `illegal-transition` for the wrong-agent case | The UI cannot tell "reassign" from "you cannot do that" |
| `{ ...ticket, status: "assigned" }` on reopen | Excess property `resolution` — and it is right to complain |
| `default: throw` instead of `assertNever` | A fifth state or error is never flagged |
| Checking the subject before the id | The wrong error for `openTicket("nope", "   ")` |
| `if (result.ok)` chains in `applyAll` | Works, but `flatMap` already is that |

## Interview angle

> *"Walk me through how you would model a domain in TypeScript."*

Answer with this file's structure, in this order: **identifiers** get branded so
they cannot be crossed; **states** get a discriminated union so each carries
only the data it knows and illegal shapes cannot be built; **failures** get a
closed error union returned in a `Result`, so the compiler forces callers to
deal with them and every message has one source; **transitions** get a total
function, exhaustive over the union with `assertNever`, so tomorrow's fifth
state is a compile error rather than a silent fallthrough. Then draw the line
you cannot encode — rules that compare runtime values, like "only the assignee
may resolve" — and say where those live and why.

> *"That is a lot of ceremony. When is it worth it?"*

When the domain has real rules and a long life: money, permissions, workflows,
anything with a lifecycle and an audit trail. It is not worth it for a CRUD
screen over a table with four columns. The honest costs are the constructor
boilerplate, error unions that grow across layers, and the fact that none of it
survives a `JSON.parse` — which is why a domain layer like this always sits
behind a validation boundary like [17/02](../../17-libs-practice/02-runtime-validation-boundary/).
Being able to name the costs is what makes the recommendation credible.
