import { describe, expect, it } from "vitest";
import type { Request, Response } from "express";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  TypedRouter,
  type Empty,
  type ParamsOf,
  type RouteHandler,
  type RouteRequest,
  type RouteResponse,
} from "./exercise";

/* ── Test doubles ───────────────────────────────────────────────────────────
 *
 * As everywhere in this section: no server, no `express` package, just the two
 * casts that turn a hand-built object into the shape a handler expects.
 */

type ReqInit = {
  params?: Record<string, string>;
  query?: Record<string, string>;
  body?: unknown;
};

function fakeReq<TReq>(init: ReqInit = {}): TReq {
  const req = { headers: {}, params: {}, query: {}, body: {}, ...init };
  return req as unknown as TReq;
}

type Recorder = {
  status: number | undefined;
  body: unknown;
  responses: number;
};

type ResDouble = {
  headersSent: boolean;
  status(code: number): ResDouble;
  json(body: unknown): ResDouble;
  send(body: unknown): ResDouble;
};

function fakeRes<TRes>(): { res: TRes; recorder: Recorder } {
  const recorder: Recorder = {
    status: undefined,
    body: undefined,
    responses: 0,
  };

  const double: ResDouble = {
    headersSent: false,
    status(code) {
      recorder.status = code;
      return double;
    },
    json(body) {
      recorder.body = body;
      recorder.responses += 1;
      double.headersSent = true;
      return double;
    },
    send(body) {
      recorder.body = body;
      recorder.responses += 1;
      double.headersSent = true;
      return double;
    },
  };

  return { res: double as unknown as TRes, recorder };
}

/* ── Fixtures ───────────────────────────────────────────────────────────── */

type User = { id: string; name: string };
type Post = { id: string; title: string };
type ErrorBody = { error: string };

type Api = {
  "GET /users/:id": { body: Empty; response: User | ErrorBody };
  "GET /users/:userId/posts/:postId": { body: Empty; response: Post | ErrorBody };
  "POST /users": { body: { name: string }; response: User | ErrorBody };
  "GET /health": { body: Empty; response: { ok: true } };
};

const declared: readonly (keyof Api)[] = [
  "GET /users/:id",
  "GET /users/:userId/posts/:postId",
  "POST /users",
  "GET /health",
];

const build = (): TypedRouter<Api> => new TypedRouter<Api>(declared);

type GetUserKey = "GET /users/:id";
type GetUserReq = RouteRequest<GetUserKey, Api[GetUserKey]>;
type GetUserRes = RouteResponse<Api[GetUserKey]>;

type HealthKey = "GET /health";
type HealthReq = RouteRequest<HealthKey, Api[HealthKey]>;
type HealthRes = RouteResponse<Api[HealthKey]>;

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _noParams = Expect<Equal<ParamsOf<"GET /users">, {}>>;
type _oneParam = Expect<Equal<ParamsOf<"GET /users/:id">, { id: string }>>;
type _twoParams = Expect<
  Equal<
    ParamsOf<"GET /users/:userId/posts/:postId">,
    { userId: string; postId: string }
  >
>;
type _paramsInTheMiddle = Expect<
  Equal<ParamsOf<"DELETE /a/:b/c/:d/e">, { b: string; d: string }>
>;

// Params come from the KEY, body and response from the SPEC. The path is
// written down exactly once, in the route table.
type _request = Expect<
  Equal<
    RouteRequest<"GET /users/:id", Api["GET /users/:id"]>,
    Request<{ id: string }, User | ErrorBody, Empty>
  >
>;
type _response = Expect<
  Equal<RouteResponse<Api["GET /health"]>, Response<{ ok: true }>>
>;
type _handler = Expect<
  Equal<
    RouteHandler<"POST /users", Api["POST /users"]>,
    (
      req: Request<{}, User | ErrorBody, { name: string }>,
      res: Response<User | ErrorBody>,
    ) => void | Promise<void>
  >
>;

type _isRoute = Expect<
  Equal<
    TypedRouter<Api>["isRoute"],
    (key: string) => key is keyof Api & string
  >
>;
type _routes = Expect<
  Equal<ReturnType<TypedRouter<Api>["routes"]>, readonly (keyof Api & string)[]>
>;
type _dispatch = Expect<
  Equal<ReturnType<TypedRouter<Api>["dispatch"]>, Promise<boolean>>
>;

function _compileTimeOnly(): void {
  const router = build();

  router.register("GET /users/:id", (req, res) => {
    const id: string = req.params.id;
    void id;

    // @ts-expect-error — ":id" is the only parameter this path declares.
    req.params.slug;

    // @ts-expect-error — the response type comes from the route table.
    res.json({ nope: true });

    res.json({ error: "user not found" });
  });

  router.register("GET /users/:userId/posts/:postId", (req, res) => {
    const both: string = req.params.userId + req.params.postId;
    void both;
    res.json({ id: "1", title: "hello" });
  });

  // Async handlers are allowed — the return type is `void | Promise<void>`.
  router.register("POST /users", async (req, res) => {
    const name: string = req.body.name;

    // @ts-expect-error — this path has no parameters at all.
    req.params.id;

    res.json({ id: "1", name });
  });

  // @ts-expect-error — "GET /nope" is not in the route table.
  router.register("GET /nope", () => {});

  // @ts-expect-error — the manifest may only list declared routes.
  new TypedRouter<Api>(["GET /whatever"]);

  // @ts-expect-error — a handler for one route is not a handler for another:
  // its request params disagree.
  router.register("GET /health", (req: GetUserReq) => req);
}

function _theBoundary(router: TypedRouter<Api>, raw: string): void {
  // @ts-expect-error — a string off the wire is not yet a declared route key.
  router.handlerFor(raw);

  if (router.isRoute(raw)) {
    // The predicate is what converts an arbitrary string into a key the map
    // understands. Everything downstream of this line is typed.
    const key: keyof Api = raw;
    void key;
    router.handlerFor(raw);
  }
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("routes / isRoute", () => {
  it("reports the declared routes in order", () => {
    expect([...build().routes()]).toEqual([
      "GET /users/:id",
      "GET /users/:userId/posts/:postId",
      "POST /users",
      "GET /health",
    ]);
  });

  it("copies the manifest, so a later mutation cannot change the router", () => {
    const manifest: (keyof Api)[] = ["GET /health"];
    const router = new TypedRouter<Api>(manifest);

    manifest.push("POST /users");

    expect([...router.routes()]).toEqual(["GET /health"]);
  });

  it("recognises declared keys and nothing else", () => {
    const router = build();

    expect(router.isRoute("GET /health")).toBe(true);
    expect(router.isRoute("GET /users/:id")).toBe(true);
    expect(router.isRoute("GET /users/1")).toBe(false);
    expect(router.isRoute("")).toBe(false);
    expect(router.isRoute("DELETE /health")).toBe(false);
  });
});

describe("register / handlerFor", () => {
  it("stores and returns the handler", () => {
    const router = build();
    const handler: RouteHandler<HealthKey, Api[HealthKey]> = (_req, res) => {
      res.json({ ok: true });
    };

    router.register("GET /health", handler);

    expect(router.handlerFor("GET /health")).toBe(handler);
  });

  it("returns undefined for a route with no handler", () => {
    expect(build().handlerFor("GET /health")).toBeUndefined();
  });

  it("replaces an existing registration", () => {
    const router = build();
    const first: RouteHandler<HealthKey, Api[HealthKey]> = () => {};
    const second: RouteHandler<HealthKey, Api[HealthKey]> = () => {};

    router.register("GET /health", first);
    router.register("GET /health", second);

    expect(router.handlerFor("GET /health")).toBe(second);
  });

  it("chains", () => {
    const router = build();
    const returned = router
      .register("GET /health", () => {})
      .register("POST /users", () => {});

    expect(returned).toBe(router);
  });
});

describe("dispatch", () => {
  it("runs the handler with the request and response it was given", async () => {
    const router = build();
    router.register("GET /users/:id", (req, res) => {
      res.status(200).json({ id: req.params.id, name: "Ada" });
    });

    const { res, recorder } = fakeRes<GetUserRes>();
    const handled = await router.dispatch(
      "GET /users/:id",
      fakeReq<GetUserReq>({ params: { id: "7" } }),
      res,
    );

    expect(handled).toBe(true);
    expect(recorder.status).toBe(200);
    expect(recorder.body).toEqual({ id: "7", name: "Ada" });
  });

  it("awaits an async handler before resolving", async () => {
    const router = build();
    const order: string[] = [];

    router.register("GET /health", async (_req, res) => {
      await Promise.resolve();
      order.push("handler");
      res.json({ ok: true });
    });

    await router.dispatch("GET /health", fakeReq<HealthReq>(), fakeRes<HealthRes>().res);
    order.push("after");

    expect(order).toEqual(["handler", "after"]);
  });

  it("reports false and touches nothing when the route has no handler", async () => {
    const { res, recorder } = fakeRes<HealthRes>();
    const handled = await build().dispatch(
      "GET /health",
      fakeReq<HealthReq>(),
      res,
    );

    expect(handled).toBe(false);
    expect(recorder.responses).toBe(0);
  });

  it("keeps the routes independent of one another", async () => {
    const router = build();
    const seen: string[] = [];

    router.register("GET /users/:id", (req) => {
      seen.push(`user:${req.params.id}`);
    });
    router.register("GET /users/:userId/posts/:postId", (req) => {
      seen.push(`post:${req.params.userId}/${req.params.postId}`);
    });

    await router.dispatch(
      "GET /users/:id",
      fakeReq<GetUserReq>({ params: { id: "1" } }),
      fakeRes<GetUserRes>().res,
    );
    await router.dispatch(
      "GET /users/:userId/posts/:postId",
      fakeReq<
        RouteRequest<
          "GET /users/:userId/posts/:postId",
          Api["GET /users/:userId/posts/:postId"]
        >
      >({ params: { userId: "1", postId: "2" } }),
      fakeRes<RouteResponse<Api["GET /users/:userId/posts/:postId"]>>().res,
    );

    expect(seen).toEqual(["user:1", "post:1/2"]);
  });
});

describe("unhandled", () => {
  it("starts as every declared route, in declaration order", () => {
    expect([...build().unhandled()]).toEqual([
      "GET /users/:id",
      "GET /users/:userId/posts/:postId",
      "POST /users",
      "GET /health",
    ]);
  });

  it("shrinks as handlers are registered", () => {
    const router = build();
    router.register("POST /users", () => {});
    router.register("GET /users/:id", () => {});

    expect([...router.unhandled()]).toEqual([
      "GET /users/:userId/posts/:postId",
      "GET /health",
    ]);
  });

  it("is empty once every route is covered", () => {
    const router = build();

    router
      .register("GET /users/:id", () => {})
      .register("GET /users/:userId/posts/:postId", () => {})
      .register("POST /users", () => {})
      .register("GET /health", () => {});

    expect(router.unhandled()).toEqual([]);
  });
});
