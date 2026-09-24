# 19/02 — Augmenting the request

**Tier:** Core · **Time:** ~20 min · **Course section:** 19 — Node & Express

---

## Why this exercise exists

Every real Express app hangs something off `req`: the authenticated user, a
request id, a tenant, an open transaction. Express has no idea those exist, so
`req.user` is a compile error out of the box.

There are two ways out, and only one of them is a type:

```ts
(req as any).user          // a lie. Nothing checks it, ever, anywhere.
declare module …           // declaration merging. Real, checked, shared.
```

This is 06/04's declaration merging pointed at somebody else's package —
`interface` declarations with the same name in the same scope merge, so you can
add a property to an interface you do not own. You are **applying** it here, not
learning it; if the mechanism is hazy, re-read
[06/04](../../06-classes-interfaces/04-interfaces-vs-type-aliases/).

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | Merge `user?: AuthUser` into Express's `Request`. |
| 2 | `authenticate(tokens)` — Bearer token in, `req.user` out. |
| 3 | `requireRole(role)` — 401 vs 403, which are different questions. |
| 4 | `AuthenticatedRequest` + `isAuthenticated` type predicate. |
| 5 | `withUser(handler)` — narrow once, so handlers never check. |

### The contract

| Function | Situation | Result |
|---|---|---|
| `authenticate` | `Bearer <known token>` | set `req.user`, `next()` |
| | anything else | `401 { error: "unauthorized" }`, no `next` |
| `requireRole` | no `req.user` | `401 { error: "unauthorized" }` |
| | user lacks the role | `403 { error: "forbidden" }` |
| | user has the role | `next()` |
| `withUser` | no `req.user` | `401`, and the handler never runs |
| | a user | call `handler(req, res, next)` |

"Anything else" for `authenticate` covers: no header, a scheme that is not
`Bearer`, a missing token, extra whitespace-separated parts, and an unknown
token.

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!` — the point of the exercise is that none are needed.
- The augmentation must target `express-serve-static-core`, the package that
  actually declares `Request`.
- `import type` only; `express` itself is not installed.

## Done when

```bash
npm run check 19/02
```

<details>
<summary>Hint 1 — the augmentation block</summary>

```ts
declare module "some-module" {
  interface SomeInterface {
    newProperty?: SomeType;
  }
}
```

It only merges if the surrounding file is a **module** — one with a top-level
`import` or `export`. In a script file, `declare module` means something else
entirely (an ambient module declaration) and will silently do nothing useful.
</details>

<details>
<summary>Hint 2 — why <code>express-serve-static-core</code> and not <code>express</code></summary>

`@types/express` re-exports the interfaces; `@types/express-serve-static-core`
**declares** them. Augment the module that declares — it is the form that is
correct across every version of the types.

You will find advice everywhere saying that augmenting `"express"` compiles and
silently does nothing. That was true of `@types/express` v4. Verified against
*this* repo's toolchain (`@types/express` v5, TypeScript 7) it does now merge —
so the folklore is out of date, but the declaring module is still the portable
choice.
</details>

<details>
<summary>Hint 3 — parsing the header without a regex</summary>

```ts
const parts = header === undefined ? [] : header.split(" ");
```

Then require `parts.length === 2`, `parts[0] === "Bearer"`, and a defined
`parts[1]`. That rejects `"Bearer"`, `"Bearer  x"` and `"Bearer x y"` for free.
`noUncheckedIndexedAccess` makes the compiler ask about the elements anyway.
</details>

<details>
<summary>Hint 4 — narrowing the request, not the property</summary>

```ts
if (req.user !== undefined) {
  handler(req, …);   // ✗ req is still a plain Request
}
```

Narrowing `req.user` tells the compiler about the *property*. The handler's
parameter needs a narrowed **request**, so the check has to be a predicate over
`req`:

```ts
export function isAuthenticated(req: Request): req is AuthenticatedRequest
```

`AuthenticatedRequest` is an intersection: `Request & { user: AuthUser }`. The
property types intersect too, so `AuthUser | undefined` meets `AuthUser` and
becomes just `AuthUser`.
</details>

<details>
<summary>Hint 5 — predicate or assertion?</summary>

07/05 draws the line: an assertion function is for failures that are **bugs**, a
predicate is for failures the caller is expected to **handle**. An
unauthenticated request is completely normal — it deserves a 401, not a thrown
exception. So: predicate.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
the two augmentation styles (`declare module` vs `declare global`), what
augmentation costs you in a monorepo, and why `req.user = undefined` does not
compile.

Next: [19/03 — typed handlers](../03-typed-handlers/).
