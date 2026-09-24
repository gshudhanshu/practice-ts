# 02/03 — Tuples, `as const`, and unions instead of enums

**Tier:** Drill → Core · **Time:** ~20 min · **Course section:** 02 — Essentials

---

## Scenario

Coordinates and log levels. Two tiny domains that expose the single most useful
pattern in everyday TypeScript: **declare the value once, derive the type from
it.** Once you own this, you stop writing `enum` almost entirely.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `Coordinate` is exactly two numbers — latitude, then longitude. Three elements must not compile. Use **named tuple members**. |
| 2 | `LOG_LEVELS` is a runtime array you can iterate; `LogLevel` is the union `"debug" \| "info" \| "warn" \| "error"` **derived from it**. Do not type the four strings twice. |
| 3 | `parseCoordinate("12.5,-3.2")` → `[12.5, -3.2]`; `null` for the wrong shape, non-numbers, or out-of-range values (lat ±90, lon ±180). |
| 4 | `formatCoordinate([12.5, -3.2])` → `"12.5000, -3.2000"` — exactly four decimals. |
| 5 | `isLogLevel` is a **type predicate**: after `if (isLogLevel(x))`, `x` narrows from `string` to `LogLevel`. Check against `LOG_LEVELS` at runtime. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `!`. You should not need `as` either, except possibly `as const`
  — which is a *const assertion*, a different thing entirely.

## Done when

```bash
npm run check 02/03
```

<details>
<summary>Hint 1 — deriving a union from an array</summary>

Two steps, and you need both:

1. `as const` on the array literal, so the elements keep their literal types
   and the array becomes a readonly tuple.
2. Index the *type* with `number` to get the union of element types:
   `type X = (typeof ARR)[number]`.

Without step 1 the array is `string[]` and step 2 gives you `string`.
</details>

<details>
<summary>Hint 2 — <code>LOG_LEVELS.includes(value)</code> will not compile</summary>

Read the error carefully. `LOG_LEVELS` is now a tuple of literals, so its
`includes` parameter is `LogLevel` — the very thing you are trying to prove.
It refuses `string`.

You do not need a cast to get around this. Reach for a different array method
that takes a callback, and compare with `===` inside it.
</details>

<details>
<summary>Hint 3 — making narrowing actually happen</summary>

A function returning `boolean` tells the caller nothing about the argument.
The return type you want has the form `arg is SomeType`.
</details>

<details>
<summary>Hint 4 — destructuring keeps giving me <code>string | undefined</code></summary>

`"a,b".split(",")` is `string[]`, so under `noUncheckedIndexedAccess` every
element is possibly `undefined`. Check `parts.length !== 2` first, then still
narrow the two locals — the length check does not automatically narrow a
`string[]`.

Also: `Number("")` is `0`, not `NaN`. `"12.5,"` must be rejected explicitly.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
what `as const` actually does, why tuples beat arrays under strict flags, and
the enum-vs-union question you will very likely be asked.
