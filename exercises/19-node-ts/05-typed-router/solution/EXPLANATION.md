# 19/05 — A typed router

## The idea in one line

The route key is the source of truth. Everything else — the parameter names,
the request type, the response type, which keys are even registerable — is
*derived* from it. That is section 10's rule applied to routing: if a type and a
value describe the same thing, derive one from the other so they cannot drift.

```ts
type Api = {
  "GET /users/:id": { body: Empty; response: User | ErrorBody };
};
```

`:id` appears once. `req.params.id` exists because of it, and `req.params.slug`
does not.

## `ParamsOf` — a mapped type over a union

```ts
export type ParamsOf<TKey extends string> = { [K in RouteParams<TKey>]: string };
```

`RouteParams` (10/05, given here unchanged) produces a union of literal names.
Mapping over a union of string literals produces one property per member — that
is the whole of it. Two details make it pleasant:

- every value is `string`, because a path segment is text. The same reason query
  values are strings in 19/03, and the same reason "coerce at the boundary"
  keeps coming up.
- a path with no parameters gives `never`, and a mapped type over `never` is
  `{}`. No special case needed, and `{}` is precisely "an object with no
  properties", so `req.params.id` correctly fails to compile.

## `K extends keyof TRoutes & string`

```ts
register<K extends keyof TRoutes & string>(
  key: K,
  handler: RouteHandler<K, TRoutes[K]>,
): this
```

This is 08/05's shape. `K` is inferred from the *argument*, so passing
`"GET /users/:id"` fixes `K` to that literal, and `RouteHandler<K, TRoutes[K]>`
then resolves to exactly the handler that route needs. Pass a key the table does
not contain and the constraint fails — no runtime check involved.

`& string` matters: `keyof T` also admits `number` and `symbol`. Intersecting
narrows it to the string keys, which is what a route key is and what a `Map`
wants.

## The heterogeneous store and the one cast

One map holds handlers whose request and response types differ per key. There is
no element type that describes them all, so something has to give. The trick is
to choose *where*:

```ts
type StoredHandler = (req: never, res: never) => void | Promise<void>;
```

Parameters are contravariant, and `never` is assignable to everything, so **every**
handler is assignable to `StoredHandler`. That makes `register` cast-free —
which is the important half, because `register` is where a wrong handler would
actually be a bug.

The price is that a `StoredHandler` cannot be called: its parameters are `never`.
So the unsafety is pushed into one line:

```ts
return stored as RouteHandler<K, TRoutes[K]>;
```

What makes it sound is not the compiler, it is the class invariant: `register`
is the only writer, and its signature can only accept a handler of exactly the
type this key demands. The relationship is real; TypeScript simply cannot carry
it through a `Map`.

That is the general shape of a contained cast, and it is worth being able to
articulate: **one line, behind a fully typed public API, justified by an
invariant the class enforces.** Compare it to `as any` sprinkled at use sites,
where there is no invariant and no boundary.

### Could the cast be removed?

Yes, at a cost. Store a *closure* per key instead of the handler:

```ts
#dispatchers = new Map<string, (req: never, res: never) => …>
```

and build the closure inside `register`, where `K` is still in scope. The
closure captures the correctly-typed handler and the compiler follows it. What
you lose is `handlerFor` returning the original function — which the spec checks
by reference, and which is genuinely useful for testing and for mounting the
same handler twice. Trading one commented cast for that is not obviously a win,
and being able to say *why* is more valuable than the purity.

## `isRoute` is the boundary

```ts
isRoute(key: string): key is keyof TRoutes & string {
  return this.#declared.includes(key);
}
```

Everything above assumes you already have a literal key. In a real server you
have `` `${req.method} ${req.route.path}` `` — a `string`. This method is the
single place where a runtime check converts one world into the other, and the
predicate is what records that conversion in the type system.

The pattern generalises far beyond routing: environment variables, feature
flags, message types off a queue. A union of literals plus one predicate that
checks membership at runtime is how untyped input becomes typed data — with the
check in exactly one place instead of a cast in twenty.

## The manifest is checked for extras, not for gaps

```ts
constructor(declared: readonly (keyof TRoutes & string)[])
```

This rejects a key that is not in `TRoutes`. It does **not** notice a key that
is missing, because an array type says nothing about which elements are present.

If completeness matters, the usual trick is to demand a **tuple** — which does
know its members — and subtract it from the key union. It needs the curried
helper, because the tuple type has to be inferred from the value while the union
is supplied by hand:

```ts
const exhaustive =
  <TUnion,>() =>
  <TTuple extends readonly TUnion[]>(
    tuple: Exclude<TUnion, TTuple[number]> extends never ? TTuple : never,
  ): TTuple => tuple;

const declared = exhaustive<keyof Api>()([
  "GET /users/:id",
  "POST /users",
] as const);            // drop one and it stops compiling
```

It works, and it is the kind of thing to reach for only when the drift is
actually expensive. `unhandled()` is the cheaper answer to the same worry: a
startup assertion that every declared route has a handler, checked at runtime
where the cost of a false negative is a 404 rather than a compile error.

## What a real typed router adds

This one is deliberately small. Production versions add:

- **path matching** — turning `/users/7` into `{ id: "7" }` at runtime, which is
  a separate problem from typing it
- **method separation** — `GET` and `POST` on the same path are different
  routes; encoding the method in the key (as here) is the cheap way, a nested
  `{ path: { method: spec } }` map is the thorough one
- **validation** — a schema per route, with `body` and `response` *derived* from
  the schema rather than hand-written, so the runtime check and the type cannot
  disagree (07/05's closing point)
- **client generation** — the same `Api` type imported by the front end, so a
  route rename breaks the caller at compile time. That is the actual selling
  point of tRPC and ts-rest, and it falls out of having one table

Every one of those is an extension of the same idea: one declaration, many
derived types.

## Common mistakes

| Mistake | What happens |
|---|---|
| `ParamsOf` returning a union instead of an object | `req.params` is a string union; nothing indexes |
| `Record<string, string>` for params | Every key is legal again; typos compile |
| `keyof TRoutes` without `& string` | `Map` keys and `includes` complain about `symbol` |
| Casting in `register` as well | Two unchecked lines instead of one; the invariant stops holding |
| Storing the manifest array without copying | A caller's later `push` silently adds routes |
| `dispatch` not awaiting the handler | An async handler's response lands after the caller moved on |
| `handlerFor` returning `undefined` for a declared-but-unregistered key, and `dispatch` treating that as an error | `dispatch` should report `false`, not throw — an unmounted route is a normal state |

## Interview angle

> *"How do typed routers know a path's parameters?"*

A template literal type takes the path apart at compile time — match `:name`
followed by `/`, recurse on the rest — producing a union of parameter names,
which a mapped type turns into `{ name: string }`. Then the route table is keyed
by the path literal, so `K extends keyof Routes` makes the handler's request
type depend on which key you passed. Express's own types do the first half:
`app.get("/users/:id", …)` infers `RouteParameters<"/users/:id">`, which is why
the path has to be a literal and not a `string` variable.

> *"When is a type assertion acceptable?"*

When there is an invariant the compiler cannot see but the code enforces — a
heterogeneous store is the standard example. The rules I would give: one cast,
not many; inside a module whose public API is fully typed; with a comment
stating the invariant that makes it sound; and never as a way to silence an
error you have not understood. In this router that is a single line in
`handlerFor`, sound because `register` is the only writer and its signature
already checked the pairing.
