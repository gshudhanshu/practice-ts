# 02/01 — Primitives & Inference

**Tier:** Drill · **Time:** ~10 min · **Course section:** 02 — Essentials

---

## Scenario

You are typing the pricing layer of a small shop. Money is stored as **integer
cents** (never floats — that decision is half the exercise) and rendered for
three supported currencies.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `TAX_RATE` must have the literal type `0.08`, not `number`. |
| 2 | `Currency` must accept exactly `"USD" \| "EUR" \| "INR"` and reject anything else. |
| 3 | `parsePriceToCents` converts `"12.50"` → `1250`, and returns `null` for invalid input. Its return type must force callers to handle failure. |
| 4 | `formatCents(1250, "USD")` → `"USD 12.50"`, always two decimal places. |
| 5 | `withTax` adds `TAX_RATE` and rounds to whole cents — **without** a return type annotation. |

## Rules

- Do not edit `exercise.test.ts`. It is the spec.
- Do not rename or re-sign anything that is exported.
- No `any`, no `as`, no `!` non-null assertions. None are needed here.

## Done when

```bash
npm run check 02/01
```

prints `✔ ALL GREEN`. That means **both** the runtime tests and the compile-time
type assertions pass — a solution that returns the right values but has sloppy
types will still be red, on purpose.

<details>
<summary>Hint 1 — TAX_RATE stubbornly stays <code>number</code></summary>

You are trying to *add* something. The fix is to **remove** something. Ask what
type `const x = 0.08` has when you write no annotation at all.
</details>

<details>
<summary>Hint 2 — how do I make a type reject "GBP"?</summary>

A string literal is a valid type on its own: `type A = "USD"` accepts only the
string `"USD"`. Now combine three of them with `|`.
</details>

<details>
<summary>Hint 3 — <code>"19.99"</code> keeps coming out as 1998</summary>

`19.99 * 100` is not `1999` in binary floating point — log it. Which of
`Math.floor` / `Math.round` / `Math.trunc` survives that?
</details>

<details>
<summary>Hint 4 — validating the input string</summary>

`Number("")` is `0` and `Number(" 12 ")` is `12`, so `Number()` alone will not
reject the bad cases. Guard the *shape* first with a regular expression:
digits, then an optional `.` followed by more digits, anchored at both ends.
</details>

---

When you are green (or genuinely stuck for 15+ minutes), read
[`solution/EXPLANATION.md`](solution/EXPLANATION.md). It covers the annotate-vs-infer
rule, why unions beat `enum`, and the interview question this exercise is really
about.
