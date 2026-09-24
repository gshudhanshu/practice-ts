# 19/05 — CHALLENGE: a typed router

**Tier:** Challenge · **Time:** ~40 min · **Course section:** 19 — Node & Express

---

## Where this fits

19/01–19/04 type **one handler at a time**. The last step is to make the route
table itself the source of truth, so that:

- registering a handler for `"GET /users/:id"` gives you `req.params.id` and
  nothing else — derived from the path, not restated
- registering one for a path that is not in the table does not compile
- `res.json` is checked against the response type the table declares

Two patterns you already have, pointed at routing:

| From | Pattern |
|---|---|
| [10/05](../../10-deriving-types/05-template-literal-types/) | a template literal type pulling `:id` out of a path string |
| [08/05](../../08-generics/05-typed-event-emitter/) | `K extends keyof TMap`, so one method's argument types depend on the key |

You are **applying** both, not learning them. `RouteParams` is given to you
verbatim from 10/05.

This is a small honest version of what tRPC, ts-rest, Hono and Fastify's type
providers do.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `ParamsOf<TKey>` — parameter names into a params object. |
| 2 | `RouteRequest` / `RouteResponse` / `RouteHandler`. |
| 3 | `constructor` + `routes()` + `isRoute()` (a type predicate). |
| 4 | `register` + `handlerFor` — the `K extends keyof TRoutes` pattern. |
| 5 | `dispatch` + `unhandled()`. |

### The contract

| Member | Behaviour |
|---|---|
| `constructor(declared)` | copies the manifest — a caller mutating theirs later must not change the router |
| `routes()` | the declared keys, in declaration order |
| `isRoute(key)` | narrows a `string` to a declared key |
| `register(key, handler)` | stores it, replaces on a repeat key, returns `this` |
| `handlerFor(key)` | the handler, correctly typed, or `undefined` |
| `dispatch(key, req, res)` | awaits the handler and resolves `true`; resolves `false` and touches nothing when unregistered |
| `unhandled()` | declared keys with no handler, in declaration order |

### Worked example

```ts
type Api = {
  "GET /users/:id": { body: Empty; response: User | ErrorBody };
  "POST /users":    { body: { name: string }; response: User | ErrorBody };
};

const router = new TypedRouter<Api>(["GET /users/:id", "POST /users"]);

router.register("GET /users/:id", (req, res) => {
  req.params.id;          // string
  req.params.slug;        // ✗ compile error
  res.json({ nope: 1 });  // ✗ compile error
});

router.register("GET /nope", () => {});   // ✗ not in the table
```

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `!`.
- **One `as` is permitted**, in `handlerFor`, and it must be commented. The
  handler store is heterogeneous — one map holding handlers whose request and
  response types differ per key — which is the documented exception in the repo
  conventions. It is the same single contained cast as `emit` in 08/05.
  Anywhere else in the solution, a cast is a bug.

## Done when

```bash
npm run check 19/05
```

<details>
<summary>Hint 1 — names to an object</summary>

`RouteParams` gives you a union of literal names. One mapped type (10/03) turns
that into properties:

```ts
export type ParamsOf<TKey extends string> = { [K in RouteParams<TKey>]: string };
```

A path with no parameters produces `never`, and a mapped type over `never` is
`{}` — the right answer, for free.
</details>

<details>
<summary>Hint 2 — params from the key, the rest from the spec</summary>

```ts
Request<ParamsOf<TKey>, TSpec["response"], TSpec["body"]>
```

Response body in slot two, as always (19/03). The path is written down exactly
once — in the route table's key — and everything else is derived from it.
</details>

<details>
<summary>Hint 3 — <code>keyof TRoutes & string</code></summary>

`keyof T` can include `number` and `symbol`. Intersecting with `string` keeps
only the string keys, which is what a route key is and what `Map` wants.

`isRoute` is the boundary: a method and path off the wire are a plain `string`,
and this is the one place a runtime check turns one into a key the typed API
accepts.
</details>

<details>
<summary>Hint 4 — the heterogeneous store</summary>

`StoredHandler` is given:

```ts
type StoredHandler = (req: never, res: never) => void | Promise<void>;
```

`never` parameters accept **every** handler on the way in, because parameters
are contravariant and `never` is assignable to everything. They also make the
stored value impossible to call — which is exactly why the single permitted cast
sits in `handlerFor` and nowhere else. Same trade as `Listener<never>` in 08/05.

What makes it sound: `register` is the only writer, and it can only ever store a
handler of exactly the type its key demands.
</details>

<details>
<summary>Hint 5 — <code>dispatch</code> reuses <code>handlerFor</code></summary>

Two lines of logic once `handlerFor` exists. `await` a handler that may be
synchronous is harmless, and it means an async handler has finished before the
caller continues (19/04).
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
why the manifest cannot be checked for completeness, what a real typed router
adds on top of this, and where the one cast could be removed.

**That completes section 19.** Section 20 onwards is the interview-grade bonus
block — see the [roadmap](../../../README.md#roadmap).
