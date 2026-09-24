/**
 * Solution — 19/01 Typing Express middleware
 */
import type { NextFunction, Request, Response } from "express";

// The three-argument shape. `Middleware` is deliberately hand-written rather
// than aliased to Express's own `RequestHandler`: writing it out is what makes
// the contract visible, and the test proves it is still assignable to
// `RequestHandler`, so Express accepts it anywhere.
export type Middleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => void;

// Four parameters, and `error` is `unknown` — JavaScript can throw anything, so
// `any` would be a lie. Express identifies an error middleware by arity alone.
export type ErrorMiddleware = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => void;

export function requireHeader(header: string, message: string): Middleware {
  // The factory closes over its configuration; the returned function has the
  // exact shape Express calls.
  return (req, _res, next) => {
    // Indexing with a `string` hits IncomingHttpHeaders' index signature, so
    // the value is `string | string[] | undefined` — a header may repeat.
    const value = req.headers[header];

    if (typeof value !== "string" || value.trim() === "") {
      // Forward, do not respond. One error middleware then owns the response
      // shape for the whole app.
      next(new Error(message));
      return;
    }

    next();
  };
}

export function limitBodySize(maxBytes: number): Middleware {
  return (req, res, next) => {
    // A KNOWN header key is declared as `string | undefined` in
    // IncomingHttpHeaders, so no array case to handle here.
    const raw = req.headers["content-length"];
    if (raw === undefined) {
      next();
      return;
    }

    const size = Number(raw);
    if (!Number.isFinite(size)) {
      next(new Error("invalid content-length"));
      return;
    }

    if (size > maxBytes) {
      res.status(413).json({ error: "payload too large" });
      // No `next()`. The request is answered; continuing would eventually
      // produce "Cannot set headers after they are sent to the client".
      return;
    }

    next();
  };
}

export function chain(...middlewares: readonly Middleware[]): Middleware {
  return (req, res, next) => {
    // `next` is not magic: it is just the continuation. Building it by hand is
    // the whole of what Express's dispatcher does.
    const step = (index: number): void => {
      const middleware = middlewares[index];

      // `noUncheckedIndexedAccess` forces this check, and it doubles as the
      // "ran out of middlewares" case.
      if (middleware === undefined) {
        next();
        return;
      }

      middleware(req, res, (error?: unknown) => {
        if (error !== undefined) {
          next(error);
          return;
        }
        step(index + 1);
      });
    };

    step(0);
  };
}

/**
 * Read an HTTP status off an arbitrary thrown value, without a cast.
 *
 * `"status" in error` narrows `error` to something with that key, and the
 * property is `unknown` — so every check below is still required.
 */
function statusOf(error: unknown): number {
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = error.status;
    if (
      typeof status === "number" &&
      Number.isInteger(status) &&
      status >= 400 &&
      status <= 599
    ) {
      return status;
    }
  }

  return 500;
}

export const errorHandler: ErrorMiddleware = (error, _req, res, _next) => {
  // Only an actual Error is trusted for the message. Echoing an arbitrary
  // thrown value back to the client leaks internals.
  const message = error instanceof Error ? error.message : "internal error";
  res.status(statusOf(error)).json({ error: message });
};
