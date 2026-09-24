# Section 02 — Essentials & basic types

Maps to `02-essentials` in the course repo.

The foundation. Everything later in this repo assumes you can do these without
thinking — especially discriminated unions (02/04) and `unknown` (02/06), which
are the two ideas that most separate people who *use* TypeScript from people who
*model* with it.

| # | Exercise | Tier | Time | Covers |
|---|---|---|---|---|
| 01 | [Primitives & inference](01-primitives-and-inference/) | Drill | 10 min | Literal vs widened types, when to annotate |
| 02 | [Object & array types](02-object-and-array-types/) | Drill | 15 min | `readonly`, optional properties, index signatures |
| 03 | [Tuples & const assertions](03-tuples-and-const-assertions/) | Drill → Core | 20 min | Tuples, `as const`, unions over `enum`, type predicates |
| 04 | [Unions & narrowing](04-unions-and-narrowing/) | Core | 20 min | `typeof` / `in` / discriminated unions, `??` vs `\|\|` |
| 05 | [Function types & callbacks](05-function-types-and-callbacks/) | Core | 20 min | Function types, rest/default params, `void`, `never` |
| 06 | [`unknown` & exhaustiveness](06-unknown-and-exhaustiveness/) | **Challenge** | 35 min | `unknown` vs `any`, type guards, `assertNever` |

**Run one:** `npm run check 02/03` · **Run the section:** `npm run check 02`

## What to take away

- **Annotate to constrain, never to restate.** If the annotation says what
  inference would, delete it.
- **`as const` + `(typeof X)[number]`** is the single-source-of-truth pattern.
  Prefer it to `enum`.
- **Discriminated unions** make invalid states unrepresentable. This is the most
  valuable idea in the section.
- **`unknown` at boundaries, never `any`.** Contain `any` at the one line where
  it enters.
- **`assertNever` in a `default` branch** turns "handle the new case" from a
  code-review comment into a compile error.

## Interview questions this section prepares you for

- When do you annotate versus let TypeScript infer?
- `enum` or a union of string literals — and why?
- What's the difference between `any` and `unknown`?
- How do you keep a `switch` exhaustive as a union grows?
- What's the difference between `??` and `||`?
