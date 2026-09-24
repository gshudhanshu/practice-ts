/**
 * Exercise 17/02 — the runtime validation boundary
 *
 * 17/01 tamed the library's SHAPE: one error type, one response envelope, and
 * a body typed `unknown`. That `unknown` is now the problem. It is honest —
 * nobody has checked the payload — but nothing can be done with it.
 *
 * Writing `const product = response.body as Product` would compile and would
 * be a lie: the wire sends `title`, not `name`, and `price_cents`, not
 * `priceCents`. A cast is a promise to the compiler that you have not kept.
 *
 * The only thing that can turn `unknown` into `Product` honestly is code that
 * LOOKS at the value at runtime. That is what you are writing: small parsers
 * that compose, each of which either returns the type it promises or throws
 * with the exact path that failed.
 *
 * This is 07/05's assertion functions applied, not re-taught — `assertIsRecord`
 * is given below.
 *
 * Read README.md first. Replace every TODO.
 */

import type { TypedClient } from "./http";

/* ── The domain (the target) ────────────────────────────────────────────── */

export type Product = {
  readonly id: string;
  readonly name: string;
  readonly priceCents: number;
  readonly tags: readonly string[];
  readonly discontinued: boolean;
};

export type ProductPage = {
  readonly items: readonly Product[];
  readonly nextCursor: string | null;
};

/* ── Given: the plumbing you already know how to write ──────────────────── */

/**
 * Thrown when the wire does not match the domain. `path` says WHERE, so a
 * production log line reads `body.items[3].price_cents: expected an integer`
 * instead of "invalid response".
 */
export class ValidationError extends Error {
  constructor(
    readonly path: string,
    readonly detail: string,
  ) {
    super(`${path}: ${detail}`);
    this.name = "ValidationError";
  }
}

/**
 * A parser turns an unchecked value into a `T`, or throws. `path` is threaded
 * through purely for the error message.
 */
export type Parser<T> = (value: unknown, path: string) => T;

/** From 07/05. Given, so you apply it rather than rewrite it. */
export function assertIsRecord(
  value: unknown,
  path: string,
): asserts value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ValidationError(path, "expected an object");
  }
}

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// The three leaf parsers. Each returns the value when it is right, and throws
// a ValidationError with the given path when it is not:
//
//   asString   "expected a string"
//   asInteger  "expected an integer"   — must be a NUMBER and Number.isInteger
//   asBoolean  "expected a boolean"
//
// Note the type: `Parser<string>` already fixes both parameters, so the
// annotation does the work and the arrow needs none.
export const asString: Parser<string> = () => {
  throw new Error("TODO 1: implement asString");
};

export const asInteger: Parser<number> = () => {
  throw new Error("TODO 1: implement asInteger");
};

export const asBoolean: Parser<boolean> = () => {
  throw new Error("TODO 1: implement asBoolean");
};

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// The first combinator: a parser that BUILDS a parser.
//
//   arrayOf(asString)(["a", "b"], "tags")  ->  ["a", "b"]
//   arrayOf(asString)("nope", "tags")      ->  throws `tags: expected an array`
//   arrayOf(asString)(["a", 2], "tags")    ->  throws `tags[1]: expected a string`
//
// The element path is `${path}[${index}]`. Getting that right is what makes a
// 400-item page debuggable.
export function arrayOf<T>(item: Parser<T>): Parser<readonly T[]> {
  throw new Error("TODO 2: implement arrayOf");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Two more combinators, for the two ways a field can legitimately be absent.
//
//   withDefault(asBoolean, false)   undefined -> false, anything else -> inner
//   nullable(asString)              null      -> null,  anything else -> inner
//
// They compose: `withDefault(nullable(asString), null)` accepts a string, an
// explicit null, or a missing key.
export function withDefault<T>(inner: Parser<T>, fallback: T): Parser<T> {
  throw new Error("TODO 3: implement withDefault");
}

export function nullable<T>(inner: Parser<T>): Parser<T | null> {
  throw new Error("TODO 3: implement nullable");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// One wire product -> one domain Product. The wire shape is:
//
//   { id: "p1", title: "…", price_cents: 8999, tags: ["…"], discontinued?: boolean }
//
// so the parser RENAMES as it validates: `title` -> `name`,
// `price_cents` -> `priceCents`, and a missing `discontinued` means `false`.
//
// Field paths use the WIRE name, because that is what the person reading the
// log has in front of them: `body.items[0].price_cents`.
export const parseProduct: Parser<Product> = () => {
  throw new Error("TODO 4: implement parseProduct");
};

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// The page, and the two functions the rest of the app actually calls.
//
//   parseProductPage   { items: [...], next_cursor: "2" | null | absent }
//                      -> { items, nextCursor }
//                      An absent next_cursor means null.
//
//   fetchProducts(client, cursor?)  GET /products (with `{ cursor }` when
//                      given), then parse the body under the path "body".
//
//   fetchProduct(client, id)        GET /products/:id, parsed under "body".
//
// Neither fetch function catches anything: an HttpError from the boundary and
// a ValidationError from the parsers are both worth propagating, and they mean
// genuinely different things.
export const parseProductPage: Parser<ProductPage> = () => {
  throw new Error("TODO 5: implement parseProductPage");
};

export function fetchProducts(
  client: TypedClient,
  cursor?: string,
): Promise<ProductPage> {
  throw new Error("TODO 5: implement fetchProducts");
}

export function fetchProduct(
  client: TypedClient,
  id: string,
): Promise<Product> {
  throw new Error("TODO 5: implement fetchProduct");
}
