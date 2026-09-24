/**
 * Solution — 16/02 Augmenting library types
 */

import type { IncomingMessage } from "node:http";

export type RequestContext = {
  readonly requestId: string;
  readonly startedAt: number;
};

// Module augmentation. This file has a top-level `import`, so it is a module,
// so `declare module` MERGES into the named module rather than declaring a new
// ambient one. The specifier must resolve — "node:http" is the module that
// declares IncomingMessage.
//
// `context` is optional because it is optional in reality: the type is now
// visible to every file in the program, including code that runs before any
// middleware has attached anything.
declare module "node:http" {
  interface IncomingMessage {
    context?: RequestContext;
  }
}

export type ContextualRequest = Pick<
  IncomingMessage,
  "method" | "url" | "headers" | "context"
>;

export function attachContext(req: ContextualRequest, startedAt: number): void {
  const header = req.headers["x-request-id"];

  // Node gives you `string | string[] | undefined`: absent, present once, or
  // repeated. Only the middle case is a request id; picking [0] out of the
  // array would be inventing data.
  const requestId = typeof header === "string" ? header : "generated";

  req.context = { requestId, startedAt };
}

export function contextOf(req: ContextualRequest): RequestContext | null {
  return req.context ?? null;
}

export function requireContext(req: ContextualRequest): RequestContext {
  const context = contextOf(req);
  if (context === null) {
    throw new Error("request has no context");
  }

  return context;
}

export type DeclarationKind = "interface" | "namespace" | "type-alias" | "class";

export function canMerge(kind: DeclarationKind): boolean {
  // Interfaces and namespaces are OPEN: two declarations of the same name
  // combine. Type aliases and classes are closed — a second declaration is
  // "Duplicate identifier". That is the whole reason libraries expose
  // extension points as interfaces.
  const mergeable: Record<DeclarationKind, boolean> = {
    interface: true,
    namespace: true,
    "type-alias": false,
    class: false,
  };

  return mergeable[kind];
}

export type Technique =
  | "module-augmentation"
  | "global-augmentation"
  | "wrap-it-in-your-own-type"
  | "local-intersection";

export type Scenario =
  | "add-a-property-to-a-third-party-interface"
  | "add-a-property-to-window"
  | "the-library-exports-a-type-alias-not-an-interface"
  | "one-function-needs-an-extra-field-and-no-other-file-should-see-it";

export function techniqueFor(scenario: Scenario): Technique {
  const techniques: Record<Scenario, Technique> = {
    "add-a-property-to-a-third-party-interface": "module-augmentation",
    "add-a-property-to-window": "global-augmentation",
    // You cannot merge into an alias, so contain it instead.
    "the-library-exports-a-type-alias-not-an-interface":
      "wrap-it-in-your-own-type",
    // Augmentation is program-wide; an intersection in one signature is not.
    "one-function-needs-an-extra-field-and-no-other-file-should-see-it":
      "local-intersection",
  };

  return techniques[scenario];
}
