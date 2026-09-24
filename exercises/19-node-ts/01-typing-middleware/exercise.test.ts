import { describe, expect, it } from "vitest";
import type {
  ErrorRequestHandler,
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from "express";
import type { Equal, Expect, Extends } from "../../../src/type-testing";
import {
  chain,
  errorHandler,
  limitBodySize,
  requireHeader,
  type ErrorMiddleware,
  type Middleware,
} from "./exercise";

/* ── Test doubles ───────────────────────────────────────────────────────────
 *
 * No server is started anywhere in this section. A middleware is a pure
 * function of (req, res, next), so the spec calls it directly with hand-built
 * stand-ins and asserts on what it did.
 *
 * Express's Request/Response extend Node's IncomingMessage/ServerResponse —
 * hundreds of members these doubles neither have nor need. Each double is
 * therefore cast exactly once, HERE, and never in exercise.ts.
 */

type ReqInit = {
  headers?: Record<string, string | string[]>;
  params?: Record<string, string>;
  query?: Record<string, string>;
  body?: unknown;
};

function fakeReq<TReq>(init: ReqInit = {}): TReq {
  const req = { headers: {}, params: {}, query: {}, body: undefined, ...init };
  // Cast 1 of 2. Confined to the test file.
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

  // Cast 2 of 2.
  return { res: double as unknown as TRes, recorder };
}

/** `calls` holds one entry per next(...) call: the argument, or undefined. */
function fakeNext(): { next: NextFunction; calls: unknown[] } {
  const calls: unknown[] = [];
  const next: NextFunction = (error?: unknown) => {
    calls.push(error);
  };
  return { next, calls };
}

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _middleware = Expect<
  Equal<Middleware, (req: Request, res: Response, next: NextFunction) => void>
>;

type _errorMiddleware = Expect<
  Equal<
    ErrorMiddleware,
    (error: unknown, req: Request, res: Response, next: NextFunction) => void
  >
>;

// The aliases are only useful if Express still accepts them where it wants a
// handler. `RequestHandler` returns `unknown`, so returning `void` is fine.
type _usableByExpress = Expect<Extends<Middleware, RequestHandler>>;
type _errorUsableByExpress = Expect<
  Extends<ErrorMiddleware, ErrorRequestHandler>
>;

type _requireHeader = Expect<
  Equal<typeof requireHeader, (header: string, message: string) => Middleware>
>;
type _limitBodySize = Expect<
  Equal<typeof limitBodySize, (maxBytes: number) => Middleware>
>;
type _errorHandler = Expect<Equal<typeof errorHandler, ErrorMiddleware>>;

function _compileTimeOnly(): void {
  const middleware: Middleware = (req, res, next) => {
    // The parameters are inferred from the alias — no annotations needed.
    // A header can legally repeat, so an unknown one is a union of three.
    const key = req.headers["x-api-key"];
    type _headerValue = Expect<
      Equal<typeof key, string | string[] | undefined>
    >;
    res.status(200);
    next();
  };

  // @ts-expect-error — an error middleware takes four parameters, so a
  // three-parameter middleware is not interchangeable with it.
  const wrong: ErrorMiddleware = middleware;
  void wrong;

  // @ts-expect-error — `chain` composes middlewares, not arbitrary functions.
  chain((a: number) => a);
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("requireHeader", () => {
  it("continues when the header is present", () => {
    const { next, calls } = fakeNext();
    requireHeader("x-api-key", "missing api key")(
      fakeReq<Request>({ headers: { "x-api-key": "abc" } }),
      fakeRes<Response>().res,
      next,
    );

    expect(calls).toEqual([undefined]);
  });

  it("forwards an Error when the header is missing", () => {
    const { next, calls } = fakeNext();
    requireHeader("x-api-key", "missing api key")(
      fakeReq<Request>(),
      fakeRes<Response>().res,
      next,
    );

    expect(calls).toHaveLength(1);
    expect(calls[0]).toBeInstanceOf(Error);
    expect(calls[0]).toMatchObject({ message: "missing api key" });
  });

  it("rejects an empty or whitespace-only header", () => {
    for (const value of ["", "   "]) {
      const { next, calls } = fakeNext();
      requireHeader("x-api-key", "missing api key")(
        fakeReq<Request>({ headers: { "x-api-key": value } }),
        fakeRes<Response>().res,
        next,
      );
      expect(calls[0]).toBeInstanceOf(Error);
    }
  });

  it("rejects a repeated header, which arrives as an array", () => {
    const { next, calls } = fakeNext();
    requireHeader("x-api-key", "missing api key")(
      fakeReq<Request>({ headers: { "x-api-key": ["a", "b"] } }),
      fakeRes<Response>().res,
      next,
    );

    expect(calls[0]).toBeInstanceOf(Error);
  });

  it("never touches the response", () => {
    const { res, recorder } = fakeRes<Response>();
    requireHeader("x-api-key", "missing api key")(
      fakeReq<Request>(),
      res,
      fakeNext().next,
    );

    expect(recorder.responses).toBe(0);
  });
});

describe("limitBodySize", () => {
  it("continues when there is no content-length", () => {
    const { next, calls } = fakeNext();
    limitBodySize(100)(fakeReq<Request>(), fakeRes<Response>().res, next);

    expect(calls).toEqual([undefined]);
  });

  it("continues when the body is within the limit", () => {
    const { next, calls } = fakeNext();
    const { res, recorder } = fakeRes<Response>();
    limitBodySize(100)(
      fakeReq<Request>({ headers: { "content-length": "100" } }),
      res,
      next,
    );

    expect(calls).toEqual([undefined]);
    expect(recorder.responses).toBe(0);
  });

  it("answers 413 and stops the chain when the body is too large", () => {
    const { next, calls } = fakeNext();
    const { res, recorder } = fakeRes<Response>();
    limitBodySize(100)(
      fakeReq<Request>({ headers: { "content-length": "101" } }),
      res,
      next,
    );

    expect(recorder.status).toBe(413);
    expect(recorder.body).toEqual({ error: "payload too large" });
    // Responding AND calling next is the bug — exactly one of them happens.
    expect(calls).toEqual([]);
  });

  it("forwards an Error for a non-numeric content-length", () => {
    const { next, calls } = fakeNext();
    const { res, recorder } = fakeRes<Response>();
    limitBodySize(100)(
      fakeReq<Request>({ headers: { "content-length": "many" } }),
      res,
      next,
    );

    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ message: "invalid content-length" });
    expect(recorder.responses).toBe(0);
  });
});

describe("chain", () => {
  const tag =
    (order: string[], name: string): Middleware =>
    (_req, _res, next) => {
      order.push(name);
      next();
    };

  it("runs every middleware in order, then calls the outer next", () => {
    const order: string[] = [];
    const { next, calls } = fakeNext();

    chain(tag(order, "a"), tag(order, "b"), tag(order, "c"))(
      fakeReq<Request>(),
      fakeRes<Response>().res,
      next,
    );

    expect(order).toEqual(["a", "b", "c"]);
    expect(calls).toEqual([undefined]);
  });

  it("calls next once when there is nothing to run", () => {
    const { next, calls } = fakeNext();
    chain()(fakeReq<Request>(), fakeRes<Response>().res, next);

    expect(calls).toEqual([undefined]);
  });

  it("short-circuits on next(error) and forwards it", () => {
    const order: string[] = [];
    const boom = new Error("boom");
    const { next, calls } = fakeNext();

    chain(
      tag(order, "a"),
      (_req, _res, forward) => {
        forward(boom);
      },
      tag(order, "c"),
    )(fakeReq<Request>(), fakeRes<Response>().res, next);

    expect(order).toEqual(["a"]);
    expect(calls).toEqual([boom]);
  });

  it("stops silently when a middleware responds instead of continuing", () => {
    const order: string[] = [];
    const { next, calls } = fakeNext();
    const { res, recorder } = fakeRes<Response>();

    chain(
      tag(order, "a"),
      (_req, response) => {
        response.status(418).json({ error: "teapot" });
      },
      tag(order, "c"),
    )(fakeReq<Request>(), res, next);

    expect(order).toEqual(["a"]);
    expect(recorder.status).toBe(418);
    // The outer next must NOT fire: the request is already answered.
    expect(calls).toEqual([]);
  });

  it("composes the real middlewares from this exercise", () => {
    const { next, calls } = fakeNext();
    const { res, recorder } = fakeRes<Response>();

    chain(requireHeader("x-api-key", "missing api key"), limitBodySize(10))(
      fakeReq<Request>({
        headers: { "x-api-key": "abc", "content-length": "999" },
      }),
      res,
      next,
    );

    expect(recorder.status).toBe(413);
    expect(calls).toEqual([]);
  });
});

describe("errorHandler", () => {
  it("uses a status carried on the error", () => {
    const { res, recorder } = fakeRes<Response>();
    errorHandler(
      Object.assign(new Error("nope"), { status: 404 }),
      fakeReq<Request>(),
      res,
      fakeNext().next,
    );

    expect(recorder.status).toBe(404);
    expect(recorder.body).toEqual({ error: "nope" });
  });

  it("falls back to 500 for a plain Error", () => {
    const { res, recorder } = fakeRes<Response>();
    errorHandler(new Error("kaboom"), fakeReq<Request>(), res, fakeNext().next);

    expect(recorder.status).toBe(500);
    expect(recorder.body).toEqual({ error: "kaboom" });
  });

  it("ignores a status outside 400-599, or a non-integer one", () => {
    for (const status of [200, 399, 600, 404.5, "404"]) {
      const { res, recorder } = fakeRes<Response>();
      errorHandler(
        Object.assign(new Error("x"), { status }),
        fakeReq<Request>(),
        res,
        fakeNext().next,
      );
      expect(recorder.status).toBe(500);
    }
  });

  it("survives a thrown non-Error", () => {
    for (const thrown of ["a string", 42, null, undefined]) {
      const { res, recorder } = fakeRes<Response>();
      errorHandler(thrown, fakeReq<Request>(), res, fakeNext().next);

      expect(recorder.status).toBe(500);
      expect(recorder.body).toEqual({ error: "internal error" });
    }
  });

  it("reads a status off a plain object too", () => {
    const { res, recorder } = fakeRes<Response>();
    errorHandler(
      { status: 403, message: "hidden" },
      fakeReq<Request>(),
      res,
      fakeNext().next,
    );

    expect(recorder.status).toBe(403);
    // Not an Error, so the message is not trusted.
    expect(recorder.body).toEqual({ error: "internal error" });
  });
});
