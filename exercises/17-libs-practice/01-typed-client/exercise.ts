/**
 * Exercise 17/01 — a typed client over an untyped library
 *
 * `legacy-http.ts` sits next to this file. Every one of its signatures is
 * `any`, which means TypeScript will not stop you calling a method that does
 * not exist, or reading a field that is never sent.
 *
 * You cannot fix the library. You can build a BOUNDARY around it — a thin
 * module that is the only code in the repo allowed to touch it, and whose
 * exports are honestly typed. Everything past the boundary is safe.
 *
 * Two habits do the work:
 *
 *   1. Declare the surface you actually USE, not the whole library. A 12-line
 *      `LegacyClient` type is worth more than a 400-line `.d.ts` you cannot
 *      keep up to date.
 *   2. Hand back `unknown`, never `any`. `unknown` forces the next layer
 *      (17/02) to validate. `any` just moves the crash further away.
 *
 * Read README.md first. Replace every TODO.
 */

import { createClient } from "./legacy-http";

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Describe the slice of `legacy-http` that we use — and nothing more.
//
//   LegacyRequestOptions   an optional `query` of string -> string
//   LegacyClient           request(method, path, options?): Promise<unknown>
//
// `Promise<unknown>` is the important choice. The library really returns `any`;
// declaring `unknown` is how you stop that `any` spreading, and `any` is
// assignable to `unknown`, so the declaration still fits.
//
// Then the shape our own code speaks in:
//
//   HttpResponse           { readonly status: number; readonly body: unknown }
//
// `status` is a number even though the library calls it `statusCode` — the
// boundary is also where wire names become domain names.
export type LegacyRequestOptions = {};

export type LegacyClient = {};

export type HttpResponse = {};

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// One error type for every way a request can fail.
//
//   new HttpError(status, path, message)
//     .status   the HTTP status, or 0 when there was no response at all
//     .path     the path that was requested
//     .message  human-readable, from Error
//     .name     "HttpError"
//
// Plus `isHttpError(value)`, a type predicate, so callers can tell your errors
// from a genuine bug without reaching for `instanceof` everywhere.
export class HttpError extends Error {}

export function isHttpError(value: unknown): boolean {
  throw new Error("TODO 2: implement isHttpError");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Narrow a RESOLVED value from the library into an `HttpResponse`.
//
//   { statusCode: 200, payload: {...}, headers: {...} }  ->  { status: 200, body: {...} }
//   { statusCode: 204 }                                  ->  { status: 204, body: undefined }
//
// Anything else — a string, an array, null, a missing or non-numeric
// `statusCode` — throws `new HttpError(502, path, "malformed response")`.
// 502 is "bad gateway": the upstream said something we cannot parse.
//
// No casts. `typeof raw === "object"` plus the `in` operator narrows `unknown`
// far enough to read a property (07/02, 07/05).
export function toHttpResponse(raw: unknown, path: string): HttpResponse {
  throw new Error("TODO 3: implement toHttpResponse");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Normalise a REJECTION into an HttpError. The library throws four different
// kinds of thing, and callers should have to know about none of them:
//
//   an HttpError already      -> return it unchanged
//   "socket hang up"          -> HttpError(0, path, "socket hang up")
//   an Error instance         -> HttpError(0, path, error.message)
//   { statusCode: 404, error: "no such route" }
//                             -> HttpError(404, path, "no such route")
//   { statusCode: 500 }       -> HttpError(500, path, "request failed")
//   anything else (0, null…)  -> HttpError(0, path, "unknown transport failure")
//
// Status 0 means "the request never got an answer" — the same convention
// XMLHttpRequest uses. 17/03 uses it to decide what is worth retrying.
export function toHttpError(reason: unknown, path: string): HttpError {
  throw new Error("TODO 4: implement toHttpError");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// The boundary itself.
//
//   TypedClient          get(path, query?): Promise<HttpResponse>
//   createTypedClient    wraps a LegacyClient. Rejections go through
//                        toHttpError; resolutions through toHttpResponse; and
//                        any status >= 400 that somehow arrives RESOLVED
//                        throws HttpError(status, path,
//                        `request failed with status ${status}`).
//   connect              the one function that touches `createClient`.
//
// `createClient` returns `any`. Assigning it to a `LegacyClient` variable is
// where the `any` dies: from that line on, the compiler is back in charge.
//
// Note `exactOptionalPropertyTypes` — you cannot pass `{ query: undefined }`
// to something declaring `query?: Record<string, string>` (03/03).
export type TypedClient = {};

export function createTypedClient(legacy: LegacyClient): TypedClient {
  throw new Error("TODO 5: implement createTypedClient");
}

export function connect(baseUrl: string, flakyTimes = 0): TypedClient {
  throw new Error("TODO 5: implement connect");
}

// Keeps the import alive while TODO 5 is unfinished.
void createClient;
