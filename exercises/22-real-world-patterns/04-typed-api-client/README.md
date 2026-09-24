# 22/04 — CHALLENGE: a typed API client

**Tier:** Challenge · **Time:** ~40 min · **Course section:** 22 — Real-world patterns

---

## What is wrong with every API client you have used

```ts
const user = await api.get<User>("/users/" + id);
```

Three separate lies in one line:

- `<User>` is supplied **by the caller**. It is an assertion, not a check —
  nothing connects it to that path.
- `"/users/"` is a string. `"/uesrs/"` compiles just as well.
- The id is concatenated, so nothing verifies that this route takes one, or
  that you passed all of them.

The fix is to make the **endpoint map** the source of truth and derive
everything from it:

```ts
const user = await api.request("GET /users/:userId", { userId: "u1" });
//    ^? User — derived from the key, not asserted by you
```

A wrong key, a missing parameter, a body on a GET, a `string` where the query
wants a `number` — all compile errors.

This is `K extends keyof TMap` + `TMap[K]` from
[08/05](../../08-generics/05-typed-event-emitter/), with
[10/05](../../10-deriving-types/05-template-literal-types/)'s template literal
types parsing the path. Both applied, neither re-taught.

## Your task

Open `exercise.ts` and resolve all five TODOs. The domain types, the
`Endpoints` map and `HttpRequest` are given.

| # | Requirement |
|---|---|
| 1 | `MethodOf<K>`, `PathOf<K>` — split `"GET /users/:userId"`. |
| 2 | `PathParams<P>` — recursive extraction of `:params`. |
| 3 | `RequestInput<K>`, `ResponseOf<K>`. |
| 4 | `buildRequest(key, input)` — substitution, query, body. |
| 5 | `toUrl(request)` and `createApi(transport)`. |

### What the types must produce

| Type | Result |
|---|---|
| `MethodOf<"DELETE /a/:b/c/:d">` | `"DELETE"` |
| `PathOf<"GET /users/:userId">` | `"/users/:userId"` |
| `PathParams<"/users">` | no properties |
| `PathParams<"/users/:userId">` | `{ readonly userId: string }` |
| `PathParams<"/users/:a/sessions/:b">` | both, intersected |
| `RequestInput<"GET /health">` | no properties |
| `RequestInput<"POST /users">` | `{ body: NewUser }` |
| `RequestInput<"GET /users/:userId">` | `{ userId: string }` |
| `ResponseOf<"GET /users">` | `readonly User[]` |

### What the runtime must produce

```ts
buildRequest("DELETE /users/:userId/sessions/:sessionId", { userId: "u1", sessionId: "s2" })
// { method: "DELETE", path: "/users/u1/sessions/s2", query: {}, body: undefined }

buildRequest("GET /users", { query: { limit: 2, q: "ada" } })
// { method: "GET", path: "/users", query: { limit: "2", q: "ada" }, body: undefined }

toUrl({ path: "/users", query: { limit: "2", q: "a b" }, … })  // "/users?limit=2&q=a%20b"
toUrl({ path: "/users", query: {}, … })                        // "/users"
```

Query names *and* values are `encodeURIComponent`-encoded, in insertion order,
and a query value of `undefined` is dropped rather than sent as `"undefined"`.

## Rules

- Do not edit `exercise.test.ts`.
- **One `as` is permitted**, in `createApi`, turning the transport's `unknown`
  into `ResponseOf<K>`. It must be commented. That cast is a genuine weakness —
  the endpoint map records what the server *promised* — and
  [17/02](../../17-libs-practice/02-runtime-validation-boundary/) is the fix;
  the EXPLANATION covers how the two combine.
- No other cast, no `any`, no `!`.
- Nothing may take a caller-supplied type argument. Every type comes from the
  map.

## Done when

```bash
npm run check 22/04
```

<details>
<summary>Hint 1 — splitting the key</summary>

```ts
export type MethodOf<K extends EndpointKey> = K extends `${infer M} ${string}` ? M : never;
```

The literal key type carries everything; `infer` inside a template literal takes
it apart (10/05).
</details>

<details>
<summary>Hint 2 — <code>PathParams</code> has three cases</summary>

```ts
export type PathParams<P extends string> =
  P extends `${string}:${infer Param}/${infer Rest}`
    ? { readonly [K in Param]: string } & PathParams<`/${Rest}`>
    : P extends `${string}:${infer Param}`
      ? { readonly [K in Param]: string }
      : Record<never, never>;
```

A `:param` with more path after it, a `:param` at the end, and no parameter at
all. Note `` `/${Rest}` `` in the recursion — putting the slash back keeps the
next parameter's boundary intact. `Record<never, never>` is the empty object
type, so intersecting it contributes nothing.
</details>

<details>
<summary>Hint 3 — "does this endpoint have a body?"</summary>

```ts
type BodyOf<K extends EndpointKey> = Endpoints[K] extends { body: infer B }
  ? { readonly body: B }
  : Record<never, never>;
```

Same trick for `query`. Endpoints without one contribute an empty object type to
the intersection — which is the same as contributing nothing.
</details>

<details>
<summary>Hint 4 — reading a generic input at runtime</summary>

```ts
const params: Record<string, unknown> = input;
```

`RequestInput<K>` is a deferred intersection while `K` is generic, so you cannot
read `input.userId` directly. It is still an object, so widening it to a record
lets ordinary code do the work — and `noUncheckedIndexedAccess` makes every
lookup `unknown`, which is correct.

`key.split(" ")` needs destructuring defaults for the same reason:
`const [method = "", template = ""] = key.split(" ");`
</details>

<details>
<summary>Hint 5 — substitution is a map over segments</summary>

```ts
template
  .split("/")
  .map((segment) => (segment.startsWith(":") ? String(params[segment.slice(1)]) : segment))
  .join("/");
```

Splitting on `/` rather than using a regex means a parameter can only ever
replace a whole segment — no accidental match inside a longer word.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md).

Next: [22/05 — the domain layer](../05-domain-layer/), which combines this
section's first three patterns.
