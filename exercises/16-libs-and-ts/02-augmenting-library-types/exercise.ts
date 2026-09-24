/**
 * Exercise 16/02 — augmenting a library's types
 *
 * Middleware attaches things to objects it does not own. A request logger wants
 * `req.context.requestId`; the type came from `@types/node` and you are not
 * going to edit `node_modules`.
 *
 * The answer is **module augmentation**: re-open an interface a dependency
 * declared and add to it. Interfaces are open on purpose — two declarations of
 * the same interface merge into one, wherever they live.
 *
 * The cost is that the addition is global to your program: every file now sees
 * `req.context`, whether or not the middleware that sets it ever ran. That is
 * why the property is optional, and why the reading helpers below have to cope
 * with its absence. Deciding whether that trade is worth it is the real skill.
 *
 * `node:http` is the third-party library here — the same technique, on a type
 * you already have installed. Express's `Request` extends `IncomingMessage`,
 * and 19/02 does exactly this to express.
 *
 * Read README.md first. Replace every TODO.
 */

import type { IncomingMessage } from "node:http";

export type RequestContext = {
  readonly requestId: string;
  readonly startedAt: number;
};

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Augment `node:http` so that every `IncomingMessage` has an optional
// `context` of type `RequestContext`.
//
// A `declare module "<specifier>" { … }` block inside a file that is already a
// module (this one imports, so it is) MERGES into that module. The specifier
// must be the one that resolves — the same string you would `import` from.
//
// Nothing else in this file compiles until the augmentation exists.

/**
 * The slice of a request this exercise touches. `Pick` keeps the tests honest:
 * it only compiles once `context` really is a member of `IncomingMessage`.
 */
export type ContextualRequest = Pick<
  IncomingMessage,
  "method" | "url" | "headers" | "context"
>;

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// Attach a context. `requestId` comes from the `x-request-id` header when there
// is exactly one string value there, and is `"generated"` otherwise.
//
//   attachContext(req, 1_000) with header "abc"   -> req.context = { requestId: "abc", startedAt: 1000 }
//   attachContext(req, 1_000) with no header      -> req.context = { requestId: "generated", startedAt: 1000 }
//
// `noUncheckedIndexedAccess` plus Node's header typing means the header is
// `string | string[] | undefined`. All three cases are real.
export function attachContext(req: ContextualRequest, startedAt: number): void {
  throw new Error("TODO 2: implement attachContext");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Read it back. `contextOf` never throws; `requireContext` throws
// `new Error("request has no context")`.
//
// This pair is the price of augmentation: the type says "might be there", so
// every reader has to decide what to do when it is not.
export function contextOf(req: ContextualRequest): RequestContext | null {
  throw new Error("TODO 3: implement contextOf");
}

export function requireContext(req: ContextualRequest): RequestContext {
  throw new Error("TODO 3: implement requireContext");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Which declarations MERGE when the same name is declared twice, and which are
// a duplicate-identifier error? This is what decides whether augmentation is
// even available to you.
export type DeclarationKind = "interface" | "namespace" | "type-alias" | "class";

export function canMerge(kind: DeclarationKind): boolean {
  throw new Error("TODO 4: implement canMerge");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// Pick the technique. Augmentation is not always the right answer — its reach
// is the whole program, and sometimes that is exactly what you do not want.
export type Technique =
  /** `declare module "pkg" { interface X { … } }` */
  | "module-augmentation"
  /** `declare global { interface Window { … } }` */
  | "global-augmentation"
  /** Declare your own type that contains theirs. */
  | "wrap-it-in-your-own-type"
  /** `(value: TheirType & { extra: T }) => …` in one signature. */
  | "local-intersection";

export type Scenario =
  | "add-a-property-to-a-third-party-interface"
  | "add-a-property-to-window"
  | "the-library-exports-a-type-alias-not-an-interface"
  | "one-function-needs-an-extra-field-and-no-other-file-should-see-it";

export function techniqueFor(scenario: Scenario): Technique {
  throw new Error("TODO 5: implement techniqueFor");
}
