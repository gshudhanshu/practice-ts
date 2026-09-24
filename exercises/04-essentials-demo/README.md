# Section 04 — Essentials demo: expense tracker

Maps to `04-essentials-demo` in the course repo.

One small project across three exercises. Everything from sections 02 and 03
applied to a domain that behaves like real work: money, dates, validation,
aggregation and reporting.

Do them in order — but parts 2 and 3 hand you the finished types, so you can
skip ahead if you want.

| # | Exercise | Tier | Time | Covers |
|---|---|---|---|---|
| 01 | [Model the domain](01-model-the-domain/) | Core | 20 min | Discriminated unions, derived unions, integer money, ISO dates |
| 02 | [Query operations](02-query-operations/) | Core | 25 min | Filtering, date ranges, validation, "parse don't validate" |
| 03 | [Reporting](03-reporting/) | **Challenge** | 35 min | Grouping, multi-key sorting, percentages, exact output formatting |

**Run one:** `npm run check 04/02` · **Run the section:** `npm run check 04`

## What to take away

- **Good types make the code that follows trivial.** Part 1 is pure modelling,
  and it is why parts 2 and 3 need almost no defensive code.
- **Money is integer minor units.** `0.1 + 0.2 !== 0.3`, and currency is the one
  domain where that difference ends up in a court filing.
- **Calendar dates are strings; instants are `Date`.** Fixed-width ISO strings
  sort chronologically and carry no timezone, which is why the range filter in
  part 2 is two string comparisons.
- **Accumulate, transform, sort — in that order.** Every aggregation in part 3
  is that same three-phase pipeline.

## Interview questions this section prepares you for

- How would you model a payment that can be cash, card, or bank transfer?
- How do you store money? How do you store dates?
- Group these records by a key and rank them.
- What's wrong with `if (!amount)` as a validation check?
