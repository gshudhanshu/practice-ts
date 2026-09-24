# 07/04 — `as`, `satisfies` and `as const`

**Tier:** Core · **Time:** ~20 min · **Course section:** 07 — Advanced types

---

## Why this exercise exists

Three things that share keywords and do completely different jobs:

| | What it is | Effect on safety |
|---|---|---|
| `x as T` | **assertion** — you overriding the compiler | **reduces** it |
| `x satisfies T` | **check** — validate without changing the inferred type | increases it |
| `x as const` | **const assertion** — infer the narrowest type | increases it |

`satisfies` (TS 4.9) is the one most people have not adopted yet, and it solves
a problem everyone has had: *"I want this checked, but annotating it throws away
the inference I wanted."*

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `PALETTE` is checked against `Theme`, but `keyof typeof PALETTE` stays the three literal keys and `PALETTE.primary` stays `"#0055ff"`. |
| 2 | `ROUTES` stays a readonly tuple of its exact literals **and** every member is verified as a `Route`. |
| 3 | `getColor` reads a colour by key — a typo must not compile. |
| 4 | `toStatusCode` turns `unknown` into a `StatusCode`, **proving** it rather than asserting. |
| 5 | Rewrite `firstUpper` without the `as`. Return `""` for an empty list. |

## Rules

- Do not edit `exercise.test.ts`.
- **No `as` anywhere** except `as const`. That is the whole point of TODO 4 and 5.
- No `any`, no `!`.

## Done when

```bash
npm run check 07/04
```

<details>
<summary>Hint 1 — why an annotation is not enough</summary>

```ts
const PALETTE: Theme = { primary: "#0055ff" };
//    keyof is `string`, and PALETTE.primary is `ColorValue`
```

The annotation checks *and widens* — the value now conforms to `Theme` and
nothing narrower is remembered. You want the check without the widening.
</details>

<details>
<summary>Hint 2 — TODO 2 needs both, in one specific order</summary>

`as const` first (make it a readonly tuple of literals), then `satisfies`
(verify each literal is a valid `Route`):

```ts
const X = [...] as const satisfies readonly Something[];
```

Reversed, `satisfies` would run against the already-widened `string[]` and the
tuple would be gone.
</details>

<details>
<summary>Hint 3 — TODO 4 without a cast</summary>

`raw as StatusCode` compiles and is a lie — it claims `999` is valid.

Instead: reject non-numbers, then search the actual values.
`Object.values(HTTP_STATUS)` is typed `(200 | 404 | 500)[]`, so `.find(...)`
returns `StatusCode | undefined` — exactly the contract, proven by the runtime
check rather than asserted.
</details>

<details>
<summary>Hint 4 — TODO 5</summary>

`values[0]` is `string | undefined` because of `noUncheckedIndexedAccess`. The
`as string` did not make it safe, it just silenced the warning — which is why
`firstUpper([])` throws today. Pull it into a local and check it.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
what `as` can and cannot do, the double-assertion escape hatch, and the handful
of places `as` is genuinely the right answer.
