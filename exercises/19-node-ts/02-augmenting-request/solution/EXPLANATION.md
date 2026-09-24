# 19/02 — Augmenting the request

## `as any` versus declaration merging

```ts
(req as any).user.name        // compiles. Also compiles if `user` is a number,
                              // a string, or absent. Forever.
```

A cast is a claim with no consequences. Every use site repeats it, nothing
checks that the middleware and the handler agree about the shape, and renaming
`AuthUser.name` breaks nothing at compile time.

```ts
declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
  }
}
```

One block, in one file, and every file in the program sees it. Rename a field on
`AuthUser` and every reader stops compiling — which is the entire reason to use
a typed language.

## Merge into the module that *declares* the interface

`@types/express` re-exports; `@types/express-serve-static-core` declares. Augment
the module that **declares** the interface:

```ts
declare module "express-serve-static-core" {
  interface Request { user?: AuthUser }
}
```

### A correction, because the internet is full of the old version

The advice you will find everywhere is that `declare module "express" { … }`
compiles and silently does nothing, costing you a miserable half-hour. That was
true for `@types/express` **v4**.

Verified against this repo's actual toolchain (`@types/express` v5, TypeScript
7): it **does** merge now. So the folklore is out of date.

Target `express-serve-static-core` anyway. It is correct under both major
versions of the types, which makes it the form that will not quietly break when
a dependency moves — and "works under both" is a better reason than "the other
one is broken".

There are two working spellings, and it is worth knowing both:

```ts
// 1. Module augmentation — targets the declaring module.
declare module "express-serve-static-core" {
  interface Request { user?: AuthUser }
}

// 2. Global namespace — the extension point @types/express opens on purpose.
declare global {
  namespace Express {
    interface Request { user?: AuthUser }
  }
}
```

Both work, because `core.Request` extends `Express.Request`. Form 2 needs no
knowledge of which package declares what, which is why library authors publish
it. Form 1 is more explicit about what it is touching. Either way the file must
be a **module** — one with a top-level `import` or `export` — or the block means
something else entirely.

## Optional, and why `req.user = undefined` fails

```ts
interface Request { user?: AuthUser }
```

Optional is the truthful modelling: a request is unauthenticated until something
authenticates it. Declaring `user: AuthUser` would make every handler compile
and half of them crash.

Then `exactOptionalPropertyTypes` (03/03) bites:

```ts
req.user = undefined;   // ✗ Type 'undefined' is not assignable to 'AuthUser'
```

Under that flag `user?: AuthUser` means *absent, or an AuthUser* — it does not
mean *present and holding undefined*. To un-authenticate a request you
`delete req.user`. That reads as pedantic until you meet the bug it prevents:
`Object.keys(req)` and `"user" in req` disagreeing with `req.user === undefined`.

## The augmentation is global, and that is the cost

The block affects the whole TypeScript **program**, not just the file. Two
consequences that matter on a real codebase:

- Anyone can read `req.user` anywhere, including in a route that ran no
  authentication middleware. The type says `AuthUser | undefined` and the
  compiler will make them handle it — but the type cannot promise the
  middleware actually ran.
- Two packages in a monorepo that both augment `Request` **merge**, silently. If
  one declares `user?: AuthUser` and the other `user?: string`, you get an error
  about incompatible declarations at a location neither team owns.

The usual mitigation is to keep one augmentation, in one file, owned by the
package that owns authentication — and to name the property distinctly
(`auth`, `ctx`) rather than something a library might also want.

## Narrow the request, not the property

```ts
if (req.user !== undefined) {
  handler(req, res, next);   // ✗ req is still a plain Request
}
```

This is the detail everyone hits. Narrowing `req.user` refines the *property*
type; `req` itself is unchanged, and `Request` is not assignable to
`Request & { user: AuthUser }`. A predicate refines the subject:

```ts
export function isAuthenticated(req: Request): req is AuthenticatedRequest {
  return req.user !== undefined;
}
```

`AuthenticatedRequest` is `Request & { user: AuthUser }`, and TypeScript
intersects the property types as well: `(AuthUser | undefined) & AuthUser`
reduces to `AuthUser`. So inside the guard `req.user` is definitely there,
without restating the hundred-odd members of `Request`.

## Predicate, not assertion

07/05 drew the line and it applies directly here:

| | Predicate | Assertion |
|---|---|---|
| Failure is | an expected outcome | a bug |
| Caller | handles it | is interrupted |

An unauthenticated request is the most ordinary thing in the world. It deserves
a 401, not a thrown exception unwinding through an error middleware. Predicate.

## 401 versus 403

| Status | Question | Meaning |
|---|---|---|
| 401 Unauthorized | *Who are you?* | No credentials, or bad ones. Retry with credentials. |
| 403 Forbidden | *I know who you are.* | Credentials are fine; you may not do this. Retrying will not help. |

The naming is historically backwards — 401 is really "unauthenticated" — but the
distinction is real and clients act on it: a 401 triggers a token refresh or a
login redirect, a 403 shows an error. Returning 403 for a missing token sends
clients into a retry loop; returning 401 for a permissions failure sends them
into a login loop.

## `withUser`: narrow once, at the edge

```ts
export function withUser(handler: AuthenticatedHandler): Middleware {
  return (req, res, next) => {
    if (!isAuthenticated(req)) { res.status(401).json({ error: "unauthorized" }); return; }
    handler(req, res, next);
  };
}
```

The wrapper's whole job is a type conversion with a runtime check attached.
Outside it, `req.user` is `AuthUser | undefined` and everyone must cope; inside
it, `req.user` is `AuthUser` and nobody checks anything. That is the same
"parse, don't validate" shape as 07/05's `parseOrder`, applied to a request
rather than to JSON.

Note the direction of the guarantee: an `AuthenticatedHandler` is **not** a
`Middleware` (a plain `Request` cannot be passed to it), which is precisely why
`withUser` has to exist. The test pins that.

## Common mistakes

| Mistake | What happens |
|---|---|
| `declare module "express"` | Compiles, merges nothing, `req.user` still errors |
| The augmentation in a script file (no imports/exports) | Becomes an ambient module declaration; no merge |
| `user: AuthUser` (not optional) | Every handler compiles; unauthenticated requests crash |
| `req.user = undefined` to clear it | Fails under `exactOptionalPropertyTypes`; use `delete` |
| `if (req.user)` then passing `req` on | The property narrows, the request does not |
| An assertion function instead of a predicate | Throws on the most ordinary case there is |
| 403 for a missing token | Clients retry-loop instead of re-authenticating |
| `header.slice(7)` to read the token | `"Bearer"` alone, and `"Bearer  x"`, slip through |

## Interview angle

> *"How do you add `req.user` in a TypeScript Express app?"*

Declaration merging — a `declare module "express-serve-static-core"` block (or
the `Express.Request` global namespace, which is the extension point the types
open deliberately) adding an **optional** `user`. Not a cast: a cast is per-use,
unchecked, and drifts. Then the two details that show experience: it has to be
optional because the middleware may not have run, and the augmentation is
program-wide, so in a monorepo two packages augmenting `Request` merge into each
other.

> *"Optional `req.user` means every handler starts with a null check. How do you
> avoid that?"*

Narrow once at the edge. A type predicate `req is Request & { user: AuthUser }`,
used by a `withUser` wrapper that answers 401 and never calls the handler
otherwise. Inside the handler the user is non-optional, with no `!` anywhere.
It is the same move as parsing at a boundary: pay for the check once, and hand
everything downstream a stronger type.
