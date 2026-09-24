import { describe, expect, it } from "vitest";
import type {
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from "express";
import type { Equal, Expect, Extends } from "../../../src/type-testing";
import {
  HttpError,
  asyncHandler,
  errorMiddleware,
  runPipeline,
  toHttpError,
  type AsyncMiddleware,
  type ErrorMiddleware,
} from "./exercise";

/* ── Test doubles ───────────────────────────────────────────────────────────
 *
 * Same shape as the rest of the section. `headersSent` matters here: it is how
 * an error middleware knows the response has already started.
 */

function fakeReq<TReq>(): TReq {
  const req = { headers: {}, params: {}, query: {}, body: {} };
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

function fakeNext(): { next: NextFunction; calls: unknown[] } {
  const calls: unknown[] = [];
  const next: NextFunction = (error?: unknown) => {
    calls.push(error);
  };
  return { next, calls };
}

/* ── Compile-time spec ──────────────────────────────────────────────────── */

// An async middleware is still something Express will accept: `RequestHandler`
// returns `unknown`, so a returned promise is fine.
type _asyncIsAHandler = Expect<Extends<AsyncMiddleware, RequestHandler>>;

type _httpErrorIsAnError = Expect<Extends<HttpError, Error>>;
type _status = Expect<Equal<HttpError["status"], number>>;
type _toHttpError = Expect<Equal<typeof toHttpError, (error: unknown) => HttpError>>;
type _asyncHandler = Expect<
  Equal<typeof asyncHandler, (handler: AsyncMiddleware) => AsyncMiddleware>
>;
type _errorMiddleware = Expect<
  Equal<typeof errorMiddleware, (log: string[]) => ErrorMiddleware>
>;
type _runPipeline = Expect<
  Equal<
    typeof runPipeline,
    (
      handlers: readonly AsyncMiddleware[],
      onError: ErrorMiddleware,
      req: Request,
      res: Response,
    ) => Promise<void>
  >
>;

function _compileTimeOnly(): void {
  // @ts-expect-error — a synchronous middleware returns void, not a promise.
  const sync: AsyncMiddleware = (_req, _res, next) => {
    next();
  };
  void sync;

  const error = new HttpError(404, "user not found");

  // @ts-expect-error — the status is readonly; an error's status is decided
  // where it is thrown, not where it is caught.
  error.status = 500;

}

function _caughtValuesAreUnknown(caught: unknown): void {
  // @ts-expect-error — a caught value is `unknown` until it is narrowed, which
  // is exactly the job `toHttpError` exists to do.
  const wrong: HttpError = caught;
  void wrong;
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("HttpError", () => {
  it("carries a status alongside the message", () => {
    const error = new HttpError(404, "user not found");

    expect(error.status).toBe(404);
    expect(error.message).toBe("user not found");
    expect(error.name).toBe("HttpError");
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(HttpError);
  });
});

describe("toHttpError", () => {
  it("passes an HttpError straight through", () => {
    const original = new HttpError(403, "forbidden");
    expect(toHttpError(original)).toBe(original);
  });

  it("wraps any other Error as a 500, keeping the message", () => {
    const converted = toHttpError(new TypeError("bad shape"));

    expect(converted).toBeInstanceOf(HttpError);
    expect(converted.status).toBe(500);
    expect(converted.message).toBe("bad shape");
  });

  it("gives a non-Error a generic message", () => {
    for (const thrown of ["a string", 42, null, undefined, { status: 400 }]) {
      const converted = toHttpError(thrown);

      expect(converted.status).toBe(500);
      expect(converted.message).toBe("internal error");
    }
  });
});

describe("asyncHandler", () => {
  it("does not call next when the handler resolves", async () => {
    const { next, calls } = fakeNext();

    await asyncHandler(async (_req, res) => {
      res.status(200).json({ ok: true });
    })(fakeReq<Request>(), fakeRes<Response>().res, next);

    expect(calls).toEqual([]);
  });

  it("forwards a rejection to next exactly once", async () => {
    const boom = new HttpError(404, "user not found");
    const { next, calls } = fakeNext();

    await asyncHandler(async () => {
      throw boom;
    })(fakeReq<Request>(), fakeRes<Response>().res, next);

    expect(calls).toEqual([boom]);
  });

  it("forwards a rejected promise, not just a synchronous throw", async () => {
    const boom = new Error("db down");
    const { next, calls } = fakeNext();

    await asyncHandler(async () => Promise.reject(boom))(
      fakeReq<Request>(),
      fakeRes<Response>().res,
      next,
    );

    expect(calls).toEqual([boom]);
  });

  it("leaves a next() the handler made alone", async () => {
    const { next, calls } = fakeNext();

    await asyncHandler(async (_req, _res, forward) => {
      forward();
    })(fakeReq<Request>(), fakeRes<Response>().res, next);

    expect(calls).toEqual([undefined]);
  });

  it("resolves rather than rejecting, so the caller never sees the error", async () => {
    await expect(
      asyncHandler(async () => {
        throw new Error("boom");
      })(fakeReq<Request>(), fakeRes<Response>().res, fakeNext().next),
    ).resolves.toBeUndefined();
  });
});

describe("errorMiddleware", () => {
  it("logs and responds with the error's status", () => {
    const log: string[] = [];
    const { res, recorder } = fakeRes<Response>();

    errorMiddleware(log)(
      new HttpError(404, "user not found"),
      fakeReq<Request>(),
      res,
      fakeNext().next,
    );

    expect(log).toEqual(["404 user not found"]);
    expect(recorder.status).toBe(404);
    expect(recorder.body).toEqual({ error: "user not found" });
  });

  it("normalises anything else to a 500", () => {
    const log: string[] = [];
    const { res, recorder } = fakeRes<Response>();

    errorMiddleware(log)("just a string", fakeReq<Request>(), res, fakeNext().next);

    expect(log).toEqual(["500 internal error"]);
    expect(recorder.status).toBe(500);
    expect(recorder.body).toEqual({ error: "internal error" });
  });

  it("delegates instead of responding twice once headers are sent", () => {
    const log: string[] = [];
    const { res, recorder } = fakeRes<Response>();
    const { next, calls } = fakeNext();
    const boom = new HttpError(500, "too late");

    // Something already started the response.
    res.status(200).json({ ok: true });

    errorMiddleware(log)(boom, fakeReq<Request>(), res, next);

    expect(log).toEqual(["500 too late"]);
    // Still exactly one response — the second attempt was refused.
    expect(recorder.responses).toBe(1);
    expect(recorder.body).toEqual({ ok: true });
    expect(calls).toEqual([boom]);
  });
});

describe("runPipeline", () => {
  const tag =
    (order: string[], name: string): AsyncMiddleware =>
    async (_req, _res, next) => {
      order.push(name);
      next();
    };

  it("runs every handler in order", async () => {
    const order: string[] = [];
    await runPipeline(
      [tag(order, "a"), tag(order, "b")],
      errorMiddleware([]),
      fakeReq<Request>(),
      fakeRes<Response>().res,
    );

    expect(order).toEqual(["a", "b"]);
  });

  it("stops when a handler answers the request", async () => {
    const order: string[] = [];
    const { res, recorder } = fakeRes<Response>();

    await runPipeline(
      [
        tag(order, "a"),
        async (_req, response) => {
          response.status(200).json({ ok: true });
        },
        tag(order, "c"),
      ],
      errorMiddleware([]),
      fakeReq<Request>(),
      res,
    );

    expect(order).toEqual(["a"]);
    expect(recorder.status).toBe(200);
  });

  it("routes next(error) to the error middleware", async () => {
    const log: string[] = [];
    const order: string[] = [];
    const { res, recorder } = fakeRes<Response>();

    await runPipeline(
      [
        tag(order, "a"),
        async (_req, _res, next) => {
          next(new HttpError(403, "forbidden"));
        },
        tag(order, "c"),
      ],
      errorMiddleware(log),
      fakeReq<Request>(),
      res,
    );

    expect(order).toEqual(["a"]);
    expect(log).toEqual(["403 forbidden"]);
    expect(recorder.status).toBe(403);
  });

  /* ── The footgun, and the fix ─────────────────────────────────────────── */

  it("does NOT reach the error middleware when an async handler is unwrapped", async () => {
    const log: string[] = [];
    const { res, recorder } = fakeRes<Response>();

    const rejecting: AsyncMiddleware = async () => {
      throw new HttpError(404, "user not found");
    };

    // The rejection escapes the dispatcher entirely — which in a real app is
    // an unhandled rejection and a request that hangs.
    await expect(
      runPipeline([rejecting], errorMiddleware(log), fakeReq<Request>(), res),
    ).rejects.toThrow("user not found");

    expect(log).toEqual([]);
    expect(recorder.responses).toBe(0);
  });

  it("reaches it once the same handler is wrapped in asyncHandler", async () => {
    const log: string[] = [];
    const { res, recorder } = fakeRes<Response>();

    const rejecting: AsyncMiddleware = async () => {
      throw new HttpError(404, "user not found");
    };

    await runPipeline(
      [asyncHandler(rejecting)],
      errorMiddleware(log),
      fakeReq<Request>(),
      res,
    );

    expect(log).toEqual(["404 user not found"]);
    expect(recorder.status).toBe(404);
    expect(recorder.body).toEqual({ error: "user not found" });
  });

  it("normalises a thrown non-Error through the same path", async () => {
    const log: string[] = [];
    const { res, recorder } = fakeRes<Response>();

    await runPipeline(
      [
        asyncHandler(async () => {
          // JavaScript lets you throw anything, and libraries do.
          throw "database exploded";
        }),
      ],
      errorMiddleware(log),
      fakeReq<Request>(),
      res,
    );

    expect(log).toEqual(["500 internal error"]);
    expect(recorder.status).toBe(500);
  });
});
