# Section 07 — Advanced types

Maps to `07-advanced-types` in the course repo.

Deliberately **not** a re-run of section 02. Narrowing, discriminated unions and
`unknown` were covered there; this section is the parts that were not — how to
*combine* types, how to type dynamic keys, and the three operators people most
often confuse.

| # | Exercise | Tier | Time | Covers |
|---|---|---|---|---|
| 01 | [Intersections](01-intersections/) | Drill → Core | 20 min | `A & B`, capability composition, the `Omit` + `&` override pattern |
| 02 | [Index signatures](02-index-signatures/) | Core | 20 min | Dynamic keys, `Record` vs index signature, the `keyof` quirk |
| 03 | [Function overloads](03-function-overloads/) | Core | 25 min | Overload signatures, resolution order, and when *not* to overload |
| 04 | [`as`, `satisfies`, `as const`](04-assertions-and-satisfies/) | Core | 20 min | Check without widening; why `as` and `!` are lies |
| 05 | [Assertion functions](05-assertion-functions/) | **Challenge** | 35 min | `asserts x is T`, flat validation pipelines, `unknown` in `catch` |

**Run one:** `npm run check 07/03` · **Run the section:** `npm run check 07`

## What to take away

- **`A & B` has more properties but fewer values**, and `keyof` inverts between
  unions and intersections. Conflicting intersections silently become `never`.
- **`Omit<T, K> & { K: New }`** is how you override one property's type without
  restating the rest. You will use this at every API boundary.
- **Overloads are for two cases only**: different arities with different
  meanings, and a return type that depends on the argument type. Resolution is
  first-match-wins, so order specific before general.
- **`satisfies` checks without widening.** An annotation checks *and* widens,
  which is how config objects lose their literal keys and their typo-safety.
- **`as` and `!` have zero runtime effect.** They never make anything true. If a
  runtime check is possible, write one.
- **Assertion functions narrow for the rest of the scope**, which flattens
  validation code that predicates would nest.

## Interview questions this section prepares you for

- What's the difference between `A | B` and `A & B`?
- The API returns `id: number` but the client needs `id: string`. How do you type it?
- When would you use a function overload — and what's the gotcha?
- What is `satisfies` and why not just annotate?
- When is a type assertion acceptable?
- What's the difference between a type guard and an assertion function?
- How do you validate data coming off the network?
