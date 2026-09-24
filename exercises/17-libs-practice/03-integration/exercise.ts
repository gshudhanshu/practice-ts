/**
 * Exercise 17/03 — CHALLENGE: the catalogue service
 *
 * The section-17 boss fight, and the point of the whole project. You have:
 *
 *   legacy-http.ts   the untyped dependency
 *   http.ts          the typed boundary        (17/01)
 *   catalog.ts       the validation boundary   (17/02)
 *
 * What is missing is everything a real service needs around them: not every
 * request should hit the network twice, and not every failure deserves to
 * reach the user.
 *
 * The shape that makes this pleasant is the DECORATOR from 06/05. `fetchProducts`
 * takes a `TypedClient`; so you build a `TypedClient` that caches and retries
 * and hand it over. The parsers never learn that caching exists, and the cache
 * never learns what a Product is.
 *
 * Everything time-dependent is INJECTED — `now` and `sleep` are constructor
 * options. A service that calls `Date.now()` and `setTimeout` directly can only
 * be tested by actually waiting, which is how test suites end up taking four
 * minutes.
 *
 * Read README.md first. Replace every TODO.
 */

import type { TypedClient } from "./http";
import type { Product } from "./catalog";

/** Injected so tests can move time without waiting. */
export type Clock = () => number;
export type Sleep = (ms: number) => Promise<void>;

export type CatalogOptions = {
  readonly client: TypedClient;
  /** Default: `Date.now`. */
  readonly now?: Clock;
  /** Default: a real `setTimeout`. */
  readonly sleep?: Sleep;
  /** How long a cached response stays fresh. Default 30_000. */
  readonly ttlMs?: number;
  /** Total attempts, first one included. Default 3. */
  readonly maxAttempts?: number;
  /** First backoff step; it doubles each retry. Default 100. */
  readonly baseDelayMs?: number;
};

export type CatalogStats = {
  /** `get` calls answered from a live cache entry. */
  readonly hits: number;
  /** `get` calls that had to ask the underlying client. */
  readonly misses: number;
  /** Calls actually made to the underlying client, retries included. */
  readonly requests: number;
  /** `requests - misses`. */
  readonly retries: number;
};

export class CatalogService {
  // ─── TODO 1 ────────────────────────────────────────────────────────────────
  // Storage and settings.
  //   - keep the injected client, clock, sleep and the three numbers, applying
  //     the defaults above
  //   - a cache of path+query -> { response, storedAt }
  //   - four counters for `stats()`
  //   - `readonly client: TypedClient` — the DECORATED client, the thing you
  //     hand to catalog.ts. Build it in the constructor.
  //
  // The cache key must include the query, so `/products` and
  // `/products?cursor=2` are different entries. Sort the query keys, or
  // `{ a, b }` and `{ b, a }` become two entries for one request.

  // ─── TODO 2 ────────────────────────────────────────────────────────────────
  // The retry policy, wrapped around a single client call.
  //
  //   retry when   isHttpError(error) && (status === 0 || status >= 500)
  //   never retry  4xx (you asked for the wrong thing — asking again will not
  //                help) or a ValidationError (the contract is broken)
  //   at most      maxAttempts attempts in total
  //   waiting      baseDelayMs * 2 ** (attempt - 1)  ->  100, 200, 400 …
  //
  // Count every attempt in `requests`. When the attempts run out, rethrow the
  // last error unchanged — swallowing it here would hide a real outage.

  // ─── TODO 3 ────────────────────────────────────────────────────────────────
  // The cache, wrapped around the retry policy.
  //
  //   - a live entry (now() - storedAt < ttlMs) is a HIT: return it without
  //     touching the client
  //   - anything else is a MISS: send the request, and store the response
  //   - only SUCCESSES are cached. Caching a failure turns a blip into an
  //     outage that lasts until the TTL expires.
  //
  // Note the order: cache OUTSIDE retry. A cache hit should cost zero requests,
  // and a retried request should be stored once, not three times.

  // ─── TODO 4 ────────────────────────────────────────────────────────────────
  // One product, validated, using `fetchProduct` from ./catalog with YOUR
  // decorated client.
  //
  //   found      -> the Product
  //   404        -> undefined   (a missing product is an answer, not a failure)
  //   anything else propagates unchanged
  getProduct(id: string): Promise<Product | undefined> {
    throw new Error("TODO 4: implement getProduct");
  }

  // ─── TODO 5 ────────────────────────────────────────────────────────────────
  // The rest of the surface.
  //
  //   listAllProducts()  follow `nextCursor` until it is null, concatenating
  //                      the pages in order. If a cursor REPEATS, stop — a
  //                      server bug must not become an infinite loop.
  //   stats()            the four counters
  //   invalidate(path?)  drop every entry whose key starts with `path`, or the
  //                      whole cache when called with no argument
  listAllProducts(): Promise<readonly Product[]> {
    throw new Error("TODO 5: implement listAllProducts");
  }

  stats(): CatalogStats {
    throw new Error("TODO 5: implement stats");
  }

  invalidate(path?: string): void {
    throw new Error("TODO 5: implement invalidate");
  }
}
