# 19/01 — Typing Express middleware

## The three endings

```ts
next()        // continue
next(error)   // skip to the error middleware
neither       // the response is yours; the chain stops
```

There is no fourth. Everything that goes wrong in an Express app is one of:

| Mistake | Symptom |
|---|---|
| Neither `next` nor a response | The request hangs until the client times out |
| Responded **and** called `next()` | "Cannot set headers after they are sent" |
| `next()` where you meant `next(error)` | The error middleware never runs; a broken request 200s |
| Three parameters on an error middleware | It is treated as ordinary middleware and never sees an error |

The type system stops none of these. What it *can* do is make the signatures
unambiguous, which is why the exercise starts by writing them out.

## Why hand-write `Middleware` rather than use `RequestHandler`?

`@types/express` already exports `RequestHandler`. Aliasing to it would be
shorter — but you would never see the shape, and the shape is the lesson. The
test keeps you honest in both directions:

```ts
type _middleware  = Expect<Equal<Middleware, (req, res, next) => void>>;
type _stillUsable = Expect<Extends<Middleware, RequestHandler>>;
```

The second line matters. `RequestHandler` returns `unknown`, so a `void`-returning
function is assignable to it and Express will accept yours anywhere. Had it been
declared as returning `void`, an `async` middleware (returning `Promise<void>`)
would not fit — which is exactly the design decision 19/04 depends on.

## Arity is the error-middleware signal

```ts
app.use((err, req, res, next) => { … });   // error middleware
app.use((req, res, next) => { … });        // ordinary middleware
```

Express counts `fn.length` at registration time. That is a runtime check on a
JavaScript function, so TypeScript cannot help: declare three parameters on
something you meant as an error handler and it compiles, registers, and quietly
never fires. It is one of the few Express rules with no type-level equivalent,
and it is worth remembering because you will hit it.

A consequence: never "tidy up" an unused fourth parameter. `_next` has to stay.

## `error: unknown`, not `error: any`

```ts
export type ErrorMiddleware = (error: unknown, …) => void;
```

`ErrorRequestHandler` in `@types/express` declares `err: any`, because it predates
`useUnknownInCatchVariables` and changing it would break the world. `unknown` is
the honest type: JavaScript lets you `throw` a string, a number, `undefined`, or
a rejected promise's arbitrary value, and libraries do.

Declaring it `unknown` costs you one narrowing step and buys a whole class of
crash — `error.message` on a thrown string — that simply cannot happen.

`unknown` is assignable to `any`, so your alias still satisfies
`ErrorRequestHandler` and Express accepts it.

## `NextFunction` accepts anything

```ts
next(new Error("boom"));   // fine
next("boom");              // also compiles
next(42);                  // also compiles
```

`NextFunction` is declared `(err?: any) => void`, plus two literal overloads for
the strings `"route"` and `"router"` — which are Express's break-out signals:

| Call | Meaning |
|---|---|
| `next()` | run the next middleware |
| `next("route")` | skip the rest of **this route's** handlers |
| `next("router")` | skip the rest of **this router** |
| `next(anythingElse)` | treat it as an error |

Those two magic strings are why the parameter cannot be narrowed to `Error`: the
API genuinely takes a union of "an error" and "a control-flow token". So a typo
like `next(err.message)` compiles and silently sends a *string* down the error
path. If that matters to you, wrap it:

```ts
const fail = (next: NextFunction, error: Error): void => { next(error); };
```

## Building `next` yourself

`chain` is the whole Express dispatcher in nine lines, and writing it removes
the magic:

```ts
middleware(req, res, (error?: unknown) => {
  if (error !== undefined) { next(error); return; }
  step(index + 1);
});
```

`next` was never a framework primitive. It is a closure over "what to do
afterwards", and every layer builds a new one. Once that clicks, three
behaviours stop being surprising:

- a middleware that returns without calling `next` ends the chain, because
  nothing scheduled the continuation
- `next(error)` skipping the remaining handlers is not special-cased; the
  continuation simply forwards instead of advancing
- calling `next()` twice runs the rest of the chain twice — Express guards
  against this, your version does not, and neither one is a type error

## `res.status(413).json(…)` and stopping

```ts
res.status(413).json({ error: "payload too large" });
return;                 // ← the important line
```

`status()` returns `this`, which is what makes the chaining work. The `return`
is what makes the middleware correct. Responding and then continuing is the
single most common Express mistake, and the spec pins it: after a 413 the outer
`next` must not have been called at all.

## Reading a status off an `unknown`

```ts
if (typeof error === "object" && error !== null && "status" in error) {
  const status = error.status;   // unknown
```

`in` narrows the *object* — it tells you the key exists, not what is behind it.
So `status` is `unknown` and every further check is still required. That is the
correct amount of scepticism for a value that arrived by being thrown.

Note the order: container before contents, exactly as in 07/05. `typeof error
=== "object"` before `error !== null` before `"status" in error`, because each
step is what makes the next one legal.

## Common mistakes

| Mistake | What happens |
|---|---|
| `error: any` on the error middleware | Compiles, but `error.message` on a thrown string crashes |
| Three parameters on `errorHandler` | Express treats it as ordinary middleware; it never fires |
| Responding *and* calling `next()` | "Cannot set headers after they are sent" |
| No `return` after `res.json(...)` | The rest of the function runs, usually responding twice |
| `req.headers[name]` assumed to be `string` | It is `string \| string[] \| undefined`; a repeated header is an array |
| Casting the error to read `.status` | Works until someone throws a string |
| `chain` forwarding `next` directly to each middleware | Every middleware ends the chain; nothing composes |

## Interview angle

> *"What is `next` in Express, and what happens if you don't call it?"*

It is the continuation the dispatcher hands each middleware — a closure over
"run the rest of the stack". Not calling it is legal and means "I answered the
request"; calling it with an argument means "I failed, skip to the error
handler". Forgetting it entirely is the classic hang: no response, no error, the
client times out. Then the detail that shows you have actually used it:
`next("route")` and `next("router")` are break-out signals, not errors.

> *"How do you write a configurable middleware?"*

A factory. Express only ever calls a middleware with `(req, res, next)`, so
configuration arrives by closure: a function that takes the options and returns
the middleware. Same shape as any other partial application, and it is why
`express.json({ limit: "1mb" })` is a call and not a value.
