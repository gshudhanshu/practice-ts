/**
 * Solution — 17/03 The catalogue service
 */

import { isHttpError, type HttpResponse, type TypedClient } from "./http";
import { fetchProduct, fetchProducts, type Product } from "./catalog";

export type Clock = () => number;
export type Sleep = (ms: number) => Promise<void>;

export type CatalogOptions = {
  readonly client: TypedClient;
  readonly now?: Clock;
  readonly sleep?: Sleep;
  readonly ttlMs?: number;
  readonly maxAttempts?: number;
  readonly baseDelayMs?: number;
};

export type CatalogStats = {
  readonly hits: number;
  readonly misses: number;
  readonly requests: number;
  readonly retries: number;
};

type Query = Readonly<Record<string, string>>;

type CacheEntry = {
  readonly response: HttpResponse;
  readonly storedAt: number;
};

export class CatalogService {
  readonly #origin: TypedClient;
  readonly #now: Clock;
  readonly #sleep: Sleep;
  readonly #ttlMs: number;
  readonly #maxAttempts: number;
  readonly #baseDelayMs: number;

  readonly #cache = new Map<string, CacheEntry>();

  #hits = 0;
  #misses = 0;
  #requests = 0;

  /**
   * The decorated client: cache on the outside, retries inside, the real
   * client at the bottom. This is what catalog.ts is handed, and it is
   * indistinguishable from the plain client as far as the parsers are
   * concerned — the decorator pattern from 06/05.
   */
  readonly client: TypedClient;

  constructor(options: CatalogOptions) {
    this.#origin = options.client;
    this.#now = options.now ?? Date.now;
    this.#sleep =
      options.sleep ??
      ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));
    this.#ttlMs = options.ttlMs ?? 30_000;
    this.#maxAttempts = options.maxAttempts ?? 3;
    this.#baseDelayMs = options.baseDelayMs ?? 100;

    this.client = {
      get: (path, query) => this.#cachedGet(path, query),
    };
  }

  /** `/products?cursor=2&limit=5`, with the keys sorted so order cannot fork. */
  #keyFor(path: string, query: Query | undefined): string {
    if (query === undefined) return path;

    const params = Object.entries(query)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("&");

    return params === "" ? path : `${path}?${params}`;
  }

  async #cachedGet(path: string, query: Query | undefined): Promise<HttpResponse> {
    const key = this.#keyFor(path, query);
    const entry = this.#cache.get(key);

    // An expired entry is a miss, not a hit — but it stays until something
    // successfully replaces it, so a failed refresh does not also lose the
    // stale copy from the map.
    if (entry !== undefined && this.#now() - entry.storedAt < this.#ttlMs) {
      this.#hits += 1;
      return entry.response;
    }

    this.#misses += 1;

    // Only a SUCCESS is stored. Caching a 500 would turn a two-second blip
    // into a ttlMs-long outage.
    const response = await this.#withRetries(path, query);
    this.#cache.set(key, { response, storedAt: this.#now() });

    return response;
  }

  async #withRetries(path: string, query: Query | undefined): Promise<HttpResponse> {
    for (let attempt = 1; ; attempt += 1) {
      this.#requests += 1;

      try {
        return await (query === undefined
          ? this.#origin.get(path)
          : this.#origin.get(path, query));
      } catch (error) {
        // Status 0 means no answer at all; 5xx means the server is having a
        // bad time. Both may work on the next attempt. A 4xx will not, and a
        // ValidationError never will, so neither is retried.
        const retryable =
          isHttpError(error) && (error.status === 0 || error.status >= 500);

        if (!retryable || attempt >= this.#maxAttempts) throw error;

        // Exponential backoff: 100, 200, 400. Retrying immediately in a loop
        // is how a struggling server gets pushed over.
        await this.#sleep(this.#baseDelayMs * 2 ** (attempt - 1));
      }
    }
  }

  async getProduct(id: string): Promise<Product | undefined> {
    try {
      return await fetchProduct(this.client, id);
    } catch (error) {
      // "There is no product p9" is an ANSWER. Every other failure is not, and
      // must keep travelling.
      if (isHttpError(error) && error.status === 404) return undefined;
      throw error;
    }
  }

  async listAllProducts(): Promise<readonly Product[]> {
    const all: Product[] = [];
    const seen = new Set<string>();

    let cursor: string | undefined;

    for (;;) {
      const page = await fetchProducts(this.client, cursor);
      all.push(...page.items);

      if (page.nextCursor === null) return all;

      // A server that keeps handing back the same cursor would otherwise spin
      // for ever — and with the cache in front, without even making a request.
      if (seen.has(page.nextCursor)) return all;

      seen.add(page.nextCursor);
      cursor = page.nextCursor;
    }
  }

  stats(): CatalogStats {
    return {
      hits: this.#hits,
      misses: this.#misses,
      requests: this.#requests,
      // Every request past the first for a given miss was a retry.
      retries: this.#requests - this.#misses,
    };
  }

  invalidate(path?: string): void {
    if (path === undefined) {
      this.#cache.clear();
      return;
    }

    // Prefix matching, so invalidating "/products" also drops every cursor
    // and filter variant of it.
    for (const key of [...this.#cache.keys()]) {
      if (key.startsWith(path)) this.#cache.delete(key);
    }
  }
}
