/**
 * Solution — 22/04 A typed API client
 */

export type User = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
};

export type NewUser = {
  readonly name: string;
  readonly email: string;
};

export type Endpoints = {
  "GET /health": { response: { readonly ok: boolean } };
  "GET /users": {
    query: { readonly limit?: number; readonly q?: string };
    response: readonly User[];
  };
  "GET /users/:userId": { response: User };
  "POST /users": { body: NewUser; response: User };
  "PATCH /users/:userId": { body: Partial<NewUser>; response: User };
  "DELETE /users/:userId/sessions/:sessionId": {
    response: { readonly deleted: number };
  };
};

export type EndpointKey = keyof Endpoints;

export type HttpRequest = {
  readonly method: string;
  readonly path: string;
  readonly query: Readonly<Record<string, string>>;
  readonly body: unknown;
};

export type Transport = (request: HttpRequest) => Promise<unknown>;

/* ── Reading the key ────────────────────────────────────────────────────── */

// One `infer` each. The literal key type carries all the information; these
// just take it apart.
export type MethodOf<K extends EndpointKey> = K extends `${infer M} ${string}`
  ? M
  : never;

export type PathOf<K extends EndpointKey> = K extends `${string} ${infer P}`
  ? P
  : never;

/* ── Reading the path ───────────────────────────────────────────────────── */

/**
 * Recursive, in three cases:
 *
 *   1. a `:param` with more path after it — capture it and recurse on the rest
 *   2. a `:param` at the very end — capture it and stop
 *   3. no parameter at all — contribute nothing
 *
 * `Record<never, never>` is the empty object type, so intersecting it changes
 * nothing. The `/${Rest}` in the recursive step puts the slash back, so the
 * next parameter still has a boundary in front of it.
 */
export type PathParams<P extends string> =
  P extends `${string}:${infer Param}/${infer Rest}`
    ? { readonly [K in Param]: string } & PathParams<`/${Rest}`>
    : P extends `${string}:${infer Param}`
      ? { readonly [K in Param]: string }
      : Record<never, never>;

/* ── Assembling the input ───────────────────────────────────────────────── */

// `extends { query: infer Q }` is the test for "does this endpoint have one?".
// Endpoints without a query contribute an empty object type to the
// intersection, which is the same as contributing nothing.
type QueryOf<K extends EndpointKey> = Endpoints[K] extends { query: infer Q }
  ? { readonly query: Q }
  : Record<never, never>;

type BodyOf<K extends EndpointKey> = Endpoints[K] extends { body: infer B }
  ? { readonly body: B }
  : Record<never, never>;

export type RequestInput<K extends EndpointKey> = PathParams<PathOf<K>> &
  QueryOf<K> &
  BodyOf<K>;

export type ResponseOf<K extends EndpointKey> = Endpoints[K]["response"];

/* ── Runtime ────────────────────────────────────────────────────────────── */

export function buildRequest<K extends EndpointKey>(
  key: K,
  input: RequestInput<K>,
): HttpRequest {
  // Destructuring with defaults, because `split` is typed as `string[]` and
  // noUncheckedIndexedAccess makes each element `string | undefined`.
  const [method = "", template = ""] = key.split(" ");

  // A deferred intersection is still an object; widening it here is what lets
  // ordinary code read fields whose names only the type system knows.
  const params: Record<string, unknown> = input;

  const path = template
    .split("/")
    .map((segment) =>
      segment.startsWith(":") ? String(params[segment.slice(1)]) : segment,
    )
    .join("/");

  const query: Record<string, string> = {};
  const rawQuery = params["query"];

  if (typeof rawQuery === "object" && rawQuery !== null) {
    // Annotating the entries avoids the implicit `any` that Object.entries
    // hands back for a bare `object`.
    const entries: readonly (readonly [string, unknown])[] =
      Object.entries(rawQuery);

    for (const [name, value] of entries) {
      // An absent parameter is absent, not "undefined".
      if (value !== undefined) query[name] = String(value);
    }
  }

  return { method, path, query, body: params["body"] };
}

export function toUrl(request: HttpRequest): string {
  const entries: readonly (readonly [string, string])[] = Object.entries(
    request.query,
  );

  if (entries.length === 0) return request.path;

  const search = entries
    .map(
      ([name, value]) =>
        `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    )
    .join("&");

  return `${request.path}?${search}`;
}

export type Api = {
  request<K extends EndpointKey>(
    key: K,
    input: RequestInput<K>,
  ): Promise<ResponseOf<K>>;
};

export function createApi(transport: Transport): Api {
  return {
    request: async <K extends EndpointKey>(
      key: K,
      input: RequestInput<K>,
    ): Promise<ResponseOf<K>> => {
      const raw = await transport(buildRequest(key, input));

      // THE cast. The transport returns `unknown` — honestly, since nobody has
      // looked at the response — and the endpoint map only says what the
      // server PROMISED. This is the exact gap 17/02 exists to close: a
      // production client stores a parser next to each endpoint and calls it
      // here, so the type is produced by a check rather than asserted.
      return raw as ResponseOf<K>;
    },
  };
}
