/**
 * Solution — 19/02 Augmenting the request
 */
import type { NextFunction, Request, Response } from "express";

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

/**
 * Declaration merging into somebody else's package.
 *
 * `interface` declarations with the same name in the same scope merge, so this
 * block ADDS a property to Express's own `Request` rather than shadowing it.
 * Name the module that DECLARES the interface — `express-serve-static-core`.
 * `@types/express` merely re-exports it. (With v5 of the types, augmenting
 * "express" happens to merge too; the declaring module is correct under both
 * major versions, so it is the portable choice. See EXPLANATION.md.)
 *
 * Optional, because a request is unauthenticated until something
 * authenticates it. Saying `user: AuthUser` here would be a lie that every
 * handler then has to pay for.
 */
declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
  }
}

export function authenticate(
  tokens: ReadonlyMap<string, AuthUser>,
): Middleware {
  return (req, res, next) => {
    const header = req.headers.authorization;

    // Split rather than slice: it rejects "Bearer" alone, "Bearer  x" and
    // "Bearer x y" without a regular expression.
    const parts = header === undefined ? [] : header.split(" ");
    const scheme = parts[0];
    const token = parts[1];

    if (parts.length !== 2 || scheme !== "Bearer" || token === undefined) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }

    const user = tokens.get(token);
    if (user === undefined) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }

    // The assignment the augmentation exists for. No cast, and if `AuthUser`
    // ever changes shape this line stops compiling.
    req.user = user;
    next();
  };
}

export function requireRole(role: string): Middleware {
  return (req, res, next) => {
    const user = req.user;

    // 401 and 403 answer different questions: "who are you?" versus "I know
    // who you are, and no".
    if (user === undefined) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }

    if (!user.roles.includes(role)) {
      res.status(403).json({ error: "forbidden" });
      return;
    }

    next();
  };
}

/**
 * The intersection collapses `AuthUser | undefined` with `AuthUser` down to
 * `AuthUser`, so the property stops being optional — without restating the
 * hundred-odd members of `Request`.
 */
export type AuthenticatedRequest = Request & { user: AuthUser };

// A type PREDICATE, not an assertion function: an unauthenticated request is an
// expected outcome the caller responds to, not a bug worth throwing over
// (07/05 draws that line).
export function isAuthenticated(req: Request): req is AuthenticatedRequest {
  return req.user !== undefined;
}

export type AuthenticatedHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => void;

export function withUser(handler: AuthenticatedHandler): Middleware {
  return (req, res, next) => {
    // Checking `req.user !== undefined` inline would narrow the PROPERTY but
    // leave `req` a plain `Request`, which is not assignable to
    // `AuthenticatedRequest`. The predicate narrows the request itself, which
    // is what the handler's parameter needs.
    if (!isAuthenticated(req)) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }

    handler(req, res, next);
  };
}
