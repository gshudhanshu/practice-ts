# 10/05 — Template literal types

**Tier:** Core → Challenge · **Time:** ~30 min · **Course section:** 10 — Deriving types

---

## Why this exercise exists

String literal types you can **build**, **constrain**, and — with `infer` —
**take apart**. This is how real libraries type route paths, CSS values, event
names and query builders.

TODO 4 is the pattern behind typed routers (Next.js, TanStack Router,
Hono): extracting `:param` names from a path *at the type level*.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `EventHandlerName<"click">` → `"onClick"`; unions map through. |
| 2 | `HttpsUrl` — must start with `https://`. |
| 3 | `Pixels` — a number followed by `px`. |
| 4 | `RouteParams<"/users/:userId/posts/:postId">` → `"userId" \| "postId"`. |
| 5 | `pathParamNames(path)` — the same job at runtime. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.

## Done when

```bash
npm run check 10/05
```

<details>
<summary>Hint 1 — the built-in string helpers</summary>

`Uppercase<T>` · `Lowercase<T>` · `Capitalize<T>` · `Uncapitalize<T>`

They are *intrinsic* — implemented in the compiler, not in TypeScript.
</details>

<details>
<summary>Hint 2 — placeholders</summary>

```ts
`https://${string}`   // any string after the prefix
`${number}px`         // any numeric literal, then "px"
```

`${string}` and `${number}` are wildcards; `${number}` also accepts negatives
and decimals, which the tests check.
</details>

<details>
<summary>Hint 3 — TODO 4 needs two patterns and recursion</summary>

Think about the two shapes a parameter can appear in:

1. **A parameter with more path after it** — `` `${string}:${infer Param}/${infer Rest}` ``.
   Capture the name, then recurse on `Rest`.
2. **A parameter at the very end** — `` `${string}:${infer Param}` ``.
   Capture and stop.

Anything else has no parameters, so the base case is `never`. Order matters:
check the "more path after it" case first, or it will swallow everything to the
end of the string.
</details>

<details>
<summary>Hint 4 — TODO 5</summary>

`path.matchAll(/:([A-Za-z0-9_]+)/g)` yields every match. The `/g` flag is
required by `matchAll`. Capture groups are `string | undefined` under
`noUncheckedIndexedAccess`, so narrow rather than assert.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
how pattern matching picks its split point, the combinatorial explosion these
types can cause, and where the compiler's union-size limit bites.
