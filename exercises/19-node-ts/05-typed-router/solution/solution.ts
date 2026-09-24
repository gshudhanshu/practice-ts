/**
 * Solution — 19/05 A typed router
 */
import type { Request, Response } from "express";

export type Empty = Record<never, never>;

export type RouteParams<TPath extends string> =
  TPath extends `${string}:${infer Param}/${infer Rest}`
    ? Param | RouteParams<`/${Rest}`>
    : TPath extends `${string}:${infer Last}`
      ? Last
      : never;

export type RouteSpec = {
  body: unknown;
  response: unknown;
};

export type RouteMap = Record<string, RouteSpec>;

/**
 * A mapped type over the parameter names. `RouteParams` is a union of string
 * literals; mapping over it produces one property per name, all `string`,
 * because a path segment is text.
 *
 * A path with no parameters gives `never`, and a mapped type over `never` is
 * `{}` — the right answer, for free.
 */
export type ParamsOf<TKey extends string> = {
  [K in RouteParams<TKey>]: string;
};

// The params come from the KEY and the rest from the SPEC, so a route's path
// is written down exactly once — in the table.
export type RouteRequest<
  TKey extends string,
  TSpec extends RouteSpec,
> = Request<ParamsOf<TKey>, TSpec["response"], TSpec["body"]>;

export type RouteResponse<TSpec extends RouteSpec> = Response<
  TSpec["response"]
>;

export type RouteHandler<TKey extends string, TSpec extends RouteSpec> = (
  req: RouteRequest<TKey, TSpec>,
  res: RouteResponse<TSpec>,
) => void | Promise<void>;

/**
 * The store is heterogeneous: one map holds handlers whose request and
 * response types differ per key, so no single element type describes it.
 *
 * `never` parameters accept every handler on the way IN (parameters are
 * contravariant, and `never` is assignable to everything) and refuse to be
 * called on the way OUT — which is what confines the unsafety to exactly one
 * line. The same trade as `Listener<never>` in 08/05.
 */
type StoredHandler = (req: never, res: never) => void | Promise<void>;

export class TypedRouter<TRoutes extends RouteMap> {
  readonly #declared: readonly (keyof TRoutes & string)[];
  readonly #handlers = new Map<string, StoredHandler>();

  constructor(declared: readonly (keyof TRoutes & string)[]) {
    // Copy: a caller mutating their array later must not change the router.
    this.#declared = [...declared];
  }

  routes(): readonly (keyof TRoutes & string)[] {
    return [...this.#declared];
  }

  // The boundary. A method and path off the wire are a plain `string`; this is
  // the one place that turns one into a key the rest of the API understands,
  // and it does it with a runtime check rather than a cast.
  isRoute(key: string): key is keyof TRoutes & string {
    return this.#declared.includes(key);
  }

  register<K extends keyof TRoutes & string>(
    key: K,
    handler: RouteHandler<K, TRoutes[K]>,
  ): this {
    // No cast needed going IN: every handler is assignable to StoredHandler.
    this.#handlers.set(key, handler);
    return this;
  }

  handlerFor<K extends keyof TRoutes & string>(
    key: K,
  ): RouteHandler<K, TRoutes[K]> | undefined {
    const stored = this.#handlers.get(key);
    if (stored === undefined) return undefined;

    // The one permitted cast, and the only line in the exercise that is not
    // checked. It is sound because `register` is the sole writer and it can
    // only store a handler of exactly the type this key demands — the
    // relationship is real, TypeScript just cannot carry it through a Map.
    return stored as RouteHandler<K, TRoutes[K]>;
  }

  async dispatch<K extends keyof TRoutes & string>(
    key: K,
    req: RouteRequest<K, TRoutes[K]>,
    res: RouteResponse<TRoutes[K]>,
  ): Promise<boolean> {
    const handler = this.handlerFor(key);
    if (handler === undefined) return false;

    // `await` on a possibly-synchronous handler is harmless, and it means an
    // async handler has finished before the caller continues (19/04).
    await handler(req, res);
    return true;
  }

  unhandled(): readonly (keyof TRoutes & string)[] {
    return this.#declared.filter((key) => !this.#handlers.has(key));
  }
}
