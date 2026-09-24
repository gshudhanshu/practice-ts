import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import { HttpError, connect, type HttpResponse, type TypedClient } from "./http";
import { ValidationError, fetchProducts, type Product } from "./catalog";
import { CatalogService, type Clock, type Sleep } from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _getProduct = Expect<
  Equal<Awaited<ReturnType<CatalogService["getProduct"]>>, Product | undefined>
>;
type _listAll = Expect<
  Equal<Awaited<ReturnType<CatalogService["listAllProducts"]>>, readonly Product[]>
>;
/** The decorated client must be indistinguishable from a plain one. */
type _client = Expect<Equal<CatalogService["client"], TypedClient>>;
type _invalidate = Expect<
  Equal<ReturnType<CatalogService["invalidate"]>, void>
>;

declare const service: CatalogService;

function _compileTimeOnly(): void {
  // @ts-expect-error — a client is not optional.
  void new CatalogService({});

  // @ts-expect-error — `now` must return a number.
  void new CatalogService({ client: service.client, now: () => "later" });

  // The decorated client is a TypedClient, so the 17/02 parsers accept it
  // without knowing anything about caching.
  void fetchProducts(service.client);

  const stats = service.stats();
  // @ts-expect-error — the counters are a read-only snapshot.
  stats.hits = 99;

  // @ts-expect-error — the decorated client is fixed at construction.
  service.client = service.client;
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

type Call = {
  path: string;
  query: Readonly<Record<string, string>> | undefined;
};

type Reply = () => Promise<HttpResponse>;

const replyWith = (body: unknown, status = 200): Reply => {
  return () => Promise.resolve({ status, body });
};

const replyFailing = (status: number, message = "boom"): Reply => {
  return () => Promise.reject(new HttpError(status, "/scripted", message));
};

/** A TypedClient that answers from a script and records what it was asked. */
function scriptedClient(replies: readonly Reply[]): {
  client: TypedClient;
  calls: Call[];
} {
  const calls: Call[] = [];
  let index = 0;

  const client: TypedClient = {
    get: (path, query) => {
      calls.push({ path, query });
      const reply = replies[Math.min(index, replies.length - 1)];
      index += 1;
      return reply === undefined
        ? Promise.reject(new Error("nothing scripted"))
        : reply();
    },
  };

  return { client, calls };
}

function fakeClock(): { now: Clock; advance: (ms: number) => void } {
  let current = 1_000;
  return {
    now: () => current,
    advance: (ms) => {
      current += ms;
    },
  };
}

function fakeSleep(): { sleep: Sleep; delays: number[] } {
  const delays: number[] = [];
  return {
    sleep: (ms) => {
      delays.push(ms);
      return Promise.resolve();
    },
    delays,
  };
}

const swallow = async (promise: Promise<unknown>): Promise<void> => {
  await promise.catch(() => undefined);
};

const wireProduct = {
  id: "p1",
  title: "Mechanical keyboard",
  price_cents: 8999,
  tags: ["input", "desk"],
  discontinued: false,
};

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("caching", () => {
  it("serves a repeated request without touching the client", async () => {
    const { client, calls } = scriptedClient([replyWith({ ok: 1 })]);
    const service = new CatalogService({ client });

    const first = await service.client.get("/products");
    const second = await service.client.get("/products");

    expect(first).toEqual(second);
    expect(calls).toHaveLength(1);
    expect(service.stats()).toEqual({
      hits: 1,
      misses: 1,
      requests: 1,
      retries: 0,
    });
  });

  it("keys the cache on the query as well as the path", async () => {
    const { client, calls } = scriptedClient([replyWith({ ok: 1 })]);
    const service = new CatalogService({ client });

    await service.client.get("/products");
    await service.client.get("/products", { cursor: "2" });
    await service.client.get("/products", { cursor: "4" });

    expect(calls).toHaveLength(3);
  });

  it("does not care what order the query keys came in", async () => {
    const { client, calls } = scriptedClient([replyWith({ ok: 1 })]);
    const service = new CatalogService({ client });

    await service.client.get("/products", { cursor: "2", limit: "5" });
    await service.client.get("/products", { limit: "5", cursor: "2" });

    expect(calls).toHaveLength(1);
    expect(service.stats().hits).toBe(1);
  });

  it("refetches once the entry has expired", async () => {
    const { client, calls } = scriptedClient([replyWith({ ok: 1 })]);
    const clock = fakeClock();
    const service = new CatalogService({
      client,
      now: clock.now,
      ttlMs: 1_000,
    });

    await service.client.get("/products");
    clock.advance(999);
    await service.client.get("/products");
    expect(calls).toHaveLength(1);

    clock.advance(1);
    await service.client.get("/products");
    expect(calls).toHaveLength(2);
    expect(service.stats()).toEqual({
      hits: 1,
      misses: 2,
      requests: 2,
      retries: 0,
    });
  });

  it("never caches a failure", async () => {
    const { client, calls } = scriptedClient([
      replyFailing(404, "gone"),
      replyWith({ ok: 1 }),
    ]);
    const service = new CatalogService({ client });

    await swallow(service.client.get("/products"));
    await service.client.get("/products");
    await service.client.get("/products");

    expect(calls).toHaveLength(2);
    expect(service.stats().hits).toBe(1);
  });
});

describe("retries", () => {
  it("retries a 5xx with exponential backoff, then succeeds", async () => {
    const { client, calls } = scriptedClient([
      replyFailing(503),
      replyFailing(503),
      replyWith({ ok: 1 }),
    ]);
    const { sleep, delays } = fakeSleep();
    const service = new CatalogService({ client, sleep });

    expect(await service.client.get("/products")).toEqual({
      status: 200,
      body: { ok: 1 },
    });

    expect(calls).toHaveLength(3);
    expect(delays).toEqual([100, 200]);
    expect(service.stats()).toEqual({
      hits: 0,
      misses: 1,
      requests: 3,
      retries: 2,
    });
  });

  it("retries a status-0 transport failure", async () => {
    const { client, calls } = scriptedClient([
      replyFailing(0, "socket hang up"),
      replyWith({ ok: 1 }),
    ]);
    const { sleep, delays } = fakeSleep();
    const service = new CatalogService({ client, sleep });

    await service.client.get("/products");

    expect(calls).toHaveLength(2);
    expect(delays).toEqual([100]);
  });

  it("gives up after maxAttempts and rethrows the last error", async () => {
    const { client, calls } = scriptedClient([replyFailing(500, "still down")]);
    const { sleep, delays } = fakeSleep();
    const service = new CatalogService({
      client,
      sleep,
      maxAttempts: 4,
      baseDelayMs: 10,
    });

    await expect(service.client.get("/products")).rejects.toThrow("still down");

    expect(calls).toHaveLength(4);
    expect(delays).toEqual([10, 20, 40]);
  });

  it("never retries a 4xx", async () => {
    const { client, calls } = scriptedClient([replyFailing(422, "invalid")]);
    const { sleep, delays } = fakeSleep();
    const service = new CatalogService({ client, sleep });

    await expect(service.client.get("/products")).rejects.toThrow("invalid");

    expect(calls).toHaveLength(1);
    expect(delays).toEqual([]);
  });

  it("honours maxAttempts: 1", async () => {
    const { client, calls } = scriptedClient([replyFailing(500)]);
    const service = new CatalogService({
      client,
      sleep: fakeSleep().sleep,
      maxAttempts: 1,
    });

    await swallow(service.client.get("/products"));
    expect(calls).toHaveLength(1);
  });

  it("survives the real library's flaky socket", async () => {
    const { sleep, delays } = fakeSleep();
    const service = new CatalogService({
      client: connect("https://catalog.test", 2),
      sleep,
    });

    expect((await service.client.get("/products")).status).toBe(200);
    expect(delays).toEqual([100, 200]);
    expect(service.stats().requests).toBe(3);
  });
});

describe("getProduct", () => {
  const live = (): CatalogService =>
    new CatalogService({ client: connect("https://catalog.test") });

  it("returns a validated product", async () => {
    expect(await live().getProduct("p4")).toEqual({
      id: "p4",
      name: "USB-C hub",
      priceCents: 5900,
      tags: ["desk"],
      discontinued: true,
    });
  });

  it("returns undefined for a 404 rather than throwing", async () => {
    expect(await live().getProduct("nope")).toBeUndefined();
  });

  it("caches, so the second lookup costs nothing", async () => {
    const service = live();

    await service.getProduct("p1");
    await service.getProduct("p1");

    expect(service.stats()).toEqual({
      hits: 1,
      misses: 1,
      requests: 1,
      retries: 0,
    });
  });

  it("lets a ValidationError through, and does not retry it", async () => {
    const { client, calls } = scriptedClient([replyWith({ id: "p1" })]);
    const service = new CatalogService({ client, sleep: fakeSleep().sleep });

    await expect(service.getProduct("p1")).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(calls).toHaveLength(1);
  });

  it("does not swallow a 500", async () => {
    const { client } = scriptedClient([replyFailing(500, "upstream down")]);
    const service = new CatalogService({
      client,
      sleep: fakeSleep().sleep,
      maxAttempts: 2,
    });

    await expect(service.getProduct("p1")).rejects.toThrow("upstream down");
  });
});

describe("listAllProducts", () => {
  it("follows every cursor to the end", async () => {
    const service = new CatalogService({
      client: connect("https://catalog.test"),
    });

    const products = await service.listAllProducts();

    expect(products.map((product) => product.id)).toEqual([
      "p1",
      "p2",
      "p3",
      "p4",
      "p5",
    ]);
    expect(service.stats().requests).toBe(3);
  });

  it("stops when a server repeats a cursor", async () => {
    const { client } = scriptedClient([
      replyWith({ items: [wireProduct], next_cursor: "2" }),
    ]);
    const service = new CatalogService({ client });

    const products = await service.listAllProducts();

    expect(products.map((product) => product.id)).toEqual(["p1", "p1"]);
  });
});

describe("invalidate", () => {
  it("drops every entry under a path prefix", async () => {
    const { client, calls } = scriptedClient([replyWith({ ok: 1 })]);
    const service = new CatalogService({ client });

    await service.client.get("/products");
    await service.client.get("/products", { cursor: "2" });
    await service.client.get("/health");
    expect(calls).toHaveLength(3);

    service.invalidate("/products");

    await service.client.get("/products");
    await service.client.get("/products", { cursor: "2" });
    await service.client.get("/health");

    expect(calls).toHaveLength(5);
    expect(service.stats().hits).toBe(1);
  });

  it("clears everything when called with no argument", async () => {
    const { client, calls } = scriptedClient([replyWith({ ok: 1 })]);
    const service = new CatalogService({ client });

    await service.client.get("/products");
    await service.client.get("/health");
    service.invalidate();
    await service.client.get("/products");
    await service.client.get("/health");

    expect(calls).toHaveLength(4);
    expect(service.stats().hits).toBe(0);
  });
});
