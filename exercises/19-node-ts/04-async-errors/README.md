# 19/04 — Async errors

**Tier:** Core → Challenge · **Time:** ~30 min · **Course section:** 19 — Node & Express

---

## Why this exercise exists

The classic Express footgun:

```ts
app.get("/users/:id", async (req, res) => {
  const user = await db.find(req.params.id);   // rejects
  res.json(user);
});
```

The handler returns a promise. The dispatcher calls it and moves on. The
rejection has nowhere to go: the four-argument error middleware never fires, the
client gets nothing until it times out, and on Express 4 Node prints an
unhandled-rejection warning. Wrapping the *call site* in `try/catch` does not
help either — by the time the promise rejects, the call has already returned.

The fix is one wrapper: take the returned promise and route its rejection into
`next`, which is the only door into the error middleware.

> Express 5 does forward rejections from a returned promise, and the types in
> this repo are `@types/express` v5. The wrapper still matters — for Express 4,
> for any handler whose return value is discarded, and for handlers that settle
> in a callback. The **type** problem is identical in both versions, and it is
> the type problem this exercise is about.

Rather than describe the footgun, this exercise builds a miniature dispatcher
and demonstrates it: the same rejecting handler is run unwrapped and wrapped,
and the spec pins the difference.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `HttpError` — an `Error` with a readonly `status`. |
| 2 | `toHttpError(error)` — normalise anything at all. |
| 3 | `asyncHandler(handler)` — the wrapper. |
| 4 | `errorMiddleware(log)` — logs, respects `res.headersSent`. |
| 5 | `runPipeline(handlers, onError, req, res)` — Express's dispatcher, in miniature. |

### The contract

| Function | Situation | Result |
|---|---|---|
| `toHttpError` | an `HttpError` | itself, unchanged |
| | any other `Error` | `new HttpError(500, error.message)` |
| | anything else | `new HttpError(500, "internal error")` |
| `asyncHandler` | handler resolves | `next` is **not** called |
| | handler rejects | `next(error)`, exactly once |
| | handler called `next` itself | that call is left alone |
| `errorMiddleware` | always | push `` `${status} ${message}` `` onto `log` |
| | `res.headersSent` | `next(error)` — cannot answer twice |
| | otherwise | `res.status(status).json({ error: message })` |
| `runPipeline` | handler called `next()` | continue |
| | handler called `next(error)` | stop; `onError(error, req, res, noop)` |
| | handler called neither | stop — it answered the request |
| | every handler continued | resolve |

`runPipeline` must **not** `try/catch`. Express does not either, and that is the
whole point: the spec proves that an unwrapped rejecting handler escapes it
entirely, and that `asyncHandler` is what changes that.

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!` — a caught value is `unknown` and stays `unknown`
  until it is narrowed.
- `import type` only; `express` itself is not installed.

## Done when

```bash
npm run check 19/04
```

<details>
<summary>Hint 1 — subclassing Error</summary>

```ts
export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}
```

`super(message)` first — `this` is not available before it. Setting `name` is
what makes a logged stack say which layer produced the error.
</details>

<details>
<summary>Hint 2 — order the <code>instanceof</code> checks</summary>

`HttpError` **is** an `Error`, so check for it first. First match wins, the same
way overload resolution does in 07/03.
</details>

<details>
<summary>Hint 3 — the wrapper is four lines</summary>

```ts
return async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};
```

The `await` is load-bearing. Without it the `try/catch` is decorative: the call
returns before the promise settles, and the rejection escapes.
</details>

<details>
<summary>Hint 4 — recording what a handler did with <code>next</code></summary>

In `runPipeline` you need to know afterwards whether the handler continued,
failed, or answered. Do **not** track it in a narrowed `let`: TypeScript keeps
the narrowing from the initial assignment even though a closure reassigned it,
and your code will not compile against its own logic.

Push into an array instead — an array read is `unknown` under
`noUncheckedIndexedAccess`, so there is no narrowing to lose:

```ts
const calls: unknown[] = [];
const next: NextFunction = (error?: unknown) => { calls.push(error); };
await handler(req, res, next);

if (calls.length === 0) return;      // it answered the request
const error = calls[0];
if (error !== undefined) { …onError…; return; }
```
</details>

<details>
<summary>Hint 5 — <code>headersSent</code></summary>

Once the status line has gone out, touching the response throws. An error
middleware that fires *after* a partial response has to delegate — `next(error)`
— and let Express close the connection. It is the difference between a logged
error and a crashed process.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
what changed in Express 5, why `asyncHandler` returns a promise here, and why
`RequestHandler` returning `unknown` is what makes any of this typeable.

Next: [19/05 — a typed router](../05-typed-router/).
