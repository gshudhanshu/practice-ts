/**
 * Solution — 22/05 A domain layer
 */

export type Brand<T, B extends string> = T & { readonly __brand: B };

function brand<T, B extends string>(value: T): Brand<T, B> {
  return value as Brand<T, B>;
}

export type TicketId = Brand<string, "TicketId">;
export type AgentId = Brand<string, "AgentId">;

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

export function assertNever(value: never): never {
  throw new Error(`unreachable: ${JSON.stringify(value)}`);
}

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

/* ── Smart constructors that return their failure ───────────────────────── */

const TICKET_ID = /^tkt_[0-9]+$/;
const AGENT_ID = /^agt_[a-z]+$/;

// The return-type annotation is what makes `err({ kind: "invalid-id", … })`
// work: without a contextual type, `kind` would widen to `string` and the
// object would not be a DomainError at all.
export function parseTicketId(raw: string): Result<TicketId, DomainError> {
  if (!TICKET_ID.test(raw)) {
    return err({ kind: "invalid-id", field: "ticketId", raw });
  }
  return ok(brand<string, "TicketId">(raw));
}

export function parseAgentId(raw: string): Result<AgentId, DomainError> {
  if (!AGENT_ID.test(raw)) {
    return err({ kind: "invalid-id", field: "agentId", raw });
  }
  return ok(brand<string, "AgentId">(raw));
}

export function describeError(error: DomainError): string {
  switch (error.kind) {
    case "invalid-id":
      return `invalid ${error.field}: ${error.raw}`;
    case "empty-subject":
      return "subject must not be empty";
    case "illegal-transition":
      return `cannot ${error.command} a ticket that is ${error.status}`;
    case "wrong-agent":
      // Branded ids interpolate like the strings they are.
      return `${error.actual} is not assigned to this ticket (${error.expected} is)`;
    default:
      // Add a fifth DomainError and this line stops compiling.
      return assertNever(error);
  }
}

/* ── The states ─────────────────────────────────────────────────────────── */

export type Ticket =
  | {
      readonly status: "open";
      readonly id: TicketId;
      readonly subject: string;
    }
  | {
      readonly status: "assigned";
      readonly id: TicketId;
      readonly subject: string;
      readonly assignee: AgentId;
    }
  | {
      readonly status: "resolved";
      readonly id: TicketId;
      readonly subject: string;
      readonly assignee: AgentId;
      readonly resolution: string;
    }
  | {
      readonly status: "closed";
      readonly id: TicketId;
      readonly subject: string;
      readonly assignee: AgentId;
      readonly resolution: string;
      readonly closedAt: number;
    };

export function openTicket(
  rawId: string,
  subject: string,
): Result<Ticket, DomainError> {
  // Identity before content (09/03): an unusable id makes the subject moot.
  return flatMap(parseTicketId(rawId), (id): Result<Ticket, DomainError> => {
    const trimmed = subject.trim();
    if (trimmed === "") return err({ kind: "empty-subject" });

    return ok({ status: "open", id, subject: trimmed });
  });
}

export function applyCommand(
  ticket: Ticket,
  command: TicketCommand,
): Result<Ticket, DomainError> {
  // Built once, from the un-narrowed values, so every rejection reports the
  // same way.
  const illegal = (): Err<DomainError> =>
    err({
      kind: "illegal-transition",
      status: ticket.status,
      command: command.type,
    });

  switch (ticket.status) {
    case "open":
      if (command.type === "assign") {
        return ok({
          status: "assigned",
          id: ticket.id,
          subject: ticket.subject,
          assignee: command.agent,
        });
      }
      return illegal();

    case "assigned":
      if (command.type === "assign") {
        // Reassignment is a legal move, not a new state.
        return ok({ ...ticket, assignee: command.agent });
      }
      if (command.type === "resolve") {
        // A business rule the state machine alone cannot express: only the
        // assignee may resolve. Note it is a DIFFERENT error kind, because the
        // caller's remedy is different — reassign, not wait.
        if (command.agent !== ticket.assignee) {
          return err({
            kind: "wrong-agent",
            expected: ticket.assignee,
            actual: command.agent,
          });
        }
        return ok({
          ...ticket,
          status: "resolved",
          resolution: command.resolution,
        });
      }
      return illegal();

    case "resolved":
      if (command.type === "close") {
        return ok({ ...ticket, status: "closed", closedAt: command.at });
      }
      if (command.type === "reopen") {
        // Back to the same assignee — and the resolution is dropped, because
        // an assigned ticket has no resolution. The type enforces that.
        return ok({
          status: "assigned",
          id: ticket.id,
          subject: ticket.subject,
          assignee: ticket.assignee,
        });
      }
      return illegal();

    case "closed":
      return illegal();

    default:
      return assertNever(ticket);
  }
}

export function applyAll(
  ticket: Ticket,
  commands: readonly TicketCommand[],
): Result<Ticket, DomainError> {
  let current: Result<Ticket, DomainError> = ok(ticket);

  for (const command of commands) {
    // flatMap short-circuits on its own: once `current` is an Err, the
    // callback is never invoked again. No `if (failed) break` needed.
    current = flatMap(current, (next) => applyCommand(next, command));
  }

  return current;
}

export function summarise(ticket: Ticket): string {
  switch (ticket.status) {
    case "open":
      return `${ticket.id}: open — ${ticket.subject}`;
    case "assigned":
      return `${ticket.id}: assigned to ${ticket.assignee} — ${ticket.subject}`;
    case "resolved":
      return `${ticket.id}: resolved by ${ticket.assignee} — ${ticket.resolution}`;
    case "closed":
      return `${ticket.id}: closed — ${ticket.resolution}`;
    default:
      return assertNever(ticket);
  }
}
