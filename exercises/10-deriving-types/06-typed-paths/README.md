# 10/06 — CHALLENGE: typed deep paths

**Tier:** Challenge · **Time:** ~45 min · **Course section:** 10 — Deriving types

---

## Why this exercise exists

The Phase 2 finale. Everything from section 10 at once — mapped types, indexed
access, conditional types, `infer`, template literals and recursion — used to
build the type behind `lodash.get`:

```ts
getPath(state, "user.address.city");   // typed string
getPath(state, "user.nope");           // compile error
```

If you can write `Paths<T>` and `ValueAt<T, P>` from scratch, you can read
almost any type-level code you will meet in a library.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `ChangeEvent<T>` — a discriminated union **derived** from a type's properties. |
| 2 | `Paths<AppState>` — every dotted path, at any depth. |
| 3 | `ValueAt<AppState, "user.address.city">` → `string`. |
| 4 | `getPath(subject, path)` — an unknown path is a **compile error**. |
| 5 | `describeChange` — exhaustive over the derived union. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `!`.
- **One `as` is permitted**, at the return of `getPath`, and you will need it —
  see below.

## Why one cast is needed

`ValueAt<T, P>` is a **deferred conditional** while `T` and `P` are still
generic (10/04), so the compiler cannot check the final value against it — even
though it resolves correctly at every call site.

Everything *before* the return should be narrowed properly with `isRecord`. This
is the 08/05 lesson again: a precise public API, with the unsafety contained to
one line.

## Done when

```bash
npm run check 10/06
```

<details>
<summary>Hint 1 — mapped type indexed by <code>keyof</code></summary>

To turn an object type into a **union**, build a mapped type whose *values* are
the members you want, then index it:

```ts
type ChangeEvent<T> = { [K in keyof T]: { key: K; value: T[K] } }[keyof T];
```

The mapped type is scaffolding; `[keyof T]` collapses it into the union. This
idiom appears constantly in library types — worth recognising on sight.
</details>

<details>
<summary>Hint 2 — <code>Paths</code>, one branch at a time</summary>

For each key `K`:

- if `T[K]` is an object → contribute **both** `K` and `` `${K}.${Paths<T[K]>}` ``
- otherwise → contribute just `K`

Then collapse with `[keyof T & string]`, the same idiom as TODO 1. The
`& string` is needed because template literals will not take `number | symbol`
keys (10/03).
</details>

<details>
<summary>Hint 3 — <code>ValueAt</code> splits on the first dot</summary>

```ts
P extends `${infer Head}.${infer Rest}`
  ? Head extends keyof T ? ValueAt<T[Head], Rest> : never
  : P extends keyof T ? T[P] : never
```

Two cases: a path with a dot (take one key, recurse on the rest) and a path
without one (a single key). Both need the `extends keyof T` guard, or an invalid
path would not resolve to `never`.
</details>

<details>
<summary>Hint 4 — the signature of <code>getPath</code></summary>

```ts
function getPath<T extends object, P extends string & Paths<T>>(
  subject: T,
  path: P,
): ValueAt<T, P>
```

`string & Paths<T>` is what lets you call `path.split(".")` inside — a bare
`P extends Paths<T>` is deferred and has no string methods.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md).

**That completes Phase 2** — sections 07 to 10. See the
[repository README](../../../README.md) for what comes next.
