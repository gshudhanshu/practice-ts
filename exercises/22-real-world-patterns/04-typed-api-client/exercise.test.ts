import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  buildRequest,
  createApi,
  toUrl,
  type Api,
  type HttpRequest,
  type MethodOf,
  type NewUser,
  type PathOf,
  type PathParams,
  type RequestInput,
  type ResponseOf,
  type Transport,
  type User,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _method1 = Expect<Equal<MethodOf<"GET /users">, "GET">>;
type _method2 = Expect<
  Equal<MethodOf<"DELETE /users/:userId/sessions/:sessionId">, "DELETE">
>;
type _path1 = Expect<Equal<PathOf<"GET /users/:userId">, "/users/:userId">>;
type _path2 = Expect<Equal<PathOf<"POST /users">, "/users">>;

type _response1 = Expect<Equal<ResponseOf<"GET /users">, readonly User[]>>;
type _response2 = Expect<Equal<ResponseOf<"GET /users/:userId">, User>>;
type _response3 = Expect<
  Equal<ResponseOf<"DELETE /users/:userId/sessions/:sessionId">, { readonly deleted: number }>
>;

type _apiReturns = Expect<Equal<ReturnType<typeof createApi>, Api>>;
type _buildReturns = Expect<Equal<ReturnType<typeof buildRequest>, HttpRequest>>;

function _compileTimeOnly(): void {
  /* PathParams extracts every :param, and nothing else. */
  const none: PathParams<"/users"> = {};
  const one: PathParams<"/users/:userId"> = { userId: "u1" };
  const two: PathParams<"/users/:userId/sessions/:sessionId"> = {
    userId: "u1",
    sessionId: "s2",
  };
  void none, one, two;

  // @ts-expect-error — the path declares a userId, so one must be supplied.
  const missing: PathParams<"/users/:userId"> = {};
  void missing;

  // @ts-expect-error — a param is a string, not a number.
  const wrongType: PathParams<"/users/:userId"> = { userId: 1 };
  void wrongType;

  /* RequestInput assembles params, query and body. */
  const health: RequestInput<"GET /health"> = {};
  const list: RequestInput<"GET /users"> = { query: { limit: 2, q: "ada" } };
  const byId: RequestInput<"GET /users/:userId"> = { userId: "u1" };
  const create: RequestInput<"POST /users"> = {
    body: { name: "Ada", email: "ada@example.com" },
  };
  const nested: RequestInput<"DELETE /users/:userId/sessions/:sessionId"> = {
    userId: "u1",
    sessionId: "s2",
  };
  void health, list, byId, create, nested;

  // @ts-expect-error — POST /users needs a body.
  const noBody: RequestInput<"POST /users"> = {};
  void noBody;

  // @ts-expect-error — the body must match NewUser.
  const badBody: RequestInput<"POST /users"> = { body: { name: "Ada" } };
  void badBody;

  // @ts-expect-error — the nested route needs both parameters.
  const halfNested: RequestInput<"DELETE /users/:userId/sessions/:sessionId"> = {
    userId: "u1",
  };
  void halfNested;
}

declare const transport: Transport;

async function _callSiteTypes(): Promise<void> {
  const api = createApi(transport);

  /* The response type is DERIVED from the key, not asserted by the caller. */
  const users = await api.request("GET /users", { query: { limit: 2 } });
  type _users = Expect<Equal<typeof users, readonly User[]>>;

  const user = await api.request("GET /users/:userId", { userId: "u1" });
  type _user = Expect<Equal<typeof user, User>>;

  const created = await api.request("POST /users", {
    body: { name: "Ada", email: "ada@example.com" },
  });
  type _created = Expect<Equal<typeof created, User>>;

  const deleted = await api.request(
    "DELETE /users/:userId/sessions/:sessionId",
    { userId: "u1", sessionId: "s2" },
  );
  type _deleted = Expect<Equal<typeof deleted, { readonly deleted: number }>>;

  const health = await api.request("GET /health", {});
  type _health = Expect<Equal<typeof health, { readonly ok: boolean }>>;

  // @ts-expect-error — there is no such endpoint. A typo is a compile error.
  await api.request("GET /uesrs", {});

  // @ts-expect-error — the method is part of the key.
  await api.request("PUT /users", {});

  // @ts-expect-error — this route takes a userId.
  await api.request("GET /users/:userId", {});

  // @ts-expect-error — GET /users has no body.
  await api.request("GET /users", { body: { name: "Ada" } });

  // @ts-expect-error — the query is typed too.
  await api.request("GET /users", { query: { limit: "2" } });
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

function recordingTransport(reply: unknown): {
  transport: Transport;
  sent: HttpRequest[];
} {
  const sent: HttpRequest[] = [];
  return {
    transport: (request) => {
      sent.push(request);
      return Promise.resolve(reply);
    },
    sent,
  };
}

const ada: User = { id: "u1", name: "Ada", email: "ada@example.com" };
const newUser: NewUser = { name: "Ada", email: "ada@example.com" };

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("buildRequest", () => {
  it("splits the method from the path", () => {
    expect(buildRequest("GET /health", {})).toEqual({
      method: "GET",
      path: "/health",
      query: {},
      body: undefined,
    });
  });

  it("substitutes one path parameter", () => {
    expect(buildRequest("GET /users/:userId", { userId: "u1" })).toEqual({
      method: "GET",
      path: "/users/u1",
      query: {},
      body: undefined,
    });
  });

  it("substitutes several, in the right places", () => {
    expect(
      buildRequest("DELETE /users/:userId/sessions/:sessionId", {
        userId: "u1",
        sessionId: "s2",
      }),
    ).toEqual({
      method: "DELETE",
      path: "/users/u1/sessions/s2",
      query: {},
      body: undefined,
    });
  });

  it("stringifies query values", () => {
    expect(buildRequest("GET /users", { query: { limit: 2, q: "ada" } })).toEqual(
      {
        method: "GET",
        path: "/users",
        query: { limit: "2", q: "ada" },
        body: undefined,
      },
    );
  });

  it("drops an absent query value", () => {
    expect(buildRequest("GET /users", { query: { limit: 2 } }).query).toEqual({
      limit: "2",
    });
    expect(buildRequest("GET /users", { query: {} }).query).toEqual({});
  });

  it("passes the body through untouched", () => {
    const request = buildRequest("POST /users", { body: newUser });
    expect(request.method).toBe("POST");
    expect(request.path).toBe("/users");
    expect(request.body).toEqual(newUser);
  });

  it("carries a partial body for PATCH", () => {
    const request = buildRequest("PATCH /users/:userId", {
      userId: "u1",
      body: { name: "Ada L" },
    });
    expect(request.path).toBe("/users/u1");
    expect(request.body).toEqual({ name: "Ada L" });
  });
});

describe("toUrl", () => {
  it("returns a bare path when there is no query", () => {
    expect(toUrl(buildRequest("GET /health", {}))).toBe("/health");
  });

  it("appends and encodes the query", () => {
    expect(toUrl(buildRequest("GET /users", { query: { q: "a b" } }))).toBe(
      "/users?q=a%20b",
    );
  });

  it("joins several parameters", () => {
    expect(
      toUrl(buildRequest("GET /users", { query: { limit: 2, q: "ada" } })),
    ).toBe("/users?limit=2&q=ada");
  });

  it("encodes reserved characters", () => {
    expect(toUrl({ method: "GET", path: "/s", query: { "a b": "c&d" }, body: undefined })).toBe(
      "/s?a%20b=c%26d",
    );
  });
});

describe("createApi", () => {
  it("sends the built request to the transport", async () => {
    const { transport: recorder, sent } = recordingTransport([ada]);

    await createApi(recorder).request("GET /users", { query: { limit: 2 } });

    expect(sent).toEqual([
      { method: "GET", path: "/users", query: { limit: "2" }, body: undefined },
    ]);
  });

  it("returns whatever the transport resolved with", async () => {
    const { transport: recorder } = recordingTransport(ada);

    expect(
      await createApi(recorder).request("GET /users/:userId", { userId: "u1" }),
    ).toEqual(ada);
  });

  it("sends a body for a write", async () => {
    const { transport: recorder, sent } = recordingTransport(ada);

    await createApi(recorder).request("POST /users", { body: newUser });

    expect(sent[0]?.method).toBe("POST");
    expect(sent[0]?.body).toEqual(newUser);
  });

  it("propagates a transport failure", async () => {
    const failing: Transport = () => Promise.reject(new Error("offline"));

    await expect(
      createApi(failing).request("GET /health", {}),
    ).rejects.toThrow("offline");
  });
});
