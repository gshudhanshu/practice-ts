/**
 * Exercise 19/01 — Typing Express middleware
 *
 * An Express app is a list of functions with one shape:
 *
 *     (req, res, next) => void
 *
 * and one rule about how each one ends:
 *
 *     next()          hand over to the next middleware
 *     next(error)     skip every remaining middleware and jump to the
 *                     four-argument ERROR middleware
 *     neither         you answered the request yourself; the chain stops
 *
 * Getting that ending wrong is the most common Express bug there is: forget to
 * call `next` and the request hangs until the client times out; call it after
 * you already responded and you get "Cannot set headers after they are sent".
 *
 * Nothing here starts a server. A middleware is a pure function of
 * (req, res, next), so it can be tested by calling it — which is exactly what
 * `exercise.test.ts` does.
 *
 * `express` itself is not installed, only its types, so every import of it in
 * this section must be `import type`.
 *
 * Read README.md first. Replace every TODO.
 */
import type { NextFunction, Request, Response } from "express";

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// The two signatures the whole section is built on.
//
//   Middleware       (req, res, next) => void
//   ErrorMiddleware  (error, req, res, next) => void
//
// Use `Request`, `Response` and `NextFunction` from the import above. Type the
// error as `unknown`, NOT `any` — anything at all can be thrown in JavaScript,
// and `unknown` is the honest way to say so (02/06).
//
// Express recognises an error middleware by its ARITY: four declared
// parameters. Three and it is treated as ordinary middleware and never sees
// an error at all.
export type Middleware = unknown;
export type ErrorMiddleware = unknown;

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// A middleware FACTORY: a function that takes configuration and returns a
// middleware closed over it. This is how a middleware gets parameters at all —
// Express only ever calls it with (req, res, next).
//
//   requireHeader("x-api-key", "missing api key")
//
// The returned middleware:
//   - `req.headers[header]` is a non-empty string (after trimming)  -> next()
//   - anything else (missing, empty, or an array of values)         -> next(new Error(message))
//
// Node lowercases incoming header names, so assume `header` is already
// lowercase. Note the type of `req.headers[header]`: a header can legally
// appear more than once, so it is `string | string[] | undefined`.
export function requireHeader(header: string, message: string): Middleware {
  throw new Error("TODO 2: implement requireHeader");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// A middleware that can END the chain instead of continuing it.
//
//   limitBodySize(1000)
//
//   - no `content-length` header                 -> next()
//   - present but not a finite number            -> next(new Error("invalid content-length"))
//   - a number greater than maxBytes             -> res.status(413).json({ error: "payload too large" })
//                                                   and DO NOT call next
//   - otherwise                                  -> next()
//
// Answering the request and calling `next()` is the bug this TODO exists to
// make you feel: pick one.
export function limitBodySize(maxBytes: number): Middleware {
  throw new Error("TODO 3: implement limitBodySize");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Compose several middlewares into one. This is `app.use` in miniature, and
// writing it is the fastest way to understand what `next` actually is.
//
//   chain(a, b, c)
//
//   - run them in order, each receiving a `next` that advances to the one
//     after it
//   - when a middleware calls next(error), stop and call the OUTER next(error)
//   - when a middleware calls next() and it was the last one, call the OUTER
//     next() with no argument
//   - when a middleware calls neither (it responded), stop: the outer next is
//     never called
//   - chain() with no arguments calls the outer next() once
export function chain(...middlewares: readonly Middleware[]): Middleware {
  throw new Error("TODO 4: implement chain");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// The four-argument error middleware — the thing every `next(error)` above
// eventually reaches.
//
//   - if the thrown value is an object carrying an integer `status` between
//     400 and 599, respond with that status
//   - otherwise respond 500
//   - body is always { error: message }, where message is `error.message` when
//     the value is an Error, and "internal error" when it is not
//
// `error` is `unknown`, so narrow it — no casts.
export const errorHandler: ErrorMiddleware = () => {
  throw new Error("TODO 5: implement errorHandler");
};
