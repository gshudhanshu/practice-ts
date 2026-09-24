import { describe, expect, it } from "vitest";
import type {
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from "express";
import type { Equal, Expect, ExpectFalse, Extends } from "../../../src/type-testing";
import {
  createUser,
  getUser,
  listUsers,
  updateUser,
  type CreateUserBody,
  type CreateUserHandler,
  type Empty,
  type ErrorBody,
  type GetUserHandler,
  type ListUsersHandler,
  type ListUsersQuery,
  type TypedHandler,
  type UpdateUserBody,
  type UpdateUserHandler,
  type User,
  type UserList,
  type UserStore,
} from "./exercise";

/* ── Test doubles ───────────────────────────────────────────────────────────
 *
 * As in 19/01 and 19/02: a handler is a pure function, so it is called
 * directly. The two casts below are the only ones in the exercise.
 */

type ReqInit = {
  headers?: Record<string, string | string[]>;
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

function fakeNext(): { next: NextFunction; calls: unknown[] } {
  const calls: unknown[] = [];
  const next: NextFunction = (error?: unknown) => {
    calls.push(error);
  };
  return { next, calls };
}

/* ── Fixtures ───────────────────────────────────────────────────────────── */

const ada: User = { id: "1", name: "Ada", role: "admin" };
const bob: User = { id: "2", name: "Bob", role: "viewer" };

const seed = (): UserStore =>
  new Map<string, User>([
    ["1", { ...ada }],
    ["2", { ...bob }],
  ]);

/* The request/response types each route is called with. Written out here on
   purpose: they pin Express's real parameter order independently of the alias
   the exercise builds. */
type GetUserReq = Request<{ id: string }, User | ErrorBody, Empty, Empty>;
type CreateUserReq = Request<Empty, User | ErrorBody, CreateUserBody, Empty>;
type ListUsersReq = Request<Empty, UserList | ErrorBody, Empty, ListUsersQuery>;
type UpdateUserReq = Request<
  { id: string },
  User | ErrorBody,
  UpdateUserBody,
  Empty
>;
type UserRes = Response<User | ErrorBody>;
type ListRes = Response<UserList | ErrorBody>;

/* ── Compile-time spec ──────────────────────────────────────────────────── */

// The mapping, pinned exactly. Express puts the RESPONSE body in slot two.
type _mapping = Expect<
  Equal<
    TypedHandler<{ id: string }, { a: number }, { q?: string }, { ok: true }>,
    (
      req: Request<{ id: string }, { ok: true }, { a: number }, { q?: string }>,
      res: Response<{ ok: true }>,
      next: NextFunction,
    ) => void
  >
>;

type _getUser = Expect<
  Equal<typeof getUser, (users: UserStore) => GetUserHandler>
>;
type _createUser = Expect<
  Equal<typeof createUser, (users: UserStore) => CreateUserHandler>
>;
type _listUsers = Expect<
  Equal<typeof listUsers, (users: UserStore) => ListUsersHandler>
>;
type _updateUser = Expect<
  Equal<typeof updateUser, (users: UserStore) => UpdateUserHandler>
>;

// Worth knowing: a fully typed handler is NOT assignable to the bare
// `RequestHandler`, whose params are `ParamsDictionary` (every value is
// `string | string[]`). `app.get("/users/:id", …)` still accepts it, because
// that overload infers the parameters from the path literal.
type _notAPlainHandler = ExpectFalse<Extends<GetUserHandler, RequestHandler>>;

function _compileTimeOnly(): void {
  const get: GetUserHandler = (req, res) => {
    const id: string = req.params.id;
    void id;

    // @ts-expect-error — this route declares exactly one parameter.
    req.params.slug;

    // @ts-expect-error — a GET route declares no body, so there is nothing to read.
    req.body.name;

    // @ts-expect-error — res.json() is checked against the declared response.
    res.json({ nope: true });

    res.status(404).json({ error: "user not found" });
  };
  void get;

  const create: CreateUserHandler = (req, res) => {
    const name: string = req.body.name;
    const role: User["role"] = req.body.role;
    void name;
    void role;

    // @ts-expect-error — the body has no `email`, so a typo cannot compile.
    req.body.email;

    // @ts-expect-error — "owner" is not one of the three roles.
    res.json({ id: "9", name: "X", role: "owner" });
  };
  void create;

  const list: ListUsersHandler = (req, res) => {
    const limit = req.query.limit;
    // Everything in a query string arrives as a string, including "2".
    type _queryIsString = Expect<Equal<typeof limit, string | undefined>>;

    // @ts-expect-error — there is no number in a query string.
    const parsed: number = req.query.limit;
    void parsed;

    res.status(200).json({ users: [] });
  };
  void list;
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("getUser", () => {
  it("answers 200 with the user", () => {
    const { res, recorder } = fakeRes<UserRes>();
    getUser(seed())(
      fakeReq<GetUserReq>({ params: { id: "1" } }),
      res,
      fakeNext().next,
    );

    expect(recorder.status).toBe(200);
    expect(recorder.body).toEqual(ada);
  });

  it("answers 404 for an unknown id", () => {
    const { res, recorder } = fakeRes<UserRes>();
    getUser(seed())(
      fakeReq<GetUserReq>({ params: { id: "99" } }),
      res,
      fakeNext().next,
    );

    expect(recorder.status).toBe(404);
    expect(recorder.body).toEqual({ error: "user not found" });
  });

  it("responds exactly once and does not call next", () => {
    const { res, recorder } = fakeRes<UserRes>();
    const { next, calls } = fakeNext();
    getUser(seed())(fakeReq<GetUserReq>({ params: { id: "1" } }), res, next);

    expect(recorder.responses).toBe(1);
    expect(calls).toEqual([]);
  });
});

describe("createUser", () => {
  it("stores the user and answers 201", () => {
    const users = seed();
    const { res, recorder } = fakeRes<UserRes>();

    createUser(users)(
      fakeReq<CreateUserReq>({ body: { name: "Cleo", role: "editor" } }),
      res,
      fakeNext().next,
    );

    expect(recorder.status).toBe(201);
    expect(recorder.body).toEqual({ id: "3", name: "Cleo", role: "editor" });
    expect(users.get("3")).toEqual({ id: "3", name: "Cleo", role: "editor" });
    expect(users.size).toBe(3);
  });

  it("trims the stored name", () => {
    const users = seed();
    createUser(users)(
      fakeReq<CreateUserReq>({ body: { name: "  Cleo  ", role: "editor" } }),
      fakeRes<UserRes>().res,
      fakeNext().next,
    );

    expect(users.get("3")?.name).toBe("Cleo");
  });

  it("rejects a blank name and stores nothing", () => {
    for (const name of ["", "   "]) {
      const users = seed();
      const { res, recorder } = fakeRes<UserRes>();

      createUser(users)(
        fakeReq<CreateUserReq>({ body: { name, role: "editor" } }),
        res,
        fakeNext().next,
      );

      expect(recorder.status).toBe(400);
      expect(recorder.body).toEqual({ error: "name is required" });
      expect(users.size).toBe(2);
    }
  });
});

describe("listUsers", () => {
  it("returns everything in insertion order", () => {
    const { res, recorder } = fakeRes<ListRes>();
    listUsers(seed())(fakeReq<ListUsersReq>(), res, fakeNext().next);

    expect(recorder.status).toBe(200);
    expect(recorder.body).toEqual({ users: [ada, bob] });
  });

  it("filters by role", () => {
    const { res, recorder } = fakeRes<ListRes>();
    listUsers(seed())(
      fakeReq<ListUsersReq>({ query: { role: "viewer" } }),
      res,
      fakeNext().next,
    );

    expect(recorder.body).toEqual({ users: [bob] });
  });

  it("returns an empty list for an unmatched role", () => {
    const { res, recorder } = fakeRes<ListRes>();
    listUsers(seed())(
      fakeReq<ListUsersReq>({ query: { role: "nobody" } }),
      res,
      fakeNext().next,
    );

    expect(recorder.body).toEqual({ users: [] });
  });

  it("applies the limit after the filter", () => {
    const { res, recorder } = fakeRes<ListRes>();
    listUsers(seed())(
      fakeReq<ListUsersReq>({ query: { limit: "1" } }),
      res,
      fakeNext().next,
    );

    expect(recorder.body).toEqual({ users: [ada] });
  });

  it("rejects a limit that is not a positive integer", () => {
    for (const limit of ["0", "-1", "1.5", "many", ""]) {
      const { res, recorder } = fakeRes<ListRes>();
      listUsers(seed())(
        fakeReq<ListUsersReq>({ query: { limit } }),
        res,
        fakeNext().next,
      );

      expect(recorder.status).toBe(400);
      expect(recorder.body).toEqual({
        error: "limit must be a positive integer",
      });
    }
  });
});

describe("updateUser", () => {
  it("merges the patch and answers 200", () => {
    const users = seed();
    const { res, recorder } = fakeRes<UserRes>();

    updateUser(users)(
      fakeReq<UpdateUserReq>({
        params: { id: "1" },
        body: { name: "Ada L" },
      }),
      res,
      fakeNext().next,
    );

    expect(recorder.status).toBe(200);
    expect(recorder.body).toEqual({ id: "1", name: "Ada L", role: "admin" });
    expect(users.get("1")).toEqual({ id: "1", name: "Ada L", role: "admin" });
  });

  it("keeps the user in its original position", () => {
    const users = seed();
    updateUser(users)(
      fakeReq<UpdateUserReq>({ params: { id: "1" }, body: { role: "editor" } }),
      fakeRes<UserRes>().res,
      fakeNext().next,
    );

    expect([...users.keys()]).toEqual(["1", "2"]);
  });

  it("answers 404 for an unknown id", () => {
    const { res, recorder } = fakeRes<UserRes>();
    updateUser(seed())(
      fakeReq<UpdateUserReq>({ params: { id: "99" }, body: { name: "X" } }),
      res,
      fakeNext().next,
    );

    expect(recorder.status).toBe(404);
    expect(recorder.body).toEqual({ error: "user not found" });
  });

  it("rejects an empty patch", () => {
    const users = seed();
    const { res, recorder } = fakeRes<UserRes>();

    updateUser(users)(
      fakeReq<UpdateUserReq>({ params: { id: "1" }, body: {} }),
      res,
      fakeNext().next,
    );

    expect(recorder.status).toBe(400);
    expect(recorder.body).toEqual({ error: "nothing to update" });
    expect(users.get("1")).toEqual(ada);
  });

  it("rejects a blank name and leaves the stored user untouched", () => {
    const users = seed();
    const { res, recorder } = fakeRes<UserRes>();

    updateUser(users)(
      fakeReq<UpdateUserReq>({ params: { id: "1" }, body: { name: "   " } }),
      res,
      fakeNext().next,
    );

    expect(recorder.status).toBe(400);
    expect(recorder.body).toEqual({ error: "name is required" });
    expect(users.get("1")).toEqual(ada);
  });
});
