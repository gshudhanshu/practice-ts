/**
 * Exercise 22/05 — CHALLENGE: a domain layer
 *
 * The last exercise in the repo, and it does not introduce anything new. It
 * combines the three patterns you have just built into the thing they are
 * actually for: a module that models a business process so precisely that most
 * of its bugs are compile errors.
 *
 *   22/01  branded ids      — a ticket id and an agent id cannot be swapped
 *   22/02  Result<T, E>     — expected failures are returned, with a reason
 *   22/03  exhaustive state — illegal transitions are rejected, exhaustively
 *
 * Everything from those three exercises is GIVEN below, including the single
 * cast (inside `brand`). You write the domain.
 *
 * The shape to aim for: no `throw`, no `undefined`-checking, no `if
 * (ticket.assignee)`. Every failure is a `DomainError` a caller can read, and
 * every piece of data lives on the state that actually has it.
 *
 * Read README.md first. Replace every TODO.
 */

/* ── Given: 22/01, branded ids ──────────────────────────────────────────── */

export type Brand<T, B extends string> = T & { readonly __brand: B };

/** The one cast in this file. Not exported — see 22/01. */
function brand<T, B extends string>(value: T): Brand<T, B> {
  return value as Brand<T, B>;
}

export type TicketId = Brand<string, "TicketId">;
export type AgentId = Brand<string, "AgentId">;

/* ── Given: 22/02, Result ───────────────────────────────────────────────── */

export type Ok<T> = { readonly ok: true; readonly value: T };
export type Err<E> = { readonly ok: false; readonly error: E };
export type Result<T, E> = Ok<T> | Err<E>;

export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

export function err<E>(error: E): Err<E> {
  return { ok: false, error };
}

export function map<T, E, U>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E> {
  return result.ok ? ok(fn(result.value)) : result;
}

export function flatMap<T, E, U, F>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, F>,
): Result<U, E | F> {
  return result.ok ? fn(result.value) : result;
}

export function unwrapOr<T, E, U>(result: Result<T, E>, fallback: U): T | U {
  return result.ok ? result.value : fallback;
}

/* ── Given: 02/06, exhaustiveness ───────────────────────────────────────── */

export function assertNever(value: never): never {
  throw new Error(`unreachable: ${JSON.stringify(value)}`);
}

/* ── Given: the vocabulary ──────────────────────────────────────────────── */

export type TicketStatus = "open" | "assigned" | "resolved" | "closed";

export type TicketCommand =
  | { readonly type: "assign"; readonly agent: AgentId }
  | {
      readonly type: "resolve";
      readonly agent: AgentId;
      readonly resolution: string;
    }
  | { readonly type: "close"; readonly at: number }
  | { readonly type: "reopen"; readonly reason: string };

/**
 * Every way this domain can say no. A closed union, so `describeError` can be
 * exhaustive and adding a fifth failure mode is a compile error there.
 */
export type DomainError =
  | { readonly kind: "invalid-id"; readonly field: string; readonly raw: string }
  | { readonly kind: "empty-subject" }
  | {
      readonly kind: "illegal-transition";
      readonly status: TicketStatus;
      readonly command: TicketCommand["type"];
    }
  | {
      readonly kind: "wrong-agent";
      readonly expected: AgentId;
      readonly actual: AgentId;
    };

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Smart constructors that RETURN their failure instead of throwing — 22/01's
// branding and 22/02's Result, combined.
//
//   parseTicketId("tkt_1")  ->  ok(...)
//   parseTicketId("nope")   ->  err({ kind: "invalid-id", field: "ticketId", raw: "nope" })
//   parseAgentId("agt_ada") ->  ok(...)
//   parseAgentId("")        ->  err({ kind: "invalid-id", field: "agentId", raw: "" })
//
// Valid: `tkt_` + one or more digits · `agt_` + one or more lowercase letters.
//
// Use the given `brand` helper. Note that `err({ kind: "invalid-id", … })` on
// its own infers `kind: string` — annotate the return type and the object
// literal is checked against DomainError instead.
export function parseTicketId(raw: string): Result<TicketId, DomainError> {
  throw new Error("TODO 1: implement parseTicketId");
}

export function parseAgentId(raw: string): Result<AgentId, DomainError> {
  throw new Error("TODO 1: implement parseAgentId");
}

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// One line per failure, exhaustively — `assertNever` in the default, so a new
// DomainError variant cannot be added without a message for it.
//
//   invalid-id           "invalid ticketId: nope"
//   empty-subject        "subject must not be empty"
//   illegal-transition   "cannot close a ticket that is open"
//   wrong-agent          "agt_bob is not assigned to this ticket (agt_ada is)"
export function describeError(error: DomainError): string {
  throw new Error("TODO 2: implement describeError");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// The states. Each carries exactly what is known in it, and nothing else:
//
//   open      id, subject
//   assigned  + assignee
//   resolved  + resolution
//   closed    + closedAt
//
// So `ticket.assignee` is a compile error on an open ticket, and there is no
// `assignee?: AgentId` for anyone to forget to check.
//
//   openTicket("tkt_1", "  Printer on fire  ")
//     -> ok({ status: "open", id, subject: "Printer on fire" })   // trimmed
//   openTicket("nope", "…")     -> err(invalid-id)
//   openTicket("tkt_1", "   ")  -> err({ kind: "empty-subject" })
//
// The id is parsed FIRST: an unusable id makes the subject irrelevant (the
// outside-in ordering from 09/03).
export type Ticket = { readonly status: TicketStatus };

export function openTicket(
  rawId: string,
  subject: string,
): Result<Ticket, DomainError> {
  throw new Error("TODO 3: implement openTicket");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// The machine, as a total function: every (state, command) pair produces either
// the next ticket or a DomainError.
//
//   open     + assign   -> assigned
//   assigned + assign   -> assigned   (reassignment is allowed)
//   assigned + resolve  -> resolved   — but ONLY by the assignee; anyone else
//                                       gets { kind: "wrong-agent", … }
//   resolved + close    -> closed
//   resolved + reopen   -> assigned   (back to the same assignee)
//   closed              -> terminal
//   anything else       -> { kind: "illegal-transition", status, command }
//
// Exhaustive `switch` on `ticket.status`, `assertNever` in the default.
export function applyCommand(
  ticket: Ticket,
  command: TicketCommand,
): Result<Ticket, DomainError> {
  throw new Error("TODO 4: implement applyCommand");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// The two functions the rest of the application calls.
//
//   applyAll(ticket, commands)  runs the commands in order, stopping at the
//                               FIRST failure and returning that error. Build
//                               it out of flatMap — the short-circuiting is
//                               already in there.
//
//   summarise(ticket)           one line per state, exhaustively:
//     open      "tkt_1: open — Printer on fire"
//     assigned  "tkt_1: assigned to agt_ada — Printer on fire"
//     resolved  "tkt_1: resolved by agt_ada — replaced the fuser"
//     closed    "tkt_1: closed — replaced the fuser"
export function applyAll(
  ticket: Ticket,
  commands: readonly TicketCommand[],
): Result<Ticket, DomainError> {
  throw new Error("TODO 5: implement applyAll");
}

export function summarise(ticket: Ticket): string {
  throw new Error("TODO 5: implement summarise");
}

// Keeps the given helpers referenced while the TODOs are unfinished.
void [brand, map, unwrapOr, assertNever];
