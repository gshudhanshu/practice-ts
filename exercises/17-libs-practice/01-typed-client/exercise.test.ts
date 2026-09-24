import { describe, expect, it } from "vitest";
import type { Equal, Expect, Extends, IsAny } from "../../../src/type-testing";
import { createClient } from "./legacy-http";
import {
  HttpError,
  connect,
  createTypedClient,
  isHttpError,
  toHttpError,
  toHttpResponse,
  type HttpResponse,
  type LegacyClient,
  type LegacyRequestOptions,
  type TypedClient,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

/** This is the problem. Everything below is the fix. */
type _libraryIsAny = Expect<IsAny<ReturnType<typeof createClient>>>;

type _status = Expect<Equal<HttpResponse["status"], number>>;
/** `unknown`, NOT `any` — the next layer must validate before reading it. */
type _body = Expect<Equal<HttpResponse["body"], unknown>>;

type _getReturns = Expect<
  Equal<Awaited<ReturnType<TypedClient["get"]>>, HttpResponse>
>;
type _connectReturns = Expect<Equal<ReturnType<typeof connect>, TypedClient>>;
type _toHttpError = Expect<Equal<ReturnType<typeof toHttpError>, HttpError>>;
type _httpErrorIsError = Expect<Extends<HttpError, Error>>;

function _compileTimeOnly(): void {
  // An `any` from the library is assignable to our honest declaration — which
  // is why a hand-written surface type costs nothing to adopt.
  const legacy: LegacyClient = createClient({ baseUrl: "https://x.test" });

  // @ts-expect-error — `request` is the only method the boundary declares.
  legacy.reqeust("GET", "/products");

  // @ts-expect-error — the query is string -> string, not anything at all.
  void legacy.request("GET", "/products", { query: { limit: 2 } });

  const client = connect("https://x.test");

  void client.get("/products").then((response) => {
    // @ts-expect-error — the body is `unknown` until something validates it.
    return response.body.items;
  });

  // @ts-expect-error — an HttpError needs a status, a path and a message.
  void new HttpError("boom");

  const error: unknown = null;
  if (isHttpError(error)) {
    // The predicate must narrow, not merely return a boolean.
    const status: number = error.status;
    void status;
  }
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

type Recorded = {
  method: string;
  path: string;
  options: LegacyRequestOptions | undefined;
};

/** A stand-in for the library that records what it was asked for. */
function recordingClient(reply: () => Promise<unknown>): {
  client: LegacyClient;
  calls: Recorded[];
} {
  const calls: Recorded[] = [];

  const client: LegacyClient = {
    request(
      method: string,
      path: string,
      options?: LegacyRequestOptions,
    ): Promise<unknown> {
      calls.push({ method, path, options });
      return reply();
    },
  };

  return { client, calls };
}

async function rejectionOf(promise: Promise<unknown>): Promise<HttpError> {
  try {
    await promise;
  } catch (reason) {
    if (reason instanceof HttpError) return reason;
    throw reason;
  }
  throw new Error("expected the request to reject");
}

function throwOf(fn: () => unknown): HttpError {
  try {
    fn();
  } catch (reason) {
    if (reason instanceof HttpError) return reason;
    throw reason;
  }
  throw new Error("expected a throw");
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("HttpError", () => {
  it("carries a status, a path and a name", () => {
    const error = new HttpError(503, "/products", "upstream is down");

    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(503);
    expect(error.path).toBe("/products");
    expect(error.message).toBe("upstream is down");
    expect(error.name).toBe("HttpError");
  });

  it("is recognised by isHttpError, and nothing else is", () => {
    expect(isHttpError(new HttpError(404, "/x", "nope"))).toBe(true);
    expect(isHttpError(new Error("nope"))).toBe(false);
    expect(isHttpError({ status: 404 })).toBe(false);
    expect(isHttpError("404")).toBe(false);
    expect(isHttpError(null)).toBe(false);
  });
});

describe("toHttpResponse", () => {
  it("renames the envelope and keeps the body untouched", () => {
    expect(
      toHttpResponse(
        { statusCode: 200, payload: { items: [] }, headers: {} },
        "/products",
      ),
    ).toEqual({ status: 200, body: { items: [] } });
  });

  it("treats a missing payload as an undefined body", () => {
    const response = toHttpResponse({ statusCode: 204 }, "/products");
    expect(response.status).toBe(204);
    expect(response.body).toBeUndefined();
  });

  it("keeps a non-2xx status rather than throwing", () => {
    expect(toHttpResponse({ statusCode: 404, payload: null }, "/x").status).toBe(
      404,
    );
  });

  it.each([
    ["null", null],
    ["a string", "oops"],
    ["an array", [1, 2]],
    ["an object with no statusCode", { payload: {} }],
    ["a non-numeric statusCode", { statusCode: "200" }],
  ])("rejects %s as malformed", (_label, raw) => {
    const error = throwOf(() => toHttpResponse(raw, "/products"));
    expect(error.status).toBe(502);
    expect(error.path).toBe("/products");
    expect(error.message).toBe("malformed response");
  });
});

describe("toHttpError", () => {
  it("passes an HttpError straight through", () => {
    const original = new HttpError(429, "/products", "slow down");
    expect(toHttpError(original, "/other")).toBe(original);
  });

  it("turns a bare string rejection into a status-0 error", () => {
    const error = toHttpError("socket hang up", "/products");
    expect(error.status).toBe(0);
    expect(error.path).toBe("/products");
    expect(error.message).toBe("socket hang up");
  });

  it("takes the message from a real Error", () => {
    const error = toHttpError(new RangeError("out of range"), "/products");
    expect(error.status).toBe(0);
    expect(error.message).toBe("out of range");
  });

  it("reads the library's rejection object", () => {
    const error = toHttpError(
      { statusCode: 404, error: "no such route" },
      "/nope",
    );
    expect(error.status).toBe(404);
    expect(error.message).toBe("no such route");
  });

  it("falls back to a generic message when the object has no detail", () => {
    expect(toHttpError({ statusCode: 500 }, "/x").message).toBe(
      "request failed",
    );
    expect(toHttpError({ statusCode: 500, error: 12 }, "/x").message).toBe(
      "request failed",
    );
  });

  it.each([
    ["a number", 0],
    ["null", null],
    ["an object with no statusCode", { oops: true }],
    ["a non-numeric statusCode", { statusCode: "500" }],
  ])("handles %s", (_label, reason) => {
    const error = toHttpError(reason, "/x");
    expect(error.status).toBe(0);
    expect(error.message).toBe("unknown transport failure");
  });
});

describe("createTypedClient", () => {
  it("forwards the method, the path and the query", async () => {
    const { client, calls } = recordingClient(() =>
      Promise.resolve({ statusCode: 200, payload: [] }),
    );

    await createTypedClient(client).get("/products", { limit: "2" });

    expect(calls).toHaveLength(1);
    expect(calls[0]?.method).toBe("GET");
    expect(calls[0]?.path).toBe("/products");
    expect(calls[0]?.options?.query).toEqual({ limit: "2" });
  });

  it("sends no query when none was given", async () => {
    const { client, calls } = recordingClient(() =>
      Promise.resolve({ statusCode: 200, payload: [] }),
    );

    await createTypedClient(client).get("/products");

    expect(calls[0]?.options?.query).toBeUndefined();
  });

  it("returns the narrowed response on success", async () => {
    const { client } = recordingClient(() =>
      Promise.resolve({ statusCode: 200, payload: { ok: 1 }, headers: {} }),
    );

    expect(await createTypedClient(client).get("/products")).toEqual({
      status: 200,
      body: { ok: 1 },
    });
  });

  it("throws when an error status arrives resolved rather than rejected", async () => {
    const { client } = recordingClient(() =>
      Promise.resolve({ statusCode: 404, payload: null }),
    );

    const error = await rejectionOf(createTypedClient(client).get("/gone"));
    expect(error.status).toBe(404);
    expect(error.path).toBe("/gone");
    expect(error.message).toBe("request failed with status 404");
  });

  it("normalises every rejection into an HttpError", async () => {
    const { client } = recordingClient(() => Promise.reject("socket hang up"));

    const error = await rejectionOf(createTypedClient(client).get("/products"));
    expect(error.status).toBe(0);
    expect(error.message).toBe("socket hang up");
  });

  it("throws on a malformed resolution", async () => {
    const { client } = recordingClient(() => Promise.resolve("not an envelope"));

    const error = await rejectionOf(createTypedClient(client).get("/products"));
    expect(error.status).toBe(502);
    expect(error.message).toBe("malformed response");
  });
});

describe("connect — against the real legacy module", () => {
  const client = (): TypedClient => connect("https://catalog.test");

  it("fetches a page of products", async () => {
    const response = await client().get("/products");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      items: [
        {
          id: "p1",
          title: "Mechanical keyboard",
          price_cents: 8999,
          tags: ["input", "desk"],
          discontinued: false,
        },
        {
          id: "p2",
          title: "Wireless mouse",
          price_cents: 3499,
          tags: ["input", "wireless"],
        },
      ],
      next_cursor: "2",
    });
  });

  it("passes the query through to the library", async () => {
    const response = await client().get("/products", {
      cursor: "4",
      limit: "10",
    });

    expect(response.body).toEqual({
      items: [{ id: "p5", title: "Desk lamp", price_cents: 4200, tags: ["desk"] }],
      next_cursor: null,
    });
  });

  it("fetches one product", async () => {
    const response = await client().get("/products/p3");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: "p3",
      title: "27-inch monitor",
      price_cents: 24900,
      tags: ["display"],
      discontinued: false,
    });
  });

  it("turns the library's 404 rejection into an HttpError", async () => {
    const error = await rejectionOf(client().get("/products/nope"));
    expect(error.status).toBe(404);
    expect(error.path).toBe("/products/nope");
    expect(error.message).toBe("no such product");
  });

  it("turns a transport failure into a status-0 HttpError", async () => {
    const flaky = connect("https://catalog.test", 1);

    const error = await rejectionOf(flaky.get("/products"));
    expect(error.status).toBe(0);
    expect(error.message).toBe("socket hang up");

    // The client is not broken — the next call succeeds.
    expect((await flaky.get("/products")).status).toBe(200);
  });
});
