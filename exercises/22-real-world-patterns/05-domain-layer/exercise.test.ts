import { describe, expect, it } from "vitest";
import type {
  Equal,
  Expect,
  ExpectFalse,
  Extends,
} from "../../../src/type-testing";
import {
  applyAll,
  applyCommand,
  describeError,
  openTicket,
  parseAgentId,
  parseTicketId,
  summarise,
  type AgentId,
  type DomainError,
  type Result,
  type Ticket,
  type TicketCommand,
  type TicketId,
} from "./exercise";

type TicketOf<S extends Ticket["status"]> = Extract<Ticket, { status: S }>;

/* ── Compile-time spec ──────────────────────────────────────────────────── */

/* 22/01 — the ids are nominal. */
type _ticketIdIsString = Expect<Extends<TicketId, string>>;
type _stringIsNotTicketId = ExpectFalse<Extends<string, TicketId>>;
type _idsDoNotMix = ExpectFalse<Extends<TicketId, AgentId>>;

/* 22/02 — failures are returned, with a reason. */
type _parseTicketId = Expect<
  Equal<ReturnType<typeof parseTicketId>, Result<TicketId, DomainError>>
>;
type _parseAgentId = Expect<
  Equal<ReturnType<typeof parseAgentId>, Result<AgentId, DomainError>>
>;
type _open = Expect<
  Equal<ReturnType<typeof openTicket>, Result<Ticket, DomainError>>
>;
type _apply = Expect<
  Equal<ReturnType<typeof applyCommand>, Result<Ticket, DomainError>>
>;
type _applyAll = Expect<
  Equal<ReturnType<typeof applyAll>, Result<Ticket, DomainError>>
>;

/* 22/03 — the states carry exactly what they know. */
type _openHasNoAssignee = ExpectFalse<
  Extends<TicketOf<"open">, { assignee: AgentId }>
>;
type _resolvedHasResolution = Expect<
  Extends<TicketOf<"resolved">, { resolution: string }>
>;

declare const openTicketState: TicketOf<"open">;
declare const assignedTicket: TicketOf<"assigned">;
declare const closedTicket: TicketOf<"closed">;
declare const anyError: DomainError;

function _compileTimeOnly(): void {
  // @ts-expect-error — an open ticket has no assignee to read.
  void openTicketState.assignee;

  // @ts-expect-error — nor a resolution.
  void openTicketState.resolution;

  // @ts-expect-error — an assigned ticket has not been closed.
  void assignedTicket.closedAt;

  const assignee: AgentId = assignedTicket.assignee;
  const closedAt: number = closedTicket.closedAt;
  void assignee, closedAt;

  // @ts-expect-error — tickets are read-only.
  openTicketState.subject = "changed";

  // @ts-expect-error — a raw string is not an AgentId.
  const badCommand: TicketCommand = { type: "assign", agent: "agt_ada" };
  void badCommand;

  // The result must be discriminated before the ticket can be read.
  const result = openTicket("tkt_1", "Printer on fire");
  // @ts-expect-error — `value` does not exist on the error branch.
  void result.value;

  if (result.ok) {
    const ticket: Ticket = result.value;
    void ticket;
  } else {
    const message: string = describeError(result.error);
    void message;
  }

  // Narrowing the error union gives each variant its own fields.
  if (anyError.kind === "wrong-agent") {
    const expected: AgentId = anyError.expected;
    void expected;
    // @ts-expect-error — only "invalid-id" has a raw value.
    void anyError.raw;
  }
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

function value<T>(result: Result<T, DomainError>): T {
  if (!result.ok) {
    throw new Error(`expected ok, got ${describeError(result.error)}`);
  }
  return result.value;
}

function error<T>(result: Result<T, DomainError>): DomainError {
  if (result.ok) throw new Error("expected an error");
  return result.error;
}

const agent = (raw: string): AgentId => value(parseAgentId(raw));
const fresh = (): Ticket => value(openTicket("tkt_1", "Printer on fire"));

const assignTo = (raw: string): TicketCommand => ({
  type: "assign",
  agent: agent(raw),
});

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("parseTicketId / parseAgentId", () => {
  it("accepts well-formed ids", () => {
    expect(value(parseTicketId("tkt_1"))).toBe("tkt_1");
    expect(value(parseAgentId("agt_ada"))).toBe("agt_ada");
  });

  it("returns a located error rather than throwing", () => {
    expect(error(parseTicketId("nope"))).toEqual({
      kind: "invalid-id",
      field: "ticketId",
      raw: "nope",
    });
    expect(error(parseAgentId(""))).toEqual({
      kind: "invalid-id",
      field: "agentId",
      raw: "",
    });
  });

  it.each(["tkt_", "TKT_1", "tkt_abc", " tkt_1", "agt_1"])(
    "rejects %j as a ticket id",
    (raw) => {
      expect(parseTicketId(raw).ok).toBe(false);
    },
  );

  it.each(["agt_", "agt_Ada", "agt_1", "tkt_1"])(
    "rejects %j as an agent id",
    (raw) => {
      expect(parseAgentId(raw).ok).toBe(false);
    },
  );
});

describe("describeError", () => {
  it("has a message for every variant", () => {
    expect(
      describeError({ kind: "invalid-id", field: "ticketId", raw: "nope" }),
    ).toBe("invalid ticketId: nope");

    expect(describeError({ kind: "empty-subject" })).toBe(
      "subject must not be empty",
    );

    expect(
      describeError({
        kind: "illegal-transition",
        status: "open",
        command: "close",
      }),
    ).toBe("cannot close a ticket that is open");

    expect(
      describeError({
        kind: "wrong-agent",
        expected: agent("agt_ada"),
        actual: agent("agt_bob"),
      }),
    ).toBe("agt_bob is not assigned to this ticket (agt_ada is)");
  });
});

describe("openTicket", () => {
  it("opens a ticket with a trimmed subject", () => {
    expect(value(openTicket("tkt_1", "  Printer on fire  "))).toEqual({
      status: "open",
      id: "tkt_1",
      subject: "Printer on fire",
    });
  });

  it("rejects a bad id before looking at the subject", () => {
    expect(error(openTicket("nope", "   "))).toEqual({
      kind: "invalid-id",
      field: "ticketId",
      raw: "nope",
    });
  });

  it("rejects an empty subject", () => {
    expect(error(openTicket("tkt_1", "   "))).toEqual({ kind: "empty-subject" });
  });
});

describe("applyCommand", () => {
  it("assigns an open ticket", () => {
    expect(value(applyCommand(fresh(), assignTo("agt_ada")))).toEqual({
      status: "assigned",
      id: "tkt_1",
      subject: "Printer on fire",
      assignee: "agt_ada",
    });
  });

  it("reassigns an assigned ticket", () => {
    const assigned = value(applyCommand(fresh(), assignTo("agt_ada")));
    expect(value(applyCommand(assigned, assignTo("agt_bob")))).toEqual({
      status: "assigned",
      id: "tkt_1",
      subject: "Printer on fire",
      assignee: "agt_bob",
    });
  });

  it("resolves only for the assignee", () => {
    const assigned = value(applyCommand(fresh(), assignTo("agt_ada")));

    expect(
      error(
        applyCommand(assigned, {
          type: "resolve",
          agent: agent("agt_bob"),
          resolution: "not mine",
        }),
      ),
    ).toEqual({
      kind: "wrong-agent",
      expected: "agt_ada",
      actual: "agt_bob",
    });

    expect(
      value(
        applyCommand(assigned, {
          type: "resolve",
          agent: agent("agt_ada"),
          resolution: "replaced the fuser",
        }),
      ),
    ).toEqual({
      status: "resolved",
      id: "tkt_1",
      subject: "Printer on fire",
      assignee: "agt_ada",
      resolution: "replaced the fuser",
    });
  });

  it("closes a resolved ticket", () => {
    const closed = value(
      applyAll(fresh(), [
        assignTo("agt_ada"),
        { type: "resolve", agent: agent("agt_ada"), resolution: "fixed" },
        { type: "close", at: 900 },
      ]),
    );

    expect(closed).toEqual({
      status: "closed",
      id: "tkt_1",
      subject: "Printer on fire",
      assignee: "agt_ada",
      resolution: "fixed",
      closedAt: 900,
    });
  });

  it("reopens a resolved ticket back to its assignee, dropping the resolution", () => {
    const reopened = value(
      applyAll(fresh(), [
        assignTo("agt_ada"),
        { type: "resolve", agent: agent("agt_ada"), resolution: "fixed" },
        { type: "reopen", reason: "still broken" },
      ]),
    );

    expect(reopened).toEqual({
      status: "assigned",
      id: "tkt_1",
      subject: "Printer on fire",
      assignee: "agt_ada",
    });
  });

  it("refuses every command an open ticket cannot take", () => {
    const open = fresh();

    expect(error(applyCommand(open, { type: "close", at: 1 })).kind).toBe(
      "illegal-transition",
    );
    expect(
      error(applyCommand(open, { type: "reopen", reason: "x" })).kind,
    ).toBe("illegal-transition");
    expect(
      error(
        applyCommand(open, {
          type: "resolve",
          agent: agent("agt_ada"),
          resolution: "x",
        }),
      ).kind,
    ).toBe("illegal-transition");
  });

  it("reports the status and command it refused", () => {
    expect(error(applyCommand(fresh(), { type: "close", at: 1 }))).toEqual({
      kind: "illegal-transition",
      status: "open",
      command: "close",
    });
  });

  it("treats closed as terminal", () => {
    const closed = value(
      applyAll(fresh(), [
        assignTo("agt_ada"),
        { type: "resolve", agent: agent("agt_ada"), resolution: "fixed" },
        { type: "close", at: 900 },
      ]),
    );

    expect(error(applyCommand(closed, { type: "reopen", reason: "x" }))).toEqual(
      {
        kind: "illegal-transition",
        status: "closed",
        command: "reopen",
      },
    );
  });

  it("does not mutate the ticket it was given", () => {
    const before = fresh();
    applyCommand(before, assignTo("agt_ada"));
    expect(before).toEqual({
      status: "open",
      id: "tkt_1",
      subject: "Printer on fire",
    });
  });
});

describe("applyAll", () => {
  it("runs a whole lifecycle", () => {
    const result = applyAll(fresh(), [
      assignTo("agt_ada"),
      { type: "resolve", agent: agent("agt_ada"), resolution: "fixed" },
      { type: "close", at: 900 },
    ]);

    expect(result.ok).toBe(true);
    expect(summarise(value(result))).toBe("tkt_1: closed — fixed");
  });

  it("stops at the first failure and reports it", () => {
    const result = applyAll(fresh(), [
      assignTo("agt_ada"),
      { type: "close", at: 1 },
      { type: "resolve", agent: agent("agt_ada"), resolution: "fixed" },
    ]);

    expect(error(result)).toEqual({
      kind: "illegal-transition",
      status: "assigned",
      command: "close",
    });
  });

  it("returns the ticket unchanged for an empty command list", () => {
    expect(value(applyAll(fresh(), []))).toEqual(fresh());
  });
});

describe("summarise", () => {
  it("has a line for every state", () => {
    const open = fresh();
    const assigned = value(applyCommand(open, assignTo("agt_ada")));
    const resolved = value(
      applyCommand(assigned, {
        type: "resolve",
        agent: agent("agt_ada"),
        resolution: "replaced the fuser",
      }),
    );
    const closed = value(applyCommand(resolved, { type: "close", at: 900 }));

    expect(summarise(open)).toBe("tkt_1: open — Printer on fire");
    expect(summarise(assigned)).toBe(
      "tkt_1: assigned to agt_ada — Printer on fire",
    );
    expect(summarise(resolved)).toBe(
      "tkt_1: resolved by agt_ada — replaced the fuser",
    );
    expect(summarise(closed)).toBe("tkt_1: closed — replaced the fuser");
  });
});
