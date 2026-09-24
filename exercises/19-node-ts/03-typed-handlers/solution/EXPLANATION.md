# 19/03 — Typed route handlers

## The parameter order

```ts
Request<P, ResBody, ReqBody, ReqQuery, Locals>
```

`ResBody` is slot **two**, before the request body. Nothing about the name
ordering suggests that, and getting it wrong is silent: you end up with
`req.body` typed as your response shape, and `res.json()` accepting your request
shape, and both of them "work" until a field name differs.

The reason for the order is historical — `ResBody` was added second, when
`Response<ResBody>` was introduced, and inserting it at the end would have been
just as arbitrary. The practical defence is to never write `Request<…>` by hand
at a call site. Write it once:

```ts
export type TypedHandler<TParams, TBody, TQuery, TResponse> = (
  req: Request<TParams, TResponse, TBody, TQuery>,
  res: Response<TResponse>,
  next: NextFunction,
) => void;
```

and let every route use the alias, in an order that matches how you think.

## Passing `TResponse` to both

This is the half people skip. Filling in `Request`'s generics types the *input*;
`Response<TResponse>` types the *output*:

```ts
res.json({ nope: true });   // ✗ once Response is parameterised
```

`Response<ResBody>` declares `json: Send<ResBody, this>` where
`Send<ResBody, T> = (body?: ResBody) => T`. Unparameterised, `ResBody` defaults
to `any` — which is why the default `res.json()` accepts literally anything, and
why a route can quietly return a shape its client does not expect.

Using the *same* type variable on both sides is what keeps a handler internally
consistent: the thing you promised to return is the thing `res.json` will let
you return.

## `Empty` has to be `Record<never, never>`

```ts
type Empty = Record<never, never>;      // {} — no keys at all
type Wrong = Record<string, never>;     // every key is legal, valued `never`
```

With `Record<string, never>` the index signature means `req.params.anything`
type-checks (as `never`), and the whole "you cannot read a field that was never
declared" property evaporates. The mapped type over `never` produces an object
type with no properties, which is what "this route has no parameters" actually
means.

## A typed handler is *not* a `RequestHandler`

The spec asserts this, and it surprises people:

```ts
type _ = ExpectFalse<Extends<GetUserHandler, RequestHandler>>;
```

`RequestHandler`'s request is `Request<ParamsDictionary, …>`, and
`ParamsDictionary` is `{ [key: string]: string | string[] }`. Your handler wants
`{ id: string }`. Parameters are contravariant, so for your handler to stand in
for a `RequestHandler` it would have to accept `string | string[]` where it has
declared `string`. It cannot, so it does not.

And yet this compiles:

```ts
app.get("/users/:id", getUser(store));
```

because `app.get` has an overload generic in the **route string**:

```ts
<Route extends string>(path: Route, ...handlers: Array<RequestHandler<RouteParameters<Route>>>): T
```

`RouteParameters<"/users/:id">` is a template-literal type that extracts
`{ id: string }` from the path — the same machinery you build in 19/05. So the
params line up, and the route literal is what makes it work.

Two things follow. Storing handlers in a `RequestHandler[]` and registering them
later loses that inference, so it will not type-check. And the path literal has
to be a literal: assign it to a `string` variable first and `RouteParameters`
collapses to `ParamsDictionary`.

## The type is a claim, not a check

```ts
const name = req.body.name.trim();
```

`CreateUserBody` says `name` is a string. Nothing on the wire promised that.
`express.json()` will happily hand you `{ name: 42 }`, or `{}`, and `.trim()`
throws.

That is not an argument against typing the body — it is an argument for
understanding what the type is *for*. It documents the contract, keeps the
handler and its callers consistent, and makes typos impossible. Enforcing it is
a separate job, done once at the boundary:

```ts
app.post("/users", validate(CreateUserSchema), createUser(store));
```

with a schema library deriving `CreateUserBody` from the schema (07/05's closing
point), so the runtime check and the compile-time type cannot drift.

Interviewers ask this specifically because a candidate who thinks
`Request<…, ReqBody>` validates anything has not shipped an API.

## Query values are strings. All of them.

```ts
type ListUsersQuery = { role?: string; limit?: string };
```

`?limit=2` is `"2"`. `?limit=` is `""`. `?limit=2&limit=3` is `["2", "3"]` —
Express's real query type (`ParsedQs`) models that as
`string | string[] | ParsedQs | ParsedQs[] | undefined`, which is honest and
awful to consume. Declaring the narrow shape you intend to support and parsing
it yourself is the usual trade:

```ts
const parsed = Number(limit);
if (limit.trim() === "" || !Number.isInteger(parsed) || parsed < 1) { …400… }
```

`Number("")` is `0`, `Number(" ")` is `0`, `Number("many")` is `NaN`,
`Number("1.5")` is not an integer. One condition covers all four, and the
explicit empty-string check is there because `0` would otherwise be indexed as a
plausible number rather than a missing value.

## Validate the merge, then commit

```ts
const candidate: User = { ...existing, ...patch };
if (candidate.name.trim() === "") { …400…; return; }
users.set(id, candidate);
```

Nothing is written until it is known good, so there is no rollback to implement
— the same shape as 09/03's `Table.update`, and the reason the spec re-reads the
stored user after every rejected patch.

The spread needs no cast because `UpdateUserBody` has **exact** optional
properties: under `exactOptionalPropertyTypes` a present key can never hold
`undefined`, so `{ ...existing, ...patch }` cannot blank a field out. With a
`{ name?: string | undefined }` patch type it could, and TypeScript would
correctly refuse the assignment to `User`.

## `Map` for a store, again

O(1) lookup by id, guaranteed insertion order for `listUsers`, and `set` on an
existing key keeping its position — which is what makes "an update does not move
a user to the end of the list" true without extra work. The spec checks it.

## Common mistakes

| Mistake | What happens |
|---|---|
| `Request<Params, Body, …>` | `req.body` is your response type; both "work" until a field differs |
| `Response` left unparameterised | `res.json` accepts anything; the route can return the wrong shape |
| `Empty = Record<string, never>` | The index signature makes every key legal again |
| Trusting `req.body` because it is typed | `.trim()` on a number that arrived over the wire |
| `req.query.limit` treated as a number | `NaN` reaches the store, or `"2" + 1 === "21"` |
| Writing then validating the patch | The store is left holding a rejected value |
| `delete` + `set` on update | The user moves to the end; the ordering test fails |
| Handlers stored in a `RequestHandler[]` | Loses the route-literal inference; will not type-check |

## Interview angle

> *"How do you type an Express route handler properly?"*

Fill in `Request`'s generics — and name the order, because that is the actual
test: `Request<Params, ResBody, ReqBody, Query>`, response body second. Pass the
same response type to `Response<…>` so `res.json` is checked rather than `any`.
Wrap it in one alias so no call site writes the raw order. Then the caveat:
`ReqBody` is a claim about the contract, not a runtime check, so validation
still happens at the boundary — ideally with the type derived from the schema.

> *"Where does the type system stop helping you in a web server?"*

At every I/O boundary: the request body, the query string, environment
variables, database rows, third-party responses. All of it arrives as `unknown`
in truth, whatever the declaration says. The job is to make the boundary narrow
and explicit — parse once, into a real type — so the *inside* of the app can be
fully typed and the unchecked surface is a handful of known places.
