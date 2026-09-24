# 10/01 — `keyof` and `typeof`

**Tier:** Drill → Core · **Time:** ~20 min · **Course section:** 10 — Deriving types

---

## Why this exercise exists

Section 10 is about **deriving** types instead of writing them twice. One rule
sits behind all of it:

> If a type and a value describe the same thing, derive one from the other so
> they cannot drift apart.

`typeof` in **type position** is the type-query operator — it reads the type the
compiler already inferred for a value. It is unrelated to the runtime `typeof`
you use for narrowing, despite the shared keyword.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `Config` — derived from `DEFAULT_CONFIG`, not hand-written. |
| 2 | `ConfigKey` — `"host" \| "port" \| "secure"`. |
| 3 | `Role` — `"admin" \| "editor" \| "viewer"` from the `as const` array. |
| 4 | `EventName` (`"click" \| "key"`) and `ClickHandler` (the exact function type). |
| 5 | `isConfigKey` (a type predicate) and `configKeys()` returning `ConfigKey[]` — **no casts**. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as` (except `as const`), no `!`.
- Do not hand-write any of the derived types — every one must come from a value.

## Done when

```bash
npm run check 10/01
```

<details>
<summary>Hint 1 — the four building blocks</summary>

```ts
typeof value               // the type of a value
keyof SomeType             // the union of its keys
SomeType["prop"]           // indexed access
(typeof ARR)[number]       // the union of an array's elements
```

They compose: `keyof typeof EVENT_HANDLERS` reads the object's type, then takes
its keys.
</details>

<details>
<summary>Hint 2 — <code>in</code> is the wrong operator for TODO 5</summary>

`"toString" in DEFAULT_CONFIG` is **true** — `in` walks the prototype chain. One
test checks exactly that.

Use `Object.hasOwn(obj, key)` (ES2022), which only looks at own properties.
</details>

<details>
<summary>Hint 3 — getting <code>ConfigKey[]</code> with no cast</summary>

`Object.keys` is deliberately typed as returning `string[]`, because an object
may carry extra properties at runtime. So `Object.keys(x) as ConfigKey[]` is a
lie you happen to get away with.

Instead, filter with the type predicate you wrote:

```ts
return Object.keys(DEFAULT_CONFIG).filter(isConfigKey);
```

`.filter` with a predicate narrows `string[]` to `ConfigKey[]` for you.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
when `typeof` beats a hand-written interface (and when it does not), and why
`Object.keys` is typed the way it is.
