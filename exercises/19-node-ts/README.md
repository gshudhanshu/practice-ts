# Section 19 — Node & Express

The bonus block the course does not cover: typing a backend.

Nothing here starts a server, and `express` itself is not installed — only
`@types/express` and `@types/node`. That is not a limitation, it is the method.
A middleware and a route handler are **pure functions of `(req, res, next)`**,
so every exercise is tested by calling them directly with a hand-built stand-in
and asserting on what they did: which status was set, what body was sent,
whether `next` was called and with what.

If that sounds like a compromise, it is worth noticing how much of an Express
codebase it covers. Supertest and a live port test the *framework's* routing,
which is not your code. What is yours is the function bodies, and they are
testable in microseconds with no I/O at all.

| # | Exercise | Tier | Time | Covers |
|---|---|---|---|---|
| 01 | [Typing middleware](01-typing-middleware/) | Drill → Core | 20 min | `(req, res, next)`, `next()` vs `next(err)`, middleware factories, building `next` by hand |
| 02 | [Augmenting the request](02-augmenting-request/) | Core | 20 min | Declaration merging into `express-serve-static-core`, `req.user`, narrowing the request |
| 03 | [Typed handlers](03-typed-handlers/) | Core | 25 min | `Request<P, ResBody, ReqBody, Query>`, typed params/body/query, where the type stops being a guarantee |
| 04 | [Async errors](04-async-errors/) | Core → Challenge | 30 min | The rejected-promise footgun, a typed `asyncHandler`, `headersSent`, `unknown` in `catch` |
| 05 | [A typed router](05-typed-router/) | **Challenge** | 40 min | Route table as source of truth — 10/05's template literals plus 08/05's `K extends keyof TMap` |

**Run one:** `npm run check 19/03` · **Run the section:** `npm run check 19`

Because `express` is a types-only dependency here, every import of it must be
`import type` — the statement is erased at compile time, so nothing tries to
resolve the package at runtime.

## What to take away

- **A middleware has three endings** — `next()`, `next(error)`, or a response —
  and picking two of them is the most common Express bug there is. `next` is not
  a framework primitive; it is a closure over "what to do afterwards", which
  19/01 makes you build.
- **Express spots an error middleware by arity**, not by type. Four declared
  parameters or it silently never fires. It is one of the few framework rules
  with no type-level equivalent.
- **`NextFunction` takes `any`**, deliberately: `next("route")` and
  `next("router")` are control-flow tokens, not errors. So `next(err.message)`
  compiles and sends a string down the error path.
- **Augment, never cast.** `declare module "express-serve-static-core"` adds
  `req.user` once, checked, everywhere. `(req as any).user` is a claim with no
  consequences, repeated at every use site. Augment the module that *declares*
  the interface, keep the property optional, and remember the merge is
  program-wide.
- **Narrow the request, not the property.** `if (req.user)` refines the
  property; a handler that needs a guaranteed user needs a predicate
  `req is Request & { user: AuthUser }` and a wrapper that applies it once.
- **`Request<P, ResBody, ReqBody, Query>` — the response body is slot two.**
  Fill all four in and a handler cannot read a field the route never declared;
  leave `Response` unparameterised and `res.json` accepts `any` forever.
- **A typed body is a claim, not a check.** Nothing at runtime verifies it.
  Validate at the boundary and derive the type from the schema.
- **A rejected promise is not a throw.** It leaves the handler as a return
  value, so nothing catches it until something `await`s it — which is why the
  error middleware never fires without a wrapper. (Express 5 forwards returned
  promises; the wrapper still matters, and the type problem is unchanged.)
- **A heterogeneous store buys exactly one cast.** `never` parameters accept
  everything on the way in and nothing on the way out, which confines the
  unsafety to one commented line behind a fully typed API.

## Interview questions this section prepares you for

- What is `next` in Express, and what happens if you don't call it?
- How do you write a middleware that takes configuration?
- Why doesn't my error-handling middleware run?
- How do you add `req.user` in a TypeScript Express app — and what does that
  cost you in a monorepo?
- Optional `req.user` means every handler starts with a null check. How do you
  avoid that?
- How do you type an Express route handler properly? What order are the
  generics in?
- Where does the type system stop helping you in a web server?
- You have an async route that throws and the client hangs. Diagnose it.
- What's the difference between a throw and a rejection, in typing terms?
- How do typed routers know a path's parameters?
- When is a type assertion acceptable?
