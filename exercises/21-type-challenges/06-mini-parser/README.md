# 21/06 — CHALLENGE: a mini parser

**Tier:** Challenge · **Time:** ~45 min · **Section:** 21 — Type challenges

---

## Why this exercise exists

The section finale: a parser that runs in the type system, paired with the
runtime parser it agrees with.

```ts
const query = parseQuery("page=2&sort=asc&debug");
//    ^? { page: 2; sort: "asc"; debug: true }

query.page;    // 2
query.nope;    // compile error
```

That is the same machine behind typed routers, `zod`-style schema inference and
ORM field selection: **one string, two implementations — one for the compiler,
one for the runtime — kept in step by a test**.

Everything from this section shows up: recursive template matching (21/03),
building objects from keys (21/04), intersection accumulation, and one
flattening trick (`Prettify`) that you will keep for good.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `Prettify<{a: string} & {b: number}>` → `{a: string; b: number}`. |
| 2 | `ParseValue<"42">` → `42`; `"true"` → `true`; `"asc"` → `"asc"`. |
| 3 | `ParsePair<"a=1">` → `{a: 1}`; `ParsePair<"debug">` → `{debug: true}`. |
| 4 | `ParseQuery<"a=1&b=2">` → `{a: 1; b: 2}`; `ParseQuery<string>` → `Record<string, QueryValue>`. |
| 5 | `parseQuery(search)` — the runtime parser, typed by TODO 4. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `!`.
- **One `as` is permitted**, at the return of `parseQuery`, and you will need
  it — see below.

## Why one cast is needed

`ParseQuery<S>` is a **deferred conditional** while `S` is still a type
parameter (10/04), so the compiler cannot check the object you built against it
from inside the function — even though it resolves correctly at every call site.

Contain the unsafety to that single return, keep everything above it properly
typed, and comment it. This is the 08/05 and 10/06 lesson again: a precise
public API is worth one contained cast in the implementation.

## Done when

```bash
npm run check 21/06
```

<details>
<summary>Hint 1 — Prettify</summary>

```ts
type Prettify<T> = { [K in keyof T]: T[K] };
```

Re-mapping every key onto itself changes nothing semantically and everything
practically: `A & B` becomes one flat object, tooltips become readable, and
`Equal` starts agreeing with the shape you wrote in the test.

You were given this in
[20/02](../../20-utility-types-from-scratch/02-key-selection/); this time write
it without looking.
</details>

<details>
<summary>Hint 2 — string to number literal</summary>

```ts
S extends `${infer N extends number}` ? N : S
```

The `extends number` on the `infer` (TS 4.8+) is what converts `"42"` into the
literal `42`. Without it you get the string back.

Test the booleans **before** the number and string cases — the first matching
branch wins.
</details>

<details>
<summary>Hint 3 — building an object from a key</summary>

```ts
S extends `${infer K}=${infer V}` ? { [P in K]: ParseValue<V> } : …
```

`K` is a string literal type, which is a union of exactly one member, so a
mapped type over it produces a one-property object.
</details>

<details>
<summary>Hint 4 — accumulate with <code>&</code>, flatten with Prettify</summary>

```ts
type ParsePairs<S extends string> =
  S extends `${infer Head}&${infer Rest}` ? ParsePair<Head> & ParsePairs<Rest> : ParsePair<S>;
```

A non-exported helper for the recursion keeps `ParseQuery` readable: it applies
`Prettify` once, at the top.

For the widened case, `string extends S` is true **only** when `S` is `string`
itself — a literal is assignable to `string`, but not the other way round.
</details>

<details>
<summary>Hint 5 — keeping the two implementations honest</summary>

Runtime rules, chosen to match the type:

```ts
if (raw === "true") return true;
if (raw === "false") return false;
const n = Number(raw);
if (raw !== "" && Number.isFinite(n)) return n;   // Number("") is 0 — guard it
return raw;
```

`const S` on the type parameter keeps the caller's literal. The final `as` goes
on the return, with a comment.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
why `ParseValue<"007">` is `number` rather than `7`, exactly where the type and
the runtime can still drift, and whether any of this belongs in production.
