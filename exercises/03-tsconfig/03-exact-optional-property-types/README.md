# 03/03 — `exactOptionalPropertyTypes`

**Tier:** Core · **Time:** ~20 min · **Course section:** 03 — The compiler & tsconfig

---

## Why this exercise exists

In JavaScript these two objects are **not** the same:

```js
const a = {};                 "x" in a  // false     Object.keys(a)  // []
const b = { x: undefined };   "x" in b  // true      Object.keys(b)  // ["x"]
                              JSON.stringify(b)      // "{}"  — and yet
```

By default TypeScript pretends they are. `exactOptionalPropertyTypes` makes it
tell the truth: `autoSave?: boolean` means the key may be **absent**, not that
it may hold `undefined`.

The bug this prevents is real and common — a settings/config merge where a
partially-filled patch wipes out your defaults.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `Settings`: `theme` (`"light" \| "dark"`) and `fontSize` required; `autoSave` and `language` optional and *exact*. |
| 2 | `SettingsPatch`: all four optional, and explicitly allowed to hold `undefined`. |
| 3 | `mergeSettings` applies the patch but **ignores** keys whose value is `undefined`. |
| 4 | `withoutLanguage` returns a copy with the `language` key genuinely gone. |
| 5 | `isConfigured` reports whether the key is **present** — `autoSave: false` counts as configured. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.
- `mergeSettings` must not mutate its `base` argument.

## Done when

```bash
npm run check 03/03
```

<details>
<summary>Hint 1 — how do I allow explicit undefined again?</summary>

The `?` and the `| undefined` are now two *different* statements. Write both:

```ts
autoSave?: boolean | undefined;   // may be absent OR present-and-undefined
autoSave?: boolean;               // may only be absent
```
</details>

<details>
<summary>Hint 2 — why is <code>{ ...base, ...patch }</code> wrong?</summary>

Spreading copies every **own key**, including keys whose value is `undefined`.
So `{fontSize: 12}` spread with `{fontSize: undefined}` gives
`{fontSize: undefined}` — the patch has destroyed the default rather than
deferring to it.

Copy the base, then assign each field only when its patch value is not
`undefined`.
</details>

<details>
<summary>Hint 3 — removing a key without mutating</summary>

Rest destructuring pulls a key out and gives you everything else as a new
object:

```ts
const { thing: _unused, ...rest } = source;
```
</details>

<details>
<summary>Hint 4 — TODO 5, present vs truthy</summary>

`autoSave: false` is *configured*. Any check based on truthiness gets this
wrong. You want the JavaScript operator that asks whether a key exists on an
object — the same one used for narrowing back in 02/04.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
where this flag pays off, where it becomes annoying (React props are the usual
complaint), and how it interacts with `Partial<T>`.
