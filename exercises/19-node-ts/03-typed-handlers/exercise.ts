/**
 * Exercise 19/03 — Typed route handlers
 *
 * `Request` is generic, and almost nobody uses it:
 *
 *     Request<P, ResBody, ReqBody, ReqQuery>
 *              │     │        │        └── req.query
 *              │     │        └─────────── req.body
 *              │     └──────────────────── what res.json() accepts
 *              └────────────────────────── req.params
 *
 * Look at slot two. It is the RESPONSE body, sitting between the parameters
 * and the request body — the single most misread signature in Express. Fill it
 * in and `res.json()` starts checking what you send; skip it and `res.json`
 * takes `any` forever.
 *
 * With all four filled in, a handler physically cannot read `req.body.email`
 * on a route whose body has no email — the mistake becomes a red squiggle
 * rather than an `undefined` in production.
 *
 * One honest warning, because it is the follow-up question in every interview:
 * `ReqBody` is a CLAIM, not a check. Nothing at runtime verifies that the JSON
 * on the wire matches it. You still validate at the boundary (07/05); the type
 * is what keeps the rest of the file consistent with that validation.
 *
 * Read README.md first. Replace every TODO.
 */
import type { NextFunction, Request, Response } from "express";

/** Given — the domain. */
export type User = {
  id: string;
  name: string;
  role: "admin" | "editor" | "viewer";
};

export type UserStore = Map<string, User>;

/** Given — an object type with no keys, for "this route has no params/body". */
export type Empty = Record<never, never>;

export type ErrorBody = { error: string };
export type UserList = { users: readonly User[] };

export type CreateUserBody = { name: string; role: User["role"] };
export type UpdateUserBody = { name?: string; role?: User["role"] };
export type ListUsersQuery = { role?: string; limit?: string };

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// A handler type whose four parameters read in the order you actually think
// about them, and which keeps the request and the response in agreement.
//
//   TypedHandler<TParams, TBody, TQuery, TResponse>
//
//   req: Request<…>   — params, body and query all filled in
//   res: Response<…>  — the SAME response type, so res.json() is checked
//   next: NextFunction
//   returns void
//
// Mapping your four onto Express's four is the exercise. Get the order wrong
// and everything below still compiles — with `req.body` typed as the response.
export type TypedHandler<TParams, TBody, TQuery, TResponse> = unknown;

/** Given — the four routes, expressed with your alias. */
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

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// GET /users/:id
//
//   - `req.params.id` is in the store  -> 200, the user
//   - otherwise                        -> 404, { error: "user not found" }
//
// The handler is a factory over the store, so the tests can hand it a fresh
// one — the same dependency injection as the middleware factories in 19/01.
export function getUser(users: UserStore): GetUserHandler {
  throw new Error("TODO 2: implement getUser");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// POST /users
//
//   - `req.body.name` is blank (empty or whitespace) -> 400, { error: "name is required" }
//   - otherwise -> store a new user and answer 201 with it
//
// The new id is `String(users.size + 1)`, so the tests are deterministic. The
// name is stored trimmed.
//
// Note that you still check `name` at runtime even though `CreateUserBody`
// says it is a string: the type describes what the route ACCEPTS, not what
// arrived.
export function createUser(users: UserStore): CreateUserHandler {
  throw new Error("TODO 3: implement createUser");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// GET /users?role=admin&limit=2
//
//   - no query          -> 200, every user in insertion order
//   - ?role=admin       -> only users with that role
//   - ?limit=2          -> at most the first 2 of whatever is left
//   - a limit that is not a positive integer
//                       -> 400, { error: "limit must be a positive integer" }
//
// Everything in a query string is a string — `?limit=2` gives you "2", never
// 2 — which is why `ListUsersQuery` is typed the way it is.
export function listUsers(users: UserStore): ListUsersHandler {
  throw new Error("TODO 4: implement listUsers");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// PATCH /users/:id — params and body together.
//
//   - unknown id                     -> 404, { error: "user not found" }
//   - a patch with no keys at all    -> 400, { error: "nothing to update" }
//   - `name` present but blank       -> 400, { error: "name is required" }
//   - otherwise -> merge over the stored user, keep its position, answer 200
//                  with the updated user
//
// A rejected patch must leave the stored user untouched (09/03: build the
// candidate, validate it, then commit).
export function updateUser(users: UserStore): UpdateUserHandler {
  throw new Error("TODO 5: implement updateUser");
}
