/**
 * Solution — 19/03 Typed route handlers
 */
import type { NextFunction, Request, Response } from "express";

export type User = {
  id: string;
  name: string;
  role: "admin" | "editor" | "viewer";
};

export type UserStore = Map<string, User>;

export type Empty = Record<never, never>;

export type ErrorBody = { error: string };
export type UserList = { users: readonly User[] };

export type CreateUserBody = { name: string; role: User["role"] };
export type UpdateUserBody = { name?: string; role?: User["role"] };
export type ListUsersQuery = { role?: string; limit?: string };

/**
 * The whole trick is the mapping. Express's order is
 *
 *     Request<P, ResBody, ReqBody, ReqQuery>
 *
 * so the response body goes in slot TWO, between the params and the request
 * body. Passing the same `TResponse` to `Response<…>` is what makes
 * `res.json()` check the payload rather than accept `any`.
 */
export type TypedHandler<TParams, TBody, TQuery, TResponse> = (
  req: Request<TParams, TResponse, TBody, TQuery>,
  res: Response<TResponse>,
  next: NextFunction,
) => void;

export type GetUserHandler = TypedHandler<
  { id: string },
  Empty,
  Empty,
  User | ErrorBody
>;
export type CreateUserHandler = TypedHandler<
  Empty,
  CreateUserBody,
  Empty,
  User | ErrorBody
>;
export type ListUsersHandler = TypedHandler<
  Empty,
  Empty,
  ListUsersQuery,
  UserList | ErrorBody
>;
export type UpdateUserHandler = TypedHandler<
  { id: string },
  UpdateUserBody,
  Empty,
  User | ErrorBody
>;

export function getUser(users: UserStore): GetUserHandler {
  // A factory over the store: the handler stays a pure function of its
  // arguments, so the spec can hand it a fresh store per test.
  return (req, res) => {
    // `req.params.id` is `string`, not `string | string[]`, because the params
    // type was declared. On a bare `Request` it would be the union.
    const user = users.get(req.params.id);

    if (user === undefined) {
      res.status(404).json({ error: "user not found" });
      return;
    }

    res.status(200).json(user);
  };
}

export function createUser(users: UserStore): CreateUserHandler {
  return (req, res) => {
    // The TYPE says `name` is a string. Nothing on the wire promised that, so
    // the content check still happens here (07/05).
    const name = req.body.name.trim();

    if (name === "") {
      res.status(400).json({ error: "name is required" });
      return;
    }

    const user: User = {
      id: String(users.size + 1),
      name,
      role: req.body.role,
    };

    users.set(user.id, user);
    res.status(201).json(user);
  };
}

export function listUsers(users: UserStore): ListUsersHandler {
  return (req, res) => {
    const { role, limit } = req.query;

    // `limit` is `string | undefined` — a query string has no numbers in it,
    // and pretending otherwise is where `NaN` gets into a database query.
    let count: number | undefined;
    if (limit !== undefined) {
      const parsed = Number(limit);
      if (limit.trim() === "" || !Number.isInteger(parsed) || parsed < 1) {
        res.status(400).json({ error: "limit must be a positive integer" });
        return;
      }
      count = parsed;
    }

    let matches = [...users.values()];
    if (role !== undefined) {
      matches = matches.filter((user) => user.role === role);
    }
    if (count !== undefined) {
      matches = matches.slice(0, count);
    }

    res.status(200).json({ users: matches });
  };
}

export function updateUser(users: UserStore): UpdateUserHandler {
  return (req, res) => {
    const id = req.params.id;
    const existing = users.get(id);

    if (existing === undefined) {
      res.status(404).json({ error: "user not found" });
      return;
    }

    const patch = req.body;
    if (Object.keys(patch).length === 0) {
      res.status(400).json({ error: "nothing to update" });
      return;
    }

    // Build the candidate, validate THAT, then commit — so a rejected patch
    // cannot leave a half-written user behind (09/03).
    //
    // The spread yields a `User` with no cast because `UpdateUserBody` has
    // exact optional properties: under `exactOptionalPropertyTypes` a present
    // key can never hold `undefined`, so nothing can be blanked out.
    const candidate: User = { ...existing, ...patch };

    if (candidate.name.trim() === "") {
      res.status(400).json({ error: "name is required" });
      return;
    }

    const updated: User = { ...candidate, name: candidate.name.trim() };

    // Re-setting an existing Map key keeps its original position.
    users.set(id, updated);
    res.status(200).json(updated);
  };
}
