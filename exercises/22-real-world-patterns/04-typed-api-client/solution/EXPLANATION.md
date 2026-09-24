# 22/04 — A typed API client

## One source of truth, everything derived

```ts
type Endpoints = {
  "GET /users/:userId": { response: User };
  "POST /users": { body: NewUser; response: User };
};
```

Every type in the client comes out of that object type. The key gives the
method, the path and the path parameters; the value gives the query, the body
and the response. Add an endpoint and the client can call it; rename one and
every call site breaks, which is exactly what you want.

Compare with `api.get<User>("/users/" + id)`, where the type argument is
supplied by the caller. That is an **assertion** — the caller has told the
compiler what to believe, and nothing connects it to that route. Here the caller
supplies only a key, and the types follow.

## The three type-level moves

**1. Split the key.** `K extends \`${infer M} ${string}\` ? M : never` — the
literal type is the data, `infer` is the parser (10/05).

**2. Parse the path, recursively.**

```ts
P extends `${string}:${infer Param}/${infer Rest}`
  ? { readonly [K in Param]: string } & PathParams<`/${Rest}`>
  : P extends `${string}:${infer Param}`
    ? { readonly [K in Param]: string }
    : Record<never, never>;
```

Three cases, in order: a parameter with more path after it, a parameter at the
end, and no parameter. The recursive step re-adds the leading `/` so the next
parameter still has a boundary in front of it. `{ [K in Param]: string }` is a
mapped type over a single literal — the standard way to turn a captured string
into a property name.

**3. Conditional presence.**

```ts
Endpoints[K] extends { body: infer B } ? { readonly body: B } : Record<never, never>
```

Endpoints without a body contribute the empty object type, and intersecting with
`{}` changes nothing. That is how `RequestInput<"GET /health">` ends up needing
no argument fields while `RequestInput<"POST /users">` requires a body.

## Widening at the runtime boundary

```ts
const params: Record<string, unknown> = input;
```

Inside `buildRequest`, `K` is still generic, so `RequestInput<K>` is a deferred
intersection and `input.userId` will not compile (rule 6 of the repo
conventions, and 10/04's deferred conditionals). It is still an *object*, so
assigning it to a record is enough — no cast, and `noUncheckedIndexedAccess`
then types every lookup as `unknown`, which is the honest type.

This is the general shape of these clients: **rich types at the edges, plain
data in the middle.** The type-level work exists to constrain callers; the
implementation is ordinary string manipulation and should not be fighting it.

## The one cast, and why it is the weak point

```ts
return raw as ResponseOf<K>;
```

The transport returns `unknown`, honestly — nobody has looked at the response.
The endpoint map says `User`, but that is what the server **promised**, not what
arrived. Casting bridges the gap by assertion, which is precisely the mistake
17/02 exists to prevent.

Every code-generated client in the wild does this (`openapi-typescript`,
`tRPC` over an untrusted boundary, generated gRPC-web stubs), and it is fine
right up until the API changes and the types are quietly wrong.

The production fix is to put a parser in the map next to the response type:

```ts
const endpoints = {
  "GET /users/:userId": { parse: parseUser },
} as const;

const raw = await transport(buildRequest(key, input));
return endpoints[key].parse(raw);   // no cast: the type comes from the check
```

Then `ResponseOf<K>` is *derived* from the parser's return type rather than
declared alongside it, and the two cannot disagree. That is what Zod-based
clients do, and it is the right answer to "how do you know the response matches
the type?".

## Details that matter more than they look

- **`split("/")` rather than a regex.** A parameter can then only replace a
  whole segment, so `:id` can never match inside a longer word.
- **Encoding both names and values.** `encodeURIComponent` on the value only is
  the commonest bug, and it breaks the first time a filter key contains a space.
- **Dropping `undefined` query values** rather than sending `"undefined"` —
  which is a real string that servers really receive.
- **`toUrl` is separate from `buildRequest`.** The transport is handed
  structured data, not a string, so it can add a base URL, sign the request, or
  batch it. A client that builds URLs too early cannot do any of that.
- **A path parameter called `query` or `body` would collide** with the reserved
  input fields. Nesting them (`{ params: {…}, query: {…} }`) avoids it, at the
  cost of a noisier call site. Worth knowing you made the trade.

## Common mistakes

| Mistake | What happens |
|---|---|
| `api.get<User>(path)` | The type is a caller assertion; the key is unchecked |
| `PathParams` without recursion | Only the first parameter is found |
| Forgetting the `/` in `` `/${Rest}` `` | The next parameter loses its boundary and is missed |
| `RequestInput` always including `body` | `GET /health` demands a body |
| `input.userId` inside the generic function | Deferred type; does not compile |
| Encoding values but not names | Breaks on any key with a space or `&` |
| Sending `"undefined"` for an absent query value | The server receives the string |
| Building the URL inside `buildRequest` | The transport can no longer add a base URL or sign it |

## Interview angle

> *"How would you make an API client type-safe end to end?"*

Start from a map of endpoints as the single source of truth, then show the three
derivations: the key gives method and path (template literal + `infer`), the
path gives the parameters (a recursive conditional type), the value gives query,
body and response (indexed access). Then be the person who says the quiet part:
**the response type is still a promise, not a proof** — the transport returns
`unknown`, and something has to actually validate it. Put a parser next to each
endpoint and derive the response type from *that*, and now there is no cast
anywhere.

> *"Why not just generate the client from OpenAPI?"*

You usually should, and `openapi-typescript` produces exactly this shape. The
reason to be able to write it by hand is that you will have to *read* the
generated types when they go wrong, extend them for endpoints the spec does not
cover, and explain why the generated client still needs runtime validation at
the boundary.
