import { describe, expect, it } from "vitest";
import type { NextFunction, Request, Response } from "express";
import type { Equal, Expect, Extends } from "../../../src/type-testing";
import {
  authenticate,
  isAuthenticated,
  requireRole,
  withUser,
  type AuthUser,
  type AuthenticatedHandler,
  type AuthenticatedRequest,
  type Middleware,
} from "./exercise";

/* ── Test doubles ───────────────────────────────────────────────────────────
 *
 * Same approach as 19/01: handlers are pure functions of (req, res, next), so
 * the spec calls them with hand-built stand-ins. The two casts below are the
 * only ones in the exercise, and they live here rather than in exercise.ts.
 */

type ReqInit = {
  headers?: Record<string, string | string[]>;
  user?: AuthUser;
};

function fakeReq<TReq>(init: ReqInit = {}): TReq {
  const req = { headers: {}, params: {}, query: {}, body: undefined, ...init };
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

/* ── Fixtures ───────────────────────────────────────────────────────────── */

const ada: AuthUser = { id: "1", name: "Ada", roles: ["admin", "editor"] };
const bob: AuthUser = { id: "2", name: "Bob", roles: ["viewer"] };

const tokens: ReadonlyMap<string, AuthUser> = new Map([
  ["ada-token", ada],
  ["bob-token", bob],
]);

const bearer = (token: string): ReqInit => ({
  headers: { authorization: `Bearer ${token}` },
});

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _authenticate = Expect<
  Equal<
    typeof authenticate,
    (tokens: ReadonlyMap<string, AuthUser>) => Middleware
  >
>;
type _requireRole = Expect<Equal<typeof requireRole, (role: string) => Middleware>>;
type _withUser = Expect<
  Equal<typeof withUser, (handler: AuthenticatedHandler) => Middleware>
>;

// The narrowed request is still a Request, and its `user` is no longer optional.
type _stillARequest = Expect<Extends<AuthenticatedRequest, Request>>;
type _definiteUser = Expect<Equal<AuthenticatedRequest["user"], AuthUser>>;

type _isAuthenticated = Expect<
  Equal<typeof isAuthenticated, (req: Request) => req is AuthenticatedRequest>
>;

type _authenticatedHandler = Expect<
  Equal<
    AuthenticatedHandler,
    (req: AuthenticatedRequest, res: Response, next: NextFunction) => void
  >
>;

function _augmentation(req: Request): void {
  // Declaration merging is what makes this compile — no cast, on the real
  // Express type, in every file of the program.
  const user = req.user;
  type _optional = Expect<Equal<typeof user, AuthUser | undefined>>;

  req.user = ada;

  // @ts-expect-error — `exactOptionalPropertyTypes`: an optional property may
  // not hold an explicit `undefined`. Omit the key instead.
  req.user = undefined;

  // @ts-expect-error — merging adds exactly what you declared, not free rein.
  req.tenant;
}

function _narrowing(req: Request): void {
  if (isAuthenticated(req)) {
    const user = req.user;
    type _definite = Expect<Equal<typeof user, AuthUser>>;
    // No `?.`, no `!`, no re-check.
    const name: string = user.name;
    void name;
  } else {
    const user = req.user;
    type _stillOptional = Expect<Equal<typeof user, AuthUser | undefined>>;
  }
}

function _handlerBody(): void {
  const handler: AuthenticatedHandler = (req, res) => {
    // The whole point: inside a wrapped handler the user is definitely there.
    res.status(200).json({ name: req.user.name });
  };
  // @ts-expect-error — the guarantee only runs one way. A handler that needs a
  // user cannot stand in for ordinary middleware, because a plain Request has
  // no `user`. That is precisely what `withUser` exists to bridge.
  const asMiddleware: Middleware = handler;
  void asMiddleware;
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("authenticate", () => {
  it("attaches the user for a known bearer token", () => {
    const req = fakeReq<Request>(bearer("ada-token"));
    const { res, recorder } = fakeRes<Response>();
    const { next, calls } = fakeNext();

    authenticate(tokens)(req, res, next);

    expect(req.user).toEqual(ada);
    expect(calls).toEqual([undefined]);
    expect(recorder.responses).toBe(0);
  });

  it("answers 401 when the header is missing", () => {
    const req = fakeReq<Request>();
    const { res, recorder } = fakeRes<Response>();
    const { next, calls } = fakeNext();

    authenticate(tokens)(req, res, next);

    expect(recorder.status).toBe(401);
    expect(recorder.body).toEqual({ error: "unauthorized" });
    expect(calls).toEqual([]);
    expect(req.user).toBeUndefined();
  });

  it("answers 401 for a token that is not in the map", () => {
    const { res, recorder } = fakeRes<Response>();
    authenticate(tokens)(
      fakeReq<Request>(bearer("nope")),
      res,
      fakeNext().next,
    );

    expect(recorder.status).toBe(401);
  });

  it("answers 401 for a malformed authorization header", () => {
    const malformed = [
      "Basic ada-token",
      "Bearer",
      "Bearer ",
      "ada-token",
      "Bearer ada-token extra",
    ];

    for (const authorization of malformed) {
      const { res, recorder } = fakeRes<Response>();
      const { next, calls } = fakeNext();

      authenticate(tokens)(
        fakeReq<Request>({ headers: { authorization } }),
        res,
        next,
      );

      expect(recorder.status).toBe(401);
      expect(calls).toEqual([]);
    }
  });
});

describe("requireRole", () => {
  it("continues when the user has the role", () => {
    const { res, recorder } = fakeRes<Response>();
    const { next, calls } = fakeNext();

    requireRole("admin")(fakeReq<Request>({ user: ada }), res, next);

    expect(calls).toEqual([undefined]);
    expect(recorder.responses).toBe(0);
  });

  it("answers 401 when nobody is authenticated", () => {
    const { res, recorder } = fakeRes<Response>();
    const { next, calls } = fakeNext();

    requireRole("admin")(fakeReq<Request>(), res, next);

    expect(recorder.status).toBe(401);
    expect(recorder.body).toEqual({ error: "unauthorized" });
    expect(calls).toEqual([]);
  });

  it("answers 403 when the user lacks the role", () => {
    const { res, recorder } = fakeRes<Response>();
    const { next, calls } = fakeNext();

    requireRole("admin")(fakeReq<Request>({ user: bob }), res, next);

    expect(recorder.status).toBe(403);
    expect(recorder.body).toEqual({ error: "forbidden" });
    expect(calls).toEqual([]);
  });
});

describe("isAuthenticated", () => {
  it("reports whether a user is attached", () => {
    expect(isAuthenticated(fakeReq<Request>({ user: ada }))).toBe(true);
    expect(isAuthenticated(fakeReq<Request>())).toBe(false);
  });
});

describe("withUser", () => {
  it("calls the handler when a user is present", () => {
    const seen: string[] = [];
    const { res, recorder } = fakeRes<Response>();
    const { next, calls } = fakeNext();

    withUser((req, response) => {
      seen.push(req.user.name);
      response.status(200).json({ id: req.user.id });
    })(fakeReq<Request>({ user: ada }), res, next);

    expect(seen).toEqual(["Ada"]);
    expect(recorder.status).toBe(200);
    expect(recorder.body).toEqual({ id: "1" });
    expect(calls).toEqual([]);
  });

  it("answers 401 and never runs the handler when there is no user", () => {
    let ran = false;
    const { res, recorder } = fakeRes<Response>();
    const { next, calls } = fakeNext();

    withUser(() => {
      ran = true;
    })(fakeReq<Request>(), res, next);

    expect(ran).toBe(false);
    expect(recorder.status).toBe(401);
    expect(recorder.body).toEqual({ error: "unauthorized" });
    expect(calls).toEqual([]);
  });

  it("passes next straight through", () => {
    const { next, calls } = fakeNext();

    withUser((_req, _res, forward) => {
      forward();
    })(fakeReq<Request>({ user: ada }), fakeRes<Response>().res, next);

    expect(calls).toEqual([undefined]);
  });

  it("composes with authenticate", () => {
    const req = fakeReq<Request>(bearer("bob-token"));
    const { res, recorder } = fakeRes<Response>();

    authenticate(tokens)(req, res, fakeNext().next);
    withUser((authed, response) => {
      response.status(200).json({ name: authed.user.name });
    })(req, res, fakeNext().next);

    expect(recorder.body).toEqual({ name: "Bob" });
  });
});
