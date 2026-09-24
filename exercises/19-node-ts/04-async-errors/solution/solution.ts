/**
 * Solution — 19/04 Async errors
 */
import type { NextFunction, Request, Response } from "express";

export type Middleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => void;

export type ErrorMiddleware = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => void;

export type AsyncMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;

export class HttpError extends Error {
  // `readonly`: the status belongs to the place that threw, not to whoever
  // catches it later.
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    // Without this, a logged stack says "Error: user not found" and hides
    // which layer produced it.
    this.name = "HttpError";
    this.status = status;
  }
}

export function toHttpError(error: unknown): HttpError {
  // `instanceof` before the more general `Error` check: first match wins, and
  // an HttpError is also an Error.
  if (error instanceof HttpError) return error;

  if (error instanceof Error) return new HttpError(500, error.message);

  // Anything at all can be thrown, so there is no message worth trusting here.
  return new HttpError(500, "internal error");
}

export function asyncHandler(handler: AsyncMiddleware): AsyncMiddleware {
  return async (req, res, next) => {
    try {
      // `await` is what turns a rejected promise into a catchable throw.
      // Without it the try/catch is decorative: the call returns before the
      // promise settles.
      await handler(req, res, next);
    } catch (error) {
      // `next` is the only door into the error middleware. `error` is
      // `unknown` and NextFunction accepts anything, so no narrowing is
      // needed here — the error middleware normalises it.
      next(error);
    }
  };
}

export function errorMiddleware(log: string[]): ErrorMiddleware {
  return (error, _req, res, next) => {
    const httpError = toHttpError(error);
    log.push(`${httpError.status} ${httpError.message}`);

    if (res.headersSent) {
      // The status line has already gone out; touching the response now
      // throws "Cannot set headers after they are sent to the client".
      // Delegating lets Express close the connection instead.
      next(error);
      return;
    }

    res.status(httpError.status).json({ error: httpError.message });
  };
}

export async function runPipeline(
  handlers: readonly AsyncMiddleware[],
  onError: ErrorMiddleware,
  req: Request,
  res: Response,
): Promise<void> {
  const noop: NextFunction = () => {};

  for (const handler of handlers) {
    // Record what the handler did with its `next` rather than tracking it in a
    // narrowed variable: a `let` mutated inside a closure keeps its old
    // narrowing as far as the compiler is concerned, and an array read is
    // `unknown` under `noUncheckedIndexedAccess` — no narrowing to lose.
    const calls: unknown[] = [];
    const next: NextFunction = (error?: unknown) => {
      calls.push(error);
    };

    // Deliberately NOT wrapped in try/catch. Express does not catch either,
    // and that is the behaviour this whole exercise exists to demonstrate: an
    // unwrapped handler that rejects escapes the dispatcher and `onError`
    // never runs.
    await handler(req, res, next);

    // Neither next() nor next(error): the handler answered the request.
    if (calls.length === 0) return;

    const error = calls[0];
    if (error !== undefined) {
      onError(error, req, res, noop);
      return;
    }
  }
}
