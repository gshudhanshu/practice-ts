# Section 09 — Classes & generics practice

Maps to `09-classes-generics-practice` in the course repo.

One small project across three exercises, combining section 06's classes with
section 08's generics. No new language features — this is where the two sets of
ideas meet and you find out whether they stuck.

| # | Exercise | Tier | Time | Covers |
|---|---|---|---|---|
| 01 | [Typed collection](01-typed-collection/) | Core | 25 min | `Collection<T>`, method-level `<U>`, immutability |
| 02 | [Composable validators](02-composable-validators/) | Core | 30 min | Validator factories, `combine`, curried generics |
| 03 | [Validated table](03-validated-table/) | **Challenge** | 35 min | Generic store + validation, candidate-then-commit |

**Run one:** `npm run check 09/02` · **Run the section:** `npm run check 09`

## What to take away

- **Class parameter vs method parameter.** `T` describes the instance; `<U>` on
  `map` is what lets `Collection<number>` become `Collection<string>`.
- **Immutability is three separate decisions** — copy the input, copy the
  output, copy before sorting. Each prevents a different bug.
- **Curried generics** (`rulesFor<T>()(…)`) are the standard workaround for
  TypeScript's lack of partial type-argument inference. You will meet this in
  real libraries; now you know why the extra `()` is there.
- **Erasing a type parameter into a closure** is what lets one `FieldRule<T>[]`
  hold rules for differently-typed fields.
- **Validate a candidate, then commit.** There is no rollback to write if you
  never wrote anything.
- **Return expected failures, throw for bugs** — and a discriminated union makes
  the compiler enforce the distinction.

## Interview questions this section prepares you for

- Design an immutable collection wrapper. What does it cost?
- How would you build a composable validation layer?
- Why do some libraries make you write `create<State>()(…)` with two calls?
- How do you validate before writing, and roll back if it fails?
- Return an error object, or throw?
