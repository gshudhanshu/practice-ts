/**
 * Exercise 19/02 — Augmenting the request
 *
 * Every real Express app hangs something off `req`: the authenticated user, a
 * request id, a tenant, a database transaction. Express itself has no idea
 * those exist, so out of the box `req.user` is a compile error.
 *
 * There are two ways out, and only one of them is a type:
 *
 *     (req as any).user          a lie. Nothing checks it, ever.
 *     declare module …           declaration merging. Real, checked, shared.
 *
 * Declaration merging is 06/04 applied to somebody else's library: `interface`
 * declarations with the same name in the same scope MERGE, so you can add a
 * property to an interface you do not own. Express's `Request` lives in
 * `express-serve-static-core` (the package `@types/express` re-exports), which
 * is the module you augment.
 *
 * Read README.md first. Replace every TODO.
 */
import type { NextFunction, Request, Response } from "express";

/** Given — the shape 19/01 built. */
export type Middleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => void;

export type AuthUser = {
  id: string;
  name: string;
  roles: readonly string[];
};

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Add `user?: AuthUser` to Express's `Request`, so that every file in this
// program can read `req.user` with no cast anywhere.
//
// The shape is a `declare module` block augmenting "express-serve-static-core",
// containing an `interface Request` with the one new property. It must be
// OPTIONAL: a request is unauthenticated until some middleware authenticates
// it, and the type has to say so.
//
// Two consequences worth knowing before you write it:
//   - the block only merges if this file is a module (it is — it has imports)
//   - `exactOptionalPropertyTypes` means `req.user = undefined` will NOT
//     compile. Deleting the key is how you express "no user" (03/03).
//
// (write the declaration merging block here)

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// The middleware that puts the user there.
//
//   authenticate(new Map([["tok", ada]]))
//
//   - `authorization` header exactly "Bearer <token>" and the token is in the
//     map              -> set req.user and call next()
//   - anything else    -> res.status(401).json({ error: "unauthorized" })
//                         and DO NOT call next
//
// "anything else" covers: no header, a scheme other than Bearer, a missing
// token, extra whitespace-separated parts, and an unknown token.
export function authenticate(tokens: ReadonlyMap<string, AuthUser>): Middleware {
  throw new Error("TODO 2: implement authenticate");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Authorisation, which is a different question from authentication — and gets
// a different status code.
//
//   requireRole("admin")
//
//   - no req.user          -> 401 { error: "unauthorized" }   (who are you?)
//   - user without role    -> 403 { error: "forbidden" }      (I know, and no)
//   - user with the role   -> next()
export function requireRole(role: string): Middleware {
  throw new Error("TODO 3: implement requireRole");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// `req.user` is optional, so every handler that needs it starts with the same
// check. Give that check a type.
//
//   AuthenticatedRequest   a Request whose `user` is definitely there
//   isAuthenticated(req)   a type predicate narrowing to it
//
// A PREDICATE, not an assertion function (07/05): an unauthenticated request is
// an expected outcome that the caller handles, not a bug worth throwing over.
export type AuthenticatedRequest = unknown;

export function isAuthenticated(req: Request): boolean {
  throw new Error("TODO 4: implement isAuthenticated");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// The payoff. Wrap a handler that REQUIRES a user, so the handler itself never
// has to check.
//
//   withUser((req, res) => res.status(200).json({ name: req.user.name }))
//
//   - no user -> res.status(401).json({ error: "unauthorized" }), and the
//                wrapped handler is never called
//   - a user  -> call the handler with the same (req, res, next)
//
// Note what `AuthenticatedHandler` buys: inside it, `req.user` is `AuthUser`,
// not `AuthUser | undefined`. That is the whole reason to bother with a
// narrowed request type rather than an `!` at every use site.
export type AuthenticatedHandler = unknown;

export function withUser(handler: AuthenticatedHandler): Middleware {
  throw new Error("TODO 5: implement withUser");
}
