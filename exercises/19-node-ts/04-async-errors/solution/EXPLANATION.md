# 19/04 — Async errors

## What actually goes wrong

```ts
app.get("/x", async (req, res) => {
  const row = await db.find(req.params.id);   // rejects
  res.json(row);
});
```

The dispatcher calls the handler, gets a promise back, and continues. The
rejection settles some time later, on a microtask, with nothing attached to it.
So:

- the error middleware never runs — it is only reachable through `next`
- no response is ever written; the request hangs until the client times out
- Node reports an unhandled rejection (and, since Node 15, exits by default)

And the fix people reach for first does not work:

```ts
try {
  handler(req, res, next);      // returns a pending promise immediately
} catch { /* never reached */ }
```

`try/catch` catches *throws*, and an async function does not throw — it returns
a rejected promise. Only `await` (or `.catch`) converts one into the other.

## The wrapper

```ts
export function asyncHandler(handler: AsyncMiddleware): AsyncMiddleware {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}
```

Four lines, and every one earns its place:

- `async` on the wrapper, so it has its own promise to return
- `await`, which is what turns the rejection into a catchable throw
- `catch (error)` — `unknown`, because `useUnknownInCatchVariables` is part of
  `strict` and JavaScript really can throw a string
- `next(error)` — the only door into the error middleware

The equivalent without `async/await` is the one you will see in codebases:

```ts
const wrapped: RequestHandler = (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};
```

`Promise.resolve` handles a handler that turns out to be synchronous. That form
returns `void`, which is fine for Express and useless for a test — hence this
exercise returns the promise instead.

## Why returning `Promise<void>` is legal

```ts
export interface RequestHandler<…> {
  (req: …, res: …, next: NextFunction): unknown;
}
```

`RequestHandler` returns **`unknown`**, not `void`. That is deliberate on
DefinitelyTyped's part, and it is what makes an `async` handler assignable:
`Promise<void>` is assignable to `unknown`. Had it been declared `void`, the
special "return type void accepts anything" rule would still have let it
through — but `unknown` also documents that Express looks at the return value,
which since v5 it does.

The spec pins it: `Expect<Extends<AsyncMiddleware, RequestHandler>>`.

## Express 5 changed this, and the wrapper still matters

Express 5 awaits a promise returned by a handler and forwards its rejection to
`next` for you. So on Express 5 the naive handler above is no longer broken.

It is still worth knowing and still worth writing, because:

- Express 4 is everywhere, and the migration is not free
- the forwarding only applies to a promise that is **returned**. A handler that
  calls an async function without returning it, or that settles inside a
  callback (`stream.on("error", …)`), is still on its own
- `res.on("finish", async () => …)` and similar hooks are not handlers at all
- interviewers ask about it, because it is the canonical demonstration that you
  understand the difference between a throw and a rejection

The **type** problem is identical in both versions, which is what this exercise
is really about: an async handler is a different type from a sync one, and the
wrapper is a function from one to the other.

## `runPipeline` deliberately does not catch

```ts
await handler(req, res, next);   // no try/catch anywhere in sight
```

This is the honest bit. Express's dispatcher does not catch either, so modelling
it faithfully is what lets the spec *prove* the footgun rather than assert it:

```ts
// unwrapped: the rejection escapes the dispatcher entirely
await expect(runPipeline([rejecting], onError, req, res)).rejects.toThrow(…);
expect(log).toEqual([]);

// wrapped: it arrives at the error middleware
await runPipeline([asyncHandler(rejecting)], onError, req, res);
expect(log).toEqual(["404 user not found"]);
```

Two tests, one difference, no prose required.

## The `let`-in-a-closure trap

The obvious way to record what a handler did with its `next` does not compile:

```ts
let outcome: "pending" | "continue" | "failed" = "pending";
const next: NextFunction = () => { outcome = "continue"; };
await handler(req, res, next);
if (outcome === "continue") { … }   // ✗ "This comparison appears unintentional"
```

TypeScript's control-flow analysis narrows `outcome` to `"pending"` at the
assignment and does **not** widen it again just because a closure captured the
variable. This is a known, deliberate unsoundness — tracking every possible
mutation through every closure would make inference unusable — and it bites
exactly here, in callback-recording code.

The workaround used in the solution sidesteps narrowing altogether:

```ts
const calls: unknown[] = [];
const next: NextFunction = (error?: unknown) => { calls.push(error); };
```

`calls[0]` is `unknown` under `noUncheckedIndexedAccess`, so there is nothing to
narrow away. The alternative fixes are an explicit annotation on the read
(`const o: Outcome = outcome`) or a mutable holder object — both work, both are
noisier.

## `headersSent`

```ts
if (res.headersSent) {
  next(error);
  return;
}
```

Once the status line has gone out, `res.status(...)` throws "Cannot set headers
after they are sent to the client" — and it throws *inside the error handler*,
which is the worst place for a new error. Express's default handler does exactly
this check and then destroys the socket.

It happens more than you would think: a handler that streams a response and then
fails halfway, or one that responds and then calls `next(err)` anyway. Logging
before the check (as the solution does) means you still find out.

## Normalising to `HttpError`

```ts
if (error instanceof HttpError) return error;
if (error instanceof Error) return new HttpError(500, error.message);
return new HttpError(500, "internal error");
```

Order matters: `HttpError` **is** an `Error`, so the specific check comes first —
first match wins, the same discipline as overload ordering in 07/03.

One design note the tests encode: a non-`Error` gets a generic message rather
than `String(error)`. Echoing an arbitrary thrown value to a client is how
connection strings end up in a JSON response. A real app logs the original and
returns the generic one, which is why `errorMiddleware` takes a `log`.

`readonly status` is a small thing that says something real: the status belongs
to the place that threw, not to whoever catches it. A middleware that "upgrades"
a 404 into a 500 on the way past is a bug you want to be a compile error.

## Common mistakes

| Mistake | What happens |
|---|---|
| `try/catch` around the *call* instead of an `await` | Catches nothing; the promise rejects later |
| `asyncHandler` without `async`/`await` (no `.catch` either) | Same as no wrapper at all |
| `catch (error: any)` | Compiles, and `error.message` on a thrown string crashes |
| `String(error)` as the client-facing message | Leaks internals to whoever asks |
| Checking `instanceof Error` before `instanceof HttpError` | Every HttpError becomes a 500 |
| No `headersSent` check | The error handler itself throws, on a half-written response |
| Tracking the outcome in a narrowed `let` | Does not compile; TS keeps the old narrowing |
| A `try/catch` inside `runPipeline` | Hides the very bug the exercise demonstrates |

## Interview angle

> *"You have an async Express route that throws. Why doesn't your error
> middleware run?"*

Because the handler returns a promise and the dispatcher does not wait for it,
so the rejection is never converted into a `next(error)` call — and `next` is
the only way into the error middleware. The fix is a wrapper that awaits the
handler and forwards the rejection. Then the detail that shows currency:
Express 5 does this for returned promises, but the wrapper still matters for
Express 4, for promises that are not returned, and for anything that settles in
a callback.

> *"What's the difference between a throw and a rejection, in typing terms?"*

A throw leaves the function through the exception path and lands in `catch` as
`unknown`. A rejection is a *value* the function returned, so nothing catches
it until someone `await`s it — and the type system cannot tell you whether
anyone will, because `Promise<T>` says nothing about the error channel.
TypeScript has no checked exceptions and no typed rejections, which is precisely
why the boundary conversion — `unknown` in, a domain error type out — has to be
written by hand, once, somewhere like `toHttpError`.
