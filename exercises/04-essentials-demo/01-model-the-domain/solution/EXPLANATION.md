# 04/01 — Model the domain

## The one idea in this exercise

**Make illegal states unrepresentable.**

Compare the union you wrote with the shape most people reach for first:

```ts
// What you built
type Payment =
  | { method: "cash" }
  | { method: "card"; last4: string }
  | { method: "transfer"; reference: string };

// The bag-of-optionals version
type Payment = {
  method: "cash" | "card" | "transfer";
  last4?: string;
  reference?: string;
};
```

The second one permits `{ method: "cash", last4: "4242", reference: "X" }` —
nonsense that will compile forever. It also makes `last4` possibly-undefined at
every single use site, so `describePayment` needs `?? ""` or `!` in a branch
where the value is definitely present.

The union has neither problem. Inside `case "card"`, `last4` is a plain
`string`. You did not check for it — the *type* proved it.

## Why integer cents

```ts
0.1 + 0.2 === 0.30000000000000004   // IEEE 754 binary floating point
```

Currency amounts are decimal quantities; binary floats cannot represent most
decimal fractions exactly. Storing minor units (cents, pence, paise) as integers
sidesteps the whole class of bug. Every real payment system does this — Stripe's
API is denominated in cents for exactly this reason.

The cost is that you must divide by 100 at the display boundary and nowhere
else, which is what `formatCents` in 04/03 is for.

> Currencies without minor units (JPY) or with three of them (KWD) mean "cents"
> is really "minor units at this currency's exponent". Mentioning that is a nice
> touch if money modelling comes up in an interview.

## Why ISO date strings, not `Date`

`"YYYY-MM-DD"` is fixed-width and most-significant-first, so **lexicographic
order equals chronological order**. That makes 04/02's range filter a plain
string comparison, with no parsing and no timezone.

`Date` in JavaScript is a timestamp, not a calendar date. `new Date("2026-01-05")`
parses as UTC midnight, so in any negative-offset timezone `.getDate()` returns
the 4th. That bug ships constantly.

Rule of thumb: **calendar dates are strings; instants are `Date`** (or better,
`Temporal.PlainDate` once it lands).

## The predicate, again

```ts
export function isCategory(value: string): value is Category {
  return CATEGORIES.some((category) => category === value);
}
```

`.includes(value)` will not compile — `CATEGORIES` is a readonly tuple of
literals, so its `includes` only accepts a `Category`. Same trap as 02/03, and
it will keep appearing; `.some` with `===` is the cast-free way out.

## Common mistakes

| Mistake | What happens |
|---|---|
| `type Category = string` | `_category` fails, and `isCategory` cannot narrow |
| Optional `last4`/`reference` on one object type | `_card` fails; `{method:"card"}` compiles |
| `amount: number` in reais/dollars | Not caught by tests here, but 04/03's totals drift |
| `date: Date` | `_expenseShape` fails; 04/02's range filter gets much harder |
| `assertNever(value: unknown)` | `_assertNever` fails; exhaustiveness stops working |
| `note?: string \| undefined` | `_expenseShape` fails — this repo wants the exact optional |

## Interview angle

> *"How would you model a payment that can be cash, card, or bank transfer?"*

This exercise **is** the answer. Give the discriminated union, then say the
sentence: it makes the invalid combinations unrepresentable rather than merely
discouraged. Follow with the exhaustive `switch` and `assertNever` so that a new
payment method becomes a compile error rather than a silent fallthrough.

> *"Why not just use optional fields?"*

Because optionality is a much weaker claim than the union. `last4?: string` says
"sometimes there is a last4". The union says "there is a last4 exactly when the
method is card" — and the compiler enforces the "exactly when".
