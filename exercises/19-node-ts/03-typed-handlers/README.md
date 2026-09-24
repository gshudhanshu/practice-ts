# 19/03 — Typed route handlers

**Tier:** Core · **Time:** ~25 min · **Course section:** 19 — Node & Express

---

## Why this exercise exists

`Request` is generic, and almost nobody fills it in:

```
Request<P, ResBody, ReqBody, ReqQuery>
         │     │        │        └── req.query
         │     │        └─────────── req.body
         │     └──────────────────── what res.json() accepts
         └────────────────────────── req.params
```

Look at slot two. It is the **response** body, sitting between the parameters
and the request body — the most misread signature in Express. Leave it out and
`res.json` takes `any` for the rest of time; fill it in and the compiler checks
what you send.

With all four supplied, a handler physically cannot read `req.body.email` on a
route whose body has no email. The typo becomes a red squiggle instead of an
`undefined` in production.

One honest caveat, and it is the follow-up question in every interview:
**`ReqBody` is a claim, not a check.** Nothing at runtime verifies the JSON
matches it. You still validate at the boundary (07/05) — the type is what keeps
the rest of the file consistent with that validation.

## Your task

Open `exercise.ts` and resolve all five TODOs. A tiny users API, four routes.

| # | Requirement |
|---|---|
| 1 | `TypedHandler<TParams, TBody, TQuery, TResponse>` — map your four onto Express's four. |
| 2 | `getUser` — `GET /users/:id` |
| 3 | `createUser` — `POST /users` |
| 4 | `listUsers` — `GET /users?role=&limit=` |
| 5 | `updateUser` — `PATCH /users/:id` |

### The contract

| Route | Situation | Response |
|---|---|---|
| `getUser` | id is in the store | `200` the user |
| | otherwise | `404 { error: "user not found" }` |
| `createUser` | `name` blank after trimming | `400 { error: "name is required" }` |
| | otherwise | `201` the new user, id `String(users.size + 1)`, name trimmed |
| `listUsers` | no query | `200 { users: [...] }`, insertion order |
| | `?role=` | only that role |
| | `?limit=` | at most that many, applied after the filter |
| | limit not a positive integer | `400 { error: "limit must be a positive integer" }` |
| `updateUser` | unknown id | `404 { error: "user not found" }` |
| | patch has no keys | `400 { error: "nothing to update" }` |
| | resulting `name` blank | `400 { error: "name is required" }` |
| | otherwise | `200` the merged user, kept in its original position |

Each handler is a **factory** over the store, so the spec can hand it a fresh
one — same dependency injection as the middleware factories in 19/01.

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.
- A rejected write must leave the store exactly as it was.
- `import type` only; `express` itself is not installed.

## Done when

```bash
npm run check 19/03
```

<details>
<summary>Hint 1 — the mapping</summary>

Your parameters are in the order you think about a route: params, body, query,
response. Express's are `<P, ResBody, ReqBody, ReqQuery>`. So three of the four
move:

```ts
req: Request<TParams, TResponse, TBody, TQuery>
```

Pass the *same* `TResponse` to `Response<…>` — that is what makes `res.json()`
checked rather than `any`.
</details>

<details>
<summary>Hint 2 — the "no params" type</summary>

`Empty` is `Record<never, never>` — an object type with no keys, so
`req.params.anything` is a compile error. `Record<string, never>` would **not**
work: the index signature makes every key legal.
</details>

<details>
<summary>Hint 3 — everything in a query string is a string</summary>

`?limit=2` gives you `"2"`, never `2`. So `ListUsersQuery` is
`{ role?: string; limit?: string }` and the parsing is yours:

```ts
const parsed = Number(limit);
if (!Number.isInteger(parsed) || parsed < 1) { … }
```

`Number("")` is `0` and `Number("many")` is `NaN` — both fail that check, which
is the point of writing it that way round.
</details>

<details>
<summary>Hint 4 — validate the merge, not the patch</summary>

09/03 again: build the candidate, validate *that*, and only then write.

```ts
const candidate: User = { ...existing, ...patch };
if (candidate.name.trim() === "") { …400…; return; }
users.set(id, candidate);
```

The spread produces a `User` with no cast because `UpdateUserBody` has exact
optional properties — under `exactOptionalPropertyTypes` a present key cannot
hold `undefined`, so nothing can be blanked out by the merge.
</details>

<details>
<summary>Hint 5 — an empty patch</summary>

`Object.keys(patch).length === 0`. Check it **before** the field rules, for the
same reason 07/05 checks the container before its contents: "you sent me
nothing" is a different category of problem from "field X is wrong".
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
why a fully typed handler is *not* assignable to `RequestHandler` (and why
`app.get` accepts it anyway), and where the type stops being a guarantee.

Next: [19/04 — async errors](../04-async-errors/).
