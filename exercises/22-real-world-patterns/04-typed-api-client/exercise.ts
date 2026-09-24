/**
 * Exercise 22/04 — CHALLENGE: a typed API client
 *
 * Most API clients are one of these:
 *
 *   api.get<User>("/users/" + id)          // the type is a wish
 *   api.get("/uesrs/" + id)                // a typo, at runtime, in production
 *
 * The generic is supplied by the caller, so it is an assertion, not a check;
 * the path is a string, so nothing verifies it exists; and the parameters are
 * concatenated, so nothing verifies you passed them.
 *
 * A better client is driven by a MAP of endpoints. One object type describes
 * every route, and the request function reads its parameter and return types
 * out of that map by key:
 *
 *   const user = await api.request("GET /users/:userId", { userId: "u1" });
 *   //    ^? User — derived, not asserted
 *
 * This is `K extends keyof TMap` plus `TMap[K]` — the pattern from
 * 08/05's event emitter — applied to HTTP, with 10/05's template literal types
 * doing the path parsing. Applied, not re-taught.
 *
 * NOTE: this exercise permits ONE documented `as`, in `createApi`. See README.
 *
 * Read README.md first. Replace every TODO.
 */

/* ── The domain and the map (given) ─────────────────────────────────────── */

export type User = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
};

export type NewUser = {
  readonly name: string;
  readonly email: string;
};

/**
 * The single source of truth for the whole API. A key is
 * `"<METHOD> <path>"`; `:name` marks a path parameter.
 */
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

/** What a transport is handed. Deliberately not a URL — see TODO 5. */
export type HttpRequest = {
  readonly method: string;
  readonly path: string;
  readonly query: Readonly<Record<string, string>>;
  readonly body: unknown;
};

export type Transport = (request: HttpRequest) => Promise<unknown>;

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Split the key. Both are one `infer` inside a template literal type (10/05).
//
//   MethodOf<"GET /users/:userId">  ->  "GET"
//   PathOf<"GET /users/:userId">    ->  "/users/:userId"
export type MethodOf<K extends EndpointKey> = string;

export type PathOf<K extends EndpointKey> = string;

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// Extract the `:params` from a path, as an object type.
//
//   PathParams<"/users">                        ->  no properties
//   PathParams<"/users/:userId">                ->  { readonly userId: string }
//   PathParams<"/users/:userId/sessions/:sid">  ->  { readonly userId: string }
//                                                 & { readonly sid: string }
//
// This needs RECURSION: match a `:param` that is followed by more path, peel it
// off, and recurse on the rest. Then a second case for a `:param` at the very
// end, and a base case of "no parameters at all".
//
// Careful with the greedy/lazy behaviour of `${infer X}` — `${string}:${infer P}/${infer Rest}`
// gives you the FIRST parameter and everything after the next slash.
export type PathParams<P extends string> = Record<string, string>;

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Assemble the argument type for one endpoint, and read its response type.
//
//   RequestInput<"GET /health">      ->  no properties
//   RequestInput<"GET /users">       ->  { query: { limit?: number; q?: string } }
//   RequestInput<"GET /users/:userId">  ->  { userId: string }
//   RequestInput<"POST /users">      ->  { body: NewUser }
//   RequestInput<"DELETE /users/:userId/sessions/:sessionId">
//                                    ->  { userId: string; sessionId: string }
//
// An intersection of three parts: the path params, `{ query }` if the endpoint
// declares one, and `{ body }` if it declares one. Use a conditional with
// `infer` to test for each, so endpoints without them contribute nothing.
//
//   ResponseOf<K>  the endpoint's `response` — an indexed access (10/02).
export type RequestInput<K extends EndpointKey> = Record<string, unknown>;

export type ResponseOf<K extends EndpointKey> = unknown;

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Turn a key plus its input into a plain request. This is where the types stop
// and ordinary code starts.
//
//   buildRequest("GET /users", { query: { limit: 2 } })
//     -> { method: "GET", path: "/users", query: { limit: "2" }, body: undefined }
//
//   buildRequest("DELETE /users/:userId/sessions/:sessionId",
//                { userId: "u1", sessionId: "s2" })
//     -> { method: "DELETE", path: "/users/u1/sessions/s2", query: {}, body: undefined }
//
// Rules: every `:param` segment is replaced by the matching input field,
// stringified; query values are stringified and an `undefined` one is dropped;
// `body` is passed through untouched, or `undefined` when the endpoint has none.
export function buildRequest<K extends EndpointKey>(
  key: K,
  input: RequestInput<K>,
): HttpRequest {
  throw new Error("TODO 4: implement buildRequest");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// The last mile.
//
//   toUrl({ path: "/users", query: { limit: "2", q: "a b" } })
//     -> "/users?limit=2&q=a%20b"        (encodeURIComponent, insertion order)
//   toUrl({ path: "/users", query: {} })
//     -> "/users"                        (no bare "?")
//
//   createApi(transport)  returns an object with ONE method, `request`, whose
//                         input and output types both follow the key.
//
// `transport` returns `Promise<unknown>` — honestly, since nothing has checked
// the response. Turning that into `ResponseOf<K>` is the one permitted cast in
// this exercise, and it is a real weakness: see the EXPLANATION for what a
// production client does about it.
export function toUrl(request: HttpRequest): string {
  throw new Error("TODO 5: implement toUrl");
}

export type Api = {
  request<K extends EndpointKey>(
    key: K,
    input: RequestInput<K>,
  ): Promise<ResponseOf<K>>;
};

export function createApi(transport: Transport): Api {
  throw new Error("TODO 5: implement createApi");
}
