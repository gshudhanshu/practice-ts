# 22/05 — CHALLENGE: a domain layer

**Tier:** Challenge · **Time:** ~45 min · **Course section:** 22 — Real-world patterns

---

## Where this fits

The last exercise in the repo, and it introduces nothing new. It combines the
three patterns you have just built into the thing they exist for: a module that
models a business process precisely enough that most of its bugs are compile
errors.

| From | Doing what here |
|---|---|
| [22/01](../01-branded-types/) branded ids | a `TicketId` and an `AgentId` cannot be swapped |
| [22/02](../02-result-type/) `Result<T, E>` | every expected failure is returned with a reason |
| [22/03](../03-state-machines/) exhaustive unions | each state carries only what it knows; every switch is total |

All of the machinery — `Brand`, `brand`, `Result`, `ok`, `err`, `map`,
`flatMap`, `unwrapOr`, `assertNever` — is **given**, including the file's single
cast. You write the domain.

The target shape: **no `throw`, no optional fields, no `if (ticket.assignee)`.**

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `parseTicketId` / `parseAgentId` — branded smart constructors returning `Result`. |
| 2 | `describeError` — exhaustive over `DomainError`. |
| 3 | The `Ticket` state union, and `openTicket`. |
| 4 | `applyCommand` — the machine, as a total function. |
| 5 | `applyAll` and `summarise`. |

### The states

| Status | Carries |
|---|---|
| `open` | `id`, `subject` |
| `assigned` | + `assignee` |
| `resolved` | + `resolution` |
| `closed` | + `closedAt` |

### The machine

| From | Command | To |
|---|---|---|
| `open` | `assign` | `assigned` |
| `assigned` | `assign` | `assigned` (reassignment) |
| `assigned` | `resolve` | `resolved` — **only by the assignee** |
| `resolved` | `close` | `closed` |
| `resolved` | `reopen` | `assigned`, resolution dropped |
| `closed` | — | terminal |

Anything else returns `{ kind: "illegal-transition", status, command }`. A
resolve by the wrong agent is a *different* error —
`{ kind: "wrong-agent", expected, actual }` — because the caller's remedy is
different.

### Ids and messages

`tkt_` + digits · `agt_` + lowercase letters. Anything else is
`{ kind: "invalid-id", field, raw }` where `field` is `"ticketId"` or
`"agentId"`.

```
invalid ticketId: nope
subject must not be empty
cannot close a ticket that is open
agt_bob is not assigned to this ticket (agt_ada is)

tkt_1: open — Printer on fire
tkt_1: assigned to agt_ada — Printer on fire
tkt_1: resolved by agt_ada — replaced the fuser
tkt_1: closed — replaced the fuser
```

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`. The one permitted cast is already written for you,
  inside the given `brand()`.
- **Nothing in your code throws.** Every failure is a `DomainError` in a
  `Result`.
- **No optional fields.** If a property is not known in a state, that state does
  not have it.
- Both `switch`es are exhaustive, ending in `default: return assertNever(...)`.
- `openTicket` parses the id **first**; a bad id makes the subject irrelevant.
- `subject` is trimmed, and an all-whitespace subject is empty.

## Done when

```bash
npm run check 22/05
```

<details>
<summary>Hint 1 — the annotation is load-bearing</summary>

```ts
export function parseTicketId(raw: string): Result<TicketId, DomainError> {
  if (!TICKET_ID.test(raw)) return err({ kind: "invalid-id", field: "ticketId", raw });
  return ok(brand<string, "TicketId">(raw));
}
```

Without the return-type annotation, `err({ kind: "invalid-id", … })` infers
`kind: string` — object literals widen their string properties unless a
contextual type says otherwise — and the result is not a `DomainError` at all.
</details>

<details>
<summary>Hint 2 — build the failure once</summary>

```ts
const illegal = (): Err<DomainError> =>
  err({ kind: "illegal-transition", status: ticket.status, command: command.type });
```

Declared before the `switch`, it reads the *un-narrowed* `ticket` and `command`,
so every rejection reports itself the same way and there is one place to change
the message.
</details>

<details>
<summary>Hint 3 — spread for the states that grow</summary>

```ts
return ok({ ...ticket, status: "resolved", resolution: command.resolution });
```

Works when the next state is a superset of the current one. `reopen` goes the
other way — `resolved` → `assigned` drops `resolution` — so build that one
field by field. The compiler will tell you: an extra `resolution` on an
`assigned` ticket is an excess-property error.
</details>

<details>
<summary>Hint 4 — a rule the state machine cannot express</summary>

"Only the assignee may resolve" compares two runtime values, so it is a check,
not a type. Put it inside the `resolve` branch, *after* the transition is known
to be legal, and give it its own error kind — the caller who gets
`wrong-agent` should reassign, while the one who gets `illegal-transition`
should not have tried at all.
</details>

<details>
<summary>Hint 5 — <code>applyAll</code> needs no <code>break</code></summary>

```ts
let current: Result<Ticket, DomainError> = ok(ticket);
for (const command of commands) {
  current = flatMap(current, (next) => applyCommand(next, command));
}
return current;
```

`flatMap` already short-circuits: once `current` is an `Err`, the callback is
never called again and the original error is carried through untouched.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md).

**That completes section 22, and the bonus block.** See the
[repository README](../../../README.md).
