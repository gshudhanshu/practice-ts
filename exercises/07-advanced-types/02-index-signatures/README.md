# 07/02 — Index signatures & dynamic keys

**Tier:** Core · **Time:** ~20 min · **Course section:** 07 — Advanced types

---

## Why this exercise exists

Index signatures are how you type an object whose keys you do not know ahead of
time — translation catalogues, caches, HTTP headers, parsed query strings.

Three things are worth learning, and this exercise contains all three:

1. An index signature **constrains the declared properties beside it**.
2. `keyof` behaves surprisingly on one.
3. `noUncheckedIndexedAccess` makes every read honest — which is the point.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `Translations` — locale → (message key → text). Both levels have unknown keys. |
| 2 | `translate` — look up a message, or return `fallback`. |
| 3 | `Config` — a required `name: string` plus arbitrary `string \| number` entries. |
| 4 | `flattenTranslations({ en: { greeting: "Hello" } })` → `{ "en.greeting": "Hello" }`. |
| 5 | `pickDefined` — drop undefined values **and** narrow the type to `Record<string, string>`. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.

## Done when

```bash
npm run check 07/02
```

<details>
<summary>Hint 1 — two ways to write the same type</summary>

```ts
type A = Record<string, number>;      // mapped-type form
type B = { [key: string]: number };   // index-signature form
```

For an open `string` key these are the **same type** — the test asserts it.
Either is fine for TODO 1.
</details>

<details>
<summary>Hint 2 — TODO 3 will reject a boolean, and that is the lesson</summary>

Every **declared** property must be assignable to the index signature's value
type. So with `[key: string]: string | number`, a `name: string` is fine but a
`debug: boolean` would not compile.

The reason: `config["name"]` must be valid, and the index signature promises
that any string key yields `string | number`.
</details>

<details>
<summary>Hint 3 — iterating an object safely</summary>

`Object.entries(obj)` gives `[key, value]` pairs and, unlike `for...in`, does
not walk the prototype chain. It is the right default for both TODO 4 and 5.
</details>

<details>
<summary>Hint 4 — how does TODO 5 change the type?</summary>

You cannot cast the `undefined` away. Build a **new** `Record<string, string>`
and only assign entries you have proven are defined — the narrowing inside the
`if` is what makes the assignment legal.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
`Record` vs index signature (and the `keyof` quirk where two identical types
disagree), why `noPropertyAccessFromIndexSignature` exists, and when a `Map` is
the better tool.
