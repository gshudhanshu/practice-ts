# 09/02 — Composable validators

**Tier:** Core · **Time:** ~30 min · **Course section:** 09 — Classes & generics practice

---

## Where this fits

Part 2 of the section-09 project. Small validators that compose into bigger
ones, all fully typed.

TODO 5 introduces a technique worth knowing on its own: **curried generics**,
the standard workaround for TypeScript's lack of partial type-argument
inference. You will meet it in real library APIs.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `required(message?)` — rejects blank/whitespace-only. Default message `"is required"`. |
| 2 | `minLength(n)` — measured **after trimming**. |
| 3 | `inRange(min, max)` — inclusive at both ends. |
| 4 | `combine(...validators)` — the **first** error wins; zero validators always pass. |
| 5 | `rulesFor<T>()` + `validateAll(subject, rules)`. |

### What TODO 5 must enforce

```ts
const userRule = rulesFor<User>();
userRule("name", required());      // ok
userRule("age", required());       // compile error — age is a number
userRule("name", inRange(0, 10));  // compile error — name is a string
userRule("nope", required());      // compile error — no such field
```

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.

## Done when

```bash
npm run check 09/02
```

<details>
<summary>Hint 1 — these are factories, not validators</summary>

`required()` **returns** a validator; it is not one itself. That is what lets it
carry configuration while every result still has the same `Validator<T>` shape,
so `combine` can treat them uniformly.

```ts
export function required(message?: string): Validator<string> {
  return (value) => (value.trim() === "" ? (message ?? "is required") : null);
}
```
</details>

<details>
<summary>Hint 2 — why two calls in TODO 5?</summary>

You would like to write `rule<User>("name", required())`, with `K` inferred from
`"name"`. TypeScript does not allow that: supplying one type argument means
supplying **all** of them.

So split it. The outer call fixes `T`; the inner one infers `K`:

```ts
export function rulesFor<T>() {
  return function rule<K extends keyof T & string>(
    field: K,
    validator: Validator<T[K]>,
  ): FieldRule<T> { … };
}
```
</details>

<details>
<summary>Hint 3 — where does K go in the result?</summary>

It disappears. `FieldRule<T>` has no `K`, because the returned `check` closes
over both the field name and the validator:

```ts
check: (subject) => validator(subject[field]),
```

That erasure is deliberate — it is what lets one array hold rules for a
`string` field and a `number` field at the same time.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md), then move
on to [09/03](../03-validated-table/README.md).
