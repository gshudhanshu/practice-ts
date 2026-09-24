# 04/02 — Query operations

## ISO dates compare as strings

```ts
expense.date >= from && expense.date <= to
```

`"YYYY-MM-DD"` is fixed-width, zero-padded, and ordered most-significant-field
first. Those three properties together mean **lexicographic order is
chronological order**. So a date-range filter is two string comparisons.

What you avoid by not reaching for `Date`:

- **Timezone shifts.** `new Date("2026-01-05")` is parsed as UTC midnight. In
  UTC-5, `.getDate()` returns `4`. Off-by-one-day bugs from this are endemic.
- **Cost.** Constructing two `Date` objects per element, per comparison.
- **Ambiguity.** `new Date("2026-1-5")` is implementation-defined.

An inverted range needs no special case: if `from > to`, no date can satisfy
both comparisons, so you get `[]` naturally.

## `largest` and the tie-break

```ts
if (winner === undefined || expense.amountCents > winner.amountCents) {
  winner = expense;
}
```

Strict `>` keeps the **first** of any tie; `>=` would keep the last. The test
pins this because "which one on a tie" is exactly the kind of unstated
requirement that causes flaky behaviour later.

`reduce` works too, but needs a seed of `undefined` and a wider accumulator
type, which reads worse than the loop for no gain.

## `Number.isInteger` does three jobs

```ts
Number.isInteger(NaN)       // false
Number.isInteger(Infinity)  // false
Number.isInteger(3.5)       // false
Number.isInteger(0)         // true
```

One call rejects `NaN`, non-finite values and fractions. Contrast the naive
alternatives:

- `amount % 1 === 0` — `NaN % 1` is `NaN`, so the check silently passes nothing,
  and `Infinity % 1` is `NaN` too.
- `parseInt(String(x)) === x` — string round-trips, and wrong for large numbers.

Note it is `Number.isInteger`, not the global `isInteger` (there isn't one), and
`Number.isNaN` — not global `isNaN`, which coerces (`isNaN("abc")` is `true`).

## The predicate is what does the typing work

```ts
if (!isCategory(draft.category)) return null;
// draft.category is `Category` from here on
```

`ExpenseDraft.category` is `string` — untrusted input. After the guard, it is
`Category`, so it can be assigned into `Expense.category` with no cast. That is
the "parse, don't validate" shape again: the check does not just return a
boolean, it *changes what the compiler knows*.

## The optional note, under `exactOptionalPropertyTypes`

```ts
const note = draft.note?.trim();
if (note !== undefined && note !== "") {
  expense.note = note;
}
```

Three requirements met at once: absent stays absent, blank is treated as absent,
and a real note is stored trimmed. Writing `note: draft.note?.trim()` in the
object literal would fail to compile *and* would leave `"note" in expense` true
for a blank note — which the test checks explicitly.

## Common mistakes

| Mistake | What happens |
|---|---|
| `new Date(a) >= new Date(b)` | Works, but slower and timezone-fragile |
| `>=` in the `largest` comparison | Returns the last of a tie; the tie test fails |
| `amountCents >= 0` without an integer check | `3.5` and `NaN` are accepted |
| `isNaN(x)` instead of `Number.isNaN(x)` | Coerces — `isNaN("")` is `false` |
| `draft.category as Category` | Compiles, and lets `"groceries"` through |
| `note: draft.note?.trim()` in the literal | Compile error, plus a phantom `note` key |
| `expenses.filter(...)` returning the same array reference | Not an issue — `filter` always allocates |

## Interview angle

> *"How do you store dates?"*

Distinguish the two kinds. **Calendar dates** (a birthday, an invoice date) are
`YYYY-MM-DD` strings or a dedicated type — they have no time and no timezone.
**Instants** (when a row was written) are `Date` or an ISO-8601 timestamp in
UTC. Conflating them is where the classic off-by-one-day bug comes from.

> *"What's wrong with `if (!amount)` as a validation check?"*

It rejects `0`, which is a legal amount. Same family as the `??` vs `||`
question from 02/04 — falsiness is not the same as absence, and money, counts
and coordinates are all domains where `0` is real data.
