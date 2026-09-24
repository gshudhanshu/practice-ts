/**
 * Exercise 19/04 — Async errors
 *
 * The classic Express footgun:
 *
 *     app.get("/users/:id", async (req, res) => {
 *       const user = await db.find(req.params.id);   // rejects
 *       res.json(user);
 *     });
 *
 * The handler returns a promise. The dispatcher calls it and moves on. The
 * rejection has nowhere to go: your four-argument error middleware never fires,
 * the client gets nothing until it times out, and — on Express 4 — Node prints
 * an unhandled rejection warning. A `try/catch` around the dispatcher would not
 * help either, because by the time the promise rejects the call has returned.
 *
 * The fix is one wrapper: take the returned promise, and route its rejection
 * into `next`, which is the only door into the error middleware.
 *
 * (Express 5 does forward rejections from a returned promise, and the types in
 * this repo are @types/express v5. The wrapper still matters — for Express 4,
 * for anything whose return value is discarded, and for handlers that settle in
 * a callback. The TYPE problem is identical in both versions, and it is the
 * type problem this exercise is about.)
 *
 * Read README.md first. Replace every TODO.
 */
import type { NextFunction, Request, Response } from "express";

/** Given — 19/01's aliases, plus the async variant. */
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

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// An error that knows its HTTP status.
//
//   new HttpError(404, "user not found")
//     .status   -> 404, and READONLY
//     .message  -> "user not found"
//     .name     -> "HttpError"
//     instanceof Error -> true
//
// Extend `Error` and pass the message up to `super`. Set `name` so a logged
// stack says what it is.
export class HttpError extends Error {
  // TODO 1: give it a readonly `status` and a (status, message) constructor.
}

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// Normalise anything at all into an HttpError. A `catch` gives you `unknown`
// (03/01, 07/05), and JavaScript really can throw a string.
//
//   an HttpError      -> itself, unchanged
//   any other Error   -> new HttpError(500, error.message)
//   anything else     -> new HttpError(500, "internal error")
export function toHttpError(error: unknown): HttpError {
  throw new Error("TODO 2: implement toHttpError");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// The wrapper. Given an async middleware, return an async middleware that:
//
//   - resolves            -> do nothing extra; `next` is NOT called
//   - rejects             -> call next(error) exactly once
//   - called next itself  -> leave that call alone
//
// Returning the promise (rather than `void`) is deliberate: it keeps the
// wrapper awaitable, which is what makes the spec below able to prove anything.
export function asyncHandler(handler: AsyncMiddleware): AsyncMiddleware {
  throw new Error("TODO 3: implement asyncHandler");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// The error middleware everything funnels into.
//
//   errorMiddleware(log)
//
//   - always push `${status} ${message}` onto `log`
//   - if the response has already started (`res.headersSent`), you cannot
//     answer again: call next(error) and let Express close the connection
//   - otherwise respond with the status and { error: message }
//
// The `headersSent` branch is what stands between you and
// "Cannot set headers after they are sent to the client".
export function errorMiddleware(log: string[]): ErrorMiddleware {
  throw new Error("TODO 4: implement errorMiddleware");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// A miniature of Express's dispatcher, so the footgun can be demonstrated
// rather than described.
//
//   runPipeline(handlers, onError, req, res)
//
//   - await each handler in order, giving it a fresh `next`
//   - it called next()        -> continue to the next handler
//   - it called next(error)   -> stop, and call onError(error, req, res, next)
//                               where that last `next` does nothing
//   - it called neither       -> stop (it answered the request)
//   - all handlers continued  -> resolve
//
// Note what runPipeline must NOT do: it does not try/catch. Express does not
// either, which is the entire point — an unwrapped handler that rejects makes
// this promise reject and `onError` never runs. Wrapping it in `asyncHandler`
// is what changes that, and the spec checks both halves.
export async function runPipeline(
  handlers: readonly AsyncMiddleware[],
  onError: ErrorMiddleware,
  req: Request,
  res: Response,
): Promise<void> {
  throw new Error("TODO 5: implement runPipeline");
}
