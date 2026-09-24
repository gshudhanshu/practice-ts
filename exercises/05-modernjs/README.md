# Section 05 — Modern JavaScript & TypeScript

Maps to `05-modernjs` in the course repo.

Syntax you probably already recognise. What this section drills is where the
**types** land, and the handful of places the obvious answer is wrong — shallow
spread, `this` in a detached method, and `??` vs `||` in both directions.

| # | Exercise | Tier | Time | Covers |
|---|---|---|---|---|
| 01 | [Destructuring](01-destructuring/) | Drill | 15 min | Parameter patterns, defaults, renaming, nested defaults |
| 02 | [Spread & rest](02-spread-and-rest/) | Drill → Core | 20 min | Immutable updates, the shallow-copy trap, `Set` dedupe |
| 03 | [Arrow functions & `this`](03-arrow-functions-and-this/) | Core | 25 min | Detached methods, `this` parameters, closures, `once` |
| 04 | [Optional chaining & nullish](04-optional-chaining-and-nullish/) | Core | 15 min | `?.`, `??`, `??=`, and when `\|\|` is correct |
| 05 | [Array pipelines](05-array-pipelines/) | **Challenge** | 30 min | `map`/`filter`/`reduce`/`flatMap`, grouping, ranking |

**Run one:** `npm run check 05/03` · **Run the section:** `npm run check 05`

## What to take away

- **Tuples destructure exactly; arrays give you `| undefined`.** The compiler
  knows a tuple's length.
- **Spread is shallow.** Immutable updates need a fresh object at every level on
  the path to the change — that structural sharing is what makes `React.memo`
  work at all.
- **`this` is decided by the call site.** Arrow functions capture it lexically,
  which is the whole reason they exist.
- **`??` is the safer default, but not the answer to everything.** Pick the
  operator from the requirement, not from habit.
- **Compose small functions.** A business rule ("cancelled orders don't count")
  should exist in exactly one place.

## Interview questions this section prepares you for

- How do you update a nested value immutably? Shallow or deep copy?
- Why does `this` break when I pass a method as a callback?
- What's the difference between an arrow function and a normal function?
- When would you use `||` instead of `??`?
- `map`/`filter`/`reduce` or a `for` loop?
