# 06/03 — Abstract classes & inheritance

**Tier:** Core · **Time:** ~25 min · **Course section:** 06 — Classes & interfaces

---

## Your task

A payroll hierarchy. Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | Make `Employee` **abstract**, with abstract `role` (getter) and `monthlyPayCents()`. Implement the shared `describe()`. |
| 2 | `Salaried` — `baseCents` is the **annual** salary; monthly = annual ÷ 12, rounded. |
| 3 | `Hourly` — `baseCents` is the hourly **rate**; takes `hoursPerMonth` as a third constructor argument. |
| 4 | `Contractor` — flat monthly retainer; **extends** `describe()` with `" [contract]"` via `super`. |
| 5 | `totalMonthlyPayrollCents` — sums a mixed list typed as the base class. |

### The exact `describe()` format

```
Ada (Salaried): 10000.00
Alan (Contractor): 5000.00 [contract]
```

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.
- `Contractor.describe` must call `super.describe()` — do not re-write the
  format string.

## Done when

```bash
npm run check 06/03
```

## `noImplicitOverride` is on in this repo

That means the `override` keyword is **required** when you replace a concrete
inherited member — TODO 4's `describe`. Leave it off and you get:

> This member must have an 'override' modifier because it overrides a member in
> the base class 'Employee'.

Implementing an **abstract** member does not need it (there is nothing to
override — you are fulfilling a contract, not replacing an implementation).

The payoff: rename `describe` in the base class, and every subclass that claimed
to override it fails to compile. Without the flag, they would silently become
new, never-called methods.

<details>
<summary>Hint 1 — what abstract buys you</summary>

An abstract class can hold both **contract** (`abstract` members, no body) and
**shared behaviour** (ordinary methods). `describe()` calls `this.role` and
`this.monthlyPayCents()` even though the base class has no idea what they
return — subclasses supply those. That is the template-method pattern.
</details>

<details>
<summary>Hint 2 — <code>Hourly</code> needs its own constructor</summary>

It takes three arguments but the base takes two. Call `super(name, rate)`
first — you cannot touch `this` before `super` returns — then store the hours.
A parameter property works, and is assigned right after the `super` call.
</details>

<details>
<summary>Hint 3 — extending rather than replacing</summary>

`super.describe()` calls the parent implementation, so you only have to add
your suffix. If you copy the format string instead, the two copies will drift
the first time anyone changes it.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
abstract class vs interface (a very common interview question),
`protected` vs `private`, and when to prefer composition over this whole
hierarchy.
