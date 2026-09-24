/**
 * Exercise 19/05 — CHALLENGE: a typed router
 *
 * Everything in this section so far types ONE handler at a time. The last step
 * is to make the route table itself the source of truth, so that registering a
 * handler for "GET /users/:id" gives you `req.params.id` and nothing else, and
 * registering one for a path that does not exist does not compile.
 *
 * Two patterns you already have, pointed at routing:
 *
 *   - 10/05 — a template literal type takes ":id" out of a path string
 *   - 08/05 — `K extends keyof TMap` makes one method's argument types depend
 *             on which key was passed
 *
 * That combination is how tRPC, Hono, ts-rest and Fastify's type provider all
 * work. This is a small honest version of it.
 *
 * Read README.md first. Replace every TODO.
 */
import type { Request, Response } from "express";

/** Given — an object type with no keys. */
export type Empty = Record<never, never>;

/**
 * Given — 10/05's route-parameter extractor, unchanged.
 *
 *   RouteParams<"GET /users/:id">                     -> "id"
 *   RouteParams<"GET /users/:userId/posts/:postId">   -> "userId" | "postId"
 *   RouteParams<"GET /users">                         -> never
 */
export type RouteParams<TPath extends string> =
  TPath extends `${string}:${infer Param}/${infer Rest}`
    ? Param | RouteParams<`/${Rest}`>
    : TPath extends `${string}:${infer Last}`
      ? Last
      : never;

/** Given — what a route declares, beyond what its path already says. */
export type RouteSpec = {
  body: unknown;
  response: unknown;
};

/** Given — a route table, keyed by "METHOD /path". */
export type RouteMap = Record<string, RouteSpec>;

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Turn the parameter NAMES into a params OBJECT.
//
//   ParamsOf<"GET /users/:id">                    -> { id: string }
//   ParamsOf<"GET /users/:userId/posts/:postId">  -> { userId: string; postId: string }
//   ParamsOf<"GET /users">                        -> {}
//
// One mapped type over `RouteParams` (10/03). Every value is `string`, because
// a path segment is text — the same reason query values are strings in 19/03.
export type ParamsOf<TKey extends string> = unknown;

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// The three types a route's handler is built from. Note that the params come
// from the KEY and the rest from the SPEC — the path is not repeated anywhere.
//
//   RouteRequest<TKey, TSpec>   Request with params from TKey, body and
//                               response from TSpec
//   RouteResponse<TSpec>        Response with the spec's response type
//   RouteHandler<TKey, TSpec>   (req, res) => void | Promise<void>
//
// A handler may be async, hence the `| Promise<void>` (19/04).
export type RouteRequest<TKey extends string, TSpec extends RouteSpec> = unknown;
export type RouteResponse<TSpec extends RouteSpec> = unknown;
export type RouteHandler<TKey extends string, TSpec extends RouteSpec> = unknown;

/**
 * The store is heterogeneous by nature: one map holds handlers whose request
 * and response types differ per key, so no single element type describes it.
 *
 * `never` parameters accept every handler on the way IN, because parameters are
 * contravariant and `never` is assignable to everything. The price is that a
 * stored handler cannot be CALLED — which is what forces the one documented
 * cast in `handlerFor`. Same trade as `Listener<never>` in 08/05.
 */
type StoredHandler = (req: never, res: never) => void | Promise<void>;

export class TypedRouter<TRoutes extends RouteMap> {
  // ─── TODO 3 ────────────────────────────────────────────────────────────────
  // Construction and the read side.
  //
  //   constructor(declared)  the route keys this router serves, in order.
  //                          Copy the array — a caller mutating theirs later
  //                          must not change the router (09/01, 09/03).
  //   routes()               the declared keys, in declaration order
  //   isRoute(key)           a TYPE PREDICATE narrowing an arbitrary string to
  //                          a declared key. This is the boundary: a method and
  //                          path off the wire are plain strings, and this is
  //                          where they become part of the typed world.
  constructor(declared: readonly (keyof TRoutes & string)[]) {
    throw new Error("TODO 3: implement the constructor");
  }

  routes(): readonly (keyof TRoutes & string)[] {
    throw new Error("TODO 3: implement routes");
  }

  isRoute(key: string): boolean {
    throw new Error("TODO 3: implement isRoute");
  }

  // ─── TODO 4 ────────────────────────────────────────────────────────────────
  // Registration and lookup — the `K extends keyof TRoutes` pattern (08/05).
  //
  //   register(key, handler)  store it and return `this`, so calls chain.
  //                           Registering the same key twice replaces the
  //                           handler.
  //   handlerFor(key)         the handler for that key, correctly typed, or
  //                           undefined
  //
  // `handlerFor` is where the ONE permitted cast lives. Comment it: what makes
  // it sound is that `register` is the only writer, and it can only store a
  // handler of exactly the type this key demands.
  register<K extends keyof TRoutes & string>(
    key: K,
    handler: RouteHandler<K, TRoutes[K]>,
  ): this {
    throw new Error("TODO 4: implement register");
  }

  handlerFor<K extends keyof TRoutes & string>(
    key: K,
  ): RouteHandler<K, TRoutes[K]> | undefined {
    throw new Error("TODO 4: implement handlerFor");
  }

  // ─── TODO 5 ────────────────────────────────────────────────────────────────
  // Running a route, and knowing what is still missing.
  //
  //   dispatch(key, req, res)  await the handler and resolve to true; resolve
  //                            to false when nothing is registered for the key
  //                            (leaving req and res untouched)
  //   unhandled()              declared keys with no handler yet, in
  //                            declaration order. A startup check: an empty
  //                            list means the table and the code agree.
  async dispatch<K extends keyof TRoutes & string>(
    key: K,
    req: RouteRequest<K, TRoutes[K]>,
    res: RouteResponse<TRoutes[K]>,
  ): Promise<boolean> {
    throw new Error("TODO 5: implement dispatch");
  }

  unhandled(): readonly (keyof TRoutes & string)[] {
    throw new Error("TODO 5: implement unhandled");
  }
}
