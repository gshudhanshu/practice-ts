# 07/05 — CHALLENGE: assertion functions

**Tier:** Challenge · **Time:** ~35 min · **Course section:** 07 — Advanced types

---

## Why this exercise exists

You already know type predicates from 02/06. Assertion functions are their
sibling, and the difference is where the narrowing applies:

```ts
function isFoo(v: unknown): v is Foo          // narrows INSIDE an `if`
function assertFoo(v: unknown): asserts v is Foo  // narrows for the REST OF THE SCOPE
```

That turns validation from a pyramid of nested `if`s into a flat list of
statements. It is how `node:assert`, Zod's `.parse()` and most real validation
layers are shaped.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `assertIsRecord` — throws `TypeError("expected an object")`. Arrays and `null` are rejected. |
| 2 | `assertIsString` — throws ``TypeError(`${label} must be a string`)``. |
| 3 | `assertIsOrder` — validates the whole shape, **in a fixed order**. |
| 4 | `parseOrder` — JSON → `Order`, throwing on bad input. Three lines, no casts. |
| 5 | `describeOrder` — the safe wrapper. Never throws. |

### Error messages, checked in this order

| Problem | Message |
|---|---|
| Not an object | `expected an object` |
| `id` not a string | `id must be a string` |
| `totalCents` not a non-negative integer | `totalCents must be a non-negative integer` |
| `items` not an array of strings | `items must be an array of strings` |
| Malformed JSON | `malformed JSON` |

`describeOrder` output: `"Order a: 2 items, 12.50"`, singular `"1 item"`, or
`"invalid order: <message>"`.

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.
- `assertIsOrder` must **reuse** the two helpers above it.

## Done when

```bash
npm run check 07/05
```

<details>
<summary>Hint 1 — the return type</summary>

```ts
export function assertIsRecord(
  value: unknown,
): asserts value is Record<string, unknown> {
  if (…) throw new TypeError("expected an object");
}
```

No `return` statement. The narrowing works because the only way to reach the
next line is for the claim to hold.
</details>

<details>
<summary>Hint 2 — assertions stack</summary>

After `assertIsRecord(value)`, `value` is a `Record<string, unknown>` for the
rest of the function, so you can destructure it. Then assert each field. No
nesting anywhere.
</details>

<details>
<summary>Hint 3 — <code>Number.isInteger</code> does not narrow</summary>

It is typed `(number: unknown) => boolean`, so it returns a plain boolean and
leaves the value as `unknown`. Put a `typeof totalCents !== "number"` check
first — `||` narrows left to right, which is what makes `totalCents < 0` legal
afterwards.
</details>

<details>
<summary>Hint 4 — a stable message for bad JSON</summary>

`JSON.parse` throws a `SyntaxError` whose text differs between engines and
versions, so it cannot be asserted on. Catch it and re-throw your own
`TypeError("malformed JSON")`.
</details>

<details>
<summary>Hint 5 — <code>catch</code> gives you <code>unknown</code></summary>

`useUnknownInCatchVariables` is part of `strict`, so `error` is `unknown` and
`error.message` will not compile. Narrow first:

```ts
const message = error instanceof Error ? error.message : String(error);
```
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
predicate vs assertion, the declaration rule that makes assertion functions fail
in surprising ways, and where schema libraries take over.

**That completes section 07.** Next: [section 08 — generics](../../08-generics/).
