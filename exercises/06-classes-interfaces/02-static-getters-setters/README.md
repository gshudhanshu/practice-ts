# 06/02 — static members, getters & setters

**Tier:** Core · **Time:** ~20 min · **Course section:** 06 — Classes & interfaces

---

## Your task

A `Temperature` value object. Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `Temperature.ABSOLUTE_ZERO_CELSIUS` — a `static readonly` constant, `-273.15`. |
| 2 | Make the constructor **private**; store Celsius in a private field. |
| 3 | `fromCelsius` / `fromFahrenheit` static factories; both reject below absolute zero with `RangeError`. |
| 4 | `get celsius`, `get fahrenheit`, `set fahrenheit` (converts and validates). **No** celsius setter. |
| 5 | `Temperature.created` — how many instances have ever been made. Not writable from outside. |

Conversions: `F = C * 9/5 + 32`, `C = (F - 32) * 5/9`.

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.
- A value that **fails** validation must not increment the counter — so
  validate before you construct.

## Done when

```bash
npm run check 06/02
```

## The pattern worth taking away

**Private constructor + static factories.** It buys you three things a plain
constructor cannot:

- **Names.** `fromCelsius(0)` and `fromFahrenheit(0)` are wildly different
  temperatures. A constructor can only be called one way, so it cannot express
  that — you would need a second parameter or a subclass.
- **Validation before existence.** The object is never constructed in an
  invalid state, not even briefly.
- **Control over instantiation.** Caching, pooling, counting, returning a
  subclass — all impossible once callers can say `new`.

<details>
<summary>Hint 1 — private static state</summary>

`static #instanceCount = 0;` is a class-level field that is genuinely private at
runtime. Expose it with a `static get created()` — a static getter, which gives
read-only public access.
</details>

<details>
<summary>Hint 2 — write the rule once</summary>

`fromCelsius`, `fromFahrenheit` and `set fahrenheit` all need the same
below-absolute-zero check. Put it in a `static #assert…` helper and call it from
all three. Better still: have `fromFahrenheit` convert and then **delegate** to
`fromCelsius`, so both the validation and the counting happen in one place.
</details>

<details>
<summary>Hint 3 — a getter with no setter</summary>

Declaring `get celsius()` and never declaring `set celsius()` makes the property
read-only — assignment stops compiling. That is how you offer a public view of
private state without allowing writes.
</details>

<details>
<summary>Hint 4 — order matters in the factory</summary>

Validate → count → construct. Any other order and a rejected value still bumps
the counter, which one of the tests checks explicitly.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
static inheritance, why `static readonly` infers a literal type, and when a
setter is the wrong tool.
