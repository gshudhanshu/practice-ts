# Section 10 — Deriving types

Maps to `10-deriving-types` in the course repo.

The type system's own programming language. One rule sits behind the whole
section:

> If a type and a value describe the same thing, **derive** one from the other
> so they cannot drift apart.

| # | Exercise | Tier | Time | Covers |
|---|---|---|---|---|
| 01 | [`keyof` & `typeof`](01-keyof-and-typeof/) | Drill → Core | 20 min | Type queries, key unions, the `Object.keys` bridge |
| 02 | [Indexed access](02-indexed-access/) | Drill → Core | 15 min | `T[K]`, `T[number]`, nesting, reaching into library types |
| 03 | [Mapped types](03-mapped-types/) | Core | 25 min | The four moves: value, modifiers, rename, drop |
| 04 | [Conditional types](04-conditional-types/) | Core → Challenge | 30 min | `infer`, recursion, **distribution**, deferred conditionals |
| 05 | [Template literal types](05-template-literal-types/) | Core → Challenge | 30 min | Building and parsing string types |
| 06 | [Typed deep paths](06-typed-paths/) | **Challenge** | 45 min | All of the above — `lodash.get`, typed |

**Run one:** `npm run check 10/04` · **Run the section:** `npm run check 10`

## What to take away

- **`typeof` in type position** reads a value's inferred type. Derive when the
  *value* is the source of truth; hand-write when the *type* is; use `satisfies`
  when you want both.
- **Never re-declare a type that already exists inside another one** — index
  into it. This is also how you type against a library that under-exports.
- **Mapped types have four moves**: change the value, change modifiers
  (`-readonly`, `-?`), rename the key (`as`), or drop it (map to `never`).
- **Distribution** — a conditional over a naked type parameter runs once per
  union member. It is why `Exclude` works, and the cause of most "why is my type
  a union?" confusion. `[T] extends [U]` turns it off.
- **Deferred conditionals** cannot be checked inside a generic function. Prefer
  an indexed access, or contain a single cast at the boundary.
- **A mapped type indexed by `keyof`** is the idiom for turning "one thing per
  property" into a union. It appears everywhere once you can see it.

## Interview questions this section prepares you for

- How do you keep a type and a constant in sync?
- Why doesn't `Object.keys` return `keyof T`?
- A library doesn't export the type you need. How do you get it?
- Implement `Partial<T>` / `ReturnType<T>` yourself.
- What is a distributive conditional type?
- How do typed routers know a path's parameters?
- **How would you type `lodash.get`?** (10/06 is the full answer.)
