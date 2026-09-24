# 19/01 — Typing Express middleware

**Tier:** Drill → Core · **Time:** ~20 min · **Course section:** 19 — Node & Express

---

## Why this exercise exists

An Express app is a list of functions with one shape and three possible
endings:

```ts
(req, res, next) => void

next()        // hand over to the next middleware
next(error)   // skip the rest, jump to the error middleware
neither       // you answered the request; the chain stops here
```

Almost every Express bug is a wrong ending. Forget `next` and the request hangs
until the client gives up. Call it *after* responding and you get "Cannot set
headers after they are sent to the client". The types cannot stop you doing
either — but writing the signatures out, and building `next` yourself, is what
makes the rule stick.

No server is started here or anywhere in this section. A middleware is a pure
function of `(req, res, next)`, so the spec calls it directly with hand-built
stand-ins and asserts on what it did.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `Middleware` and `ErrorMiddleware` type aliases. |
| 2 | `requireHeader(header, message)` — a middleware **factory**. |
| 3 | `limitBodySize(maxBytes)` — answers 413 instead of continuing. |
| 4 | `chain(...middlewares)` — `app.use` in miniature. |
| 5 | `errorHandler` — the four-argument error middleware. |

### The contract, in one table

| Middleware | Situation | What it does |
|---|---|---|
| `requireHeader` | header is a non-empty string | `next()` |
| | missing, blank, or an array | `next(new Error(message))` |
| `limitBodySize` | no `content-length` | `next()` |
| | not a finite number | `next(new Error("invalid content-length"))` |
| | over the limit | `res.status(413).json({ error: "payload too large" })`, no `next` |
| | otherwise | `next()` |
| `chain` | a middleware called `next()` | run the next one |
| | a middleware called `next(error)` | stop; outer `next(error)` |
| | a middleware called neither | stop; outer `next` never fires |
| | ran out of middlewares | outer `next()` |
| `errorHandler` | error carries an integer `status` in 400–599 | that status |
| | anything else | 500 |
| | error is an `Error` | body `{ error: error.message }` |
| | anything else | body `{ error: "internal error" }` |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`. In particular `errorHandler` receives `unknown` and
  must narrow it.
- `express` is **not** installed, only `@types/express`. Every import of it must
  be `import type`, or the test run cannot resolve the module.

## Done when

```bash
npm run check 19/01
```

<details>
<summary>Hint 1 — the two signatures</summary>

```ts
export type Middleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => void;
```

The error one has the error **first**, and four parameters in total. Express
identifies an error middleware by arity alone — declare three and it silently
becomes ordinary middleware that never sees an error.
</details>

<details>
<summary>Hint 2 — why a factory</summary>

Express only ever calls a middleware with `(req, res, next)`, so configuration
has to arrive some other way: a function that takes the config and *returns* the
middleware, which then closes over it.

```ts
export function requireHeader(header: string, message: string): Middleware {
  return (req, _res, next) => { … };
}
```

The returned arrow needs no parameter annotations — the return type supplies
them.
</details>

<details>
<summary>Hint 3 — the shape of a header value</summary>

`req.headers[someString]` hits an index signature, so it is
`string | string[] | undefined`: a header may legally repeat. A **known**
header written as a literal (`req.headers["content-length"]`) is declared as
`string | undefined`, so that case is simpler.

`typeof value !== "string"` handles missing, repeated and wrong-typed in one
check.
</details>

<details>
<summary>Hint 4 — <code>next</code> is just a continuation</summary>

`chain` is easier than it looks once you see that the `next` you hand a
middleware is a function you wrote:

```ts
const step = (index: number): void => {
  const middleware = middlewares[index];
  if (middleware === undefined) { next(); return; }

  middleware(req, res, (error?: unknown) => {
    if (error !== undefined) { next(error); return; }
    step(index + 1);
  });
};
step(0);
```

`noUncheckedIndexedAccess` makes the `undefined` check mandatory, and it happens
to be exactly the "ran out of middlewares" case.
</details>

<details>
<summary>Hint 5 — reading a status off an <code>unknown</code></summary>

`"status" in error` narrows `error` to something with that key, but the value is
`unknown`, so the `typeof` and range checks still have to happen:

```ts
if (typeof error === "object" && error !== null && "status" in error) {
  const status = error.status;
  if (typeof status === "number" && Number.isInteger(status) && …) { … }
}
```

No cast anywhere. Same outside-in ordering as `assertIsOrder` in 07/05.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
why the aliases are hand-written rather than `RequestHandler`, what `next("route")`
does, and why `NextFunction` accepting `any` is a deliberate hole.

Next: [19/02 — augmenting the request](../02-augmenting-request/).
