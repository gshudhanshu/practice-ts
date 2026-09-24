# 18/02 — Discriminated union props

**Tier:** Core · **Time:** ~25 min · **Course section:** 18 — React + TypeScript

---

## Why this exercise exists

The most valuable thing TypeScript does for a component is refuse a prop
combination the component cannot honour:

```tsx
<Action variant="link" onClick={save} />    // a link has no click handler
<AsyncButton loadingLabel="Saving…" />      // a label for a state it never enters
<Toggle checked={value} />                  // controlled, with no way to change
```

A single props object with everything optional accepts all three, and then the
component has to defend itself at runtime with `if (props.href)` — checks the
type system could have made unnecessary. A union makes the bad combinations
**unrepresentable**.

You already know discriminated unions ([02/04](../../02-essentials/04-unions-and-narrowing/))
and `assertNever` ([02/06](../../02-essentials/06-unknown-and-exhaustiveness/)).
This exercise is about *applying* them to props, where the same three shapes
come up over and over:

| Shape | Discriminant |
|---|---|
| Tagged variants | a `variant` / `kind` string literal |
| All-or-nothing pair | a boolean **literal** (`true` vs `false`), plus `?: never` |
| Controlled vs uncontrolled | the **presence** of a prop (`checked?: undefined`) |

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `ActionProps` — link / button / submit, each with its own extra prop. |
| 2 | `describeAction` — exhaustive `switch`, `assertNever` in the default. |
| 3 | `AsyncButtonProps` — `loading` and `loadingLabel` must travel together. |
| 4 | `ToggleProps` — controlled requires `onChange`; uncontrolled forbids `checked`. |
| 5 | `resolveToggle` — the pure core; `checked: false` is a value, not an absence. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.
- No runtime guards that the type system already provides. If your
  `describeAction` needs `if ("href" in props)`, the union in TODO 1 is not
  doing its job.

## Done when

```bash
npm run check 18/02
```

<details>
<summary>Hint 1 — the tagged union</summary>

Each member carries the discriminant **and** only the props that mode needs:

```ts
type ActionProps =
  | { variant: "link"; href: string; label: string }
  | { variant: "button"; onClick: () => void; label: string };
```

Repeating `label` in every member is fine and usually clearer than
`{ label: string } & (…)`. Reach for the intersection only when the shared part
gets big.
</details>

<details>
<summary>Hint 2 — "this key must not be here"</summary>

```ts
type AsyncButtonProps =
  | { loading: true; loadingLabel: string }
  | { loading?: false; loadingLabel?: never };
```

`loadingLabel?: never` is satisfied by leaving the key out and by nothing else —
no value has type `never`. That is how the second member forbids a prop the
first one requires.
</details>

<details>
<summary>Hint 3 — discriminating on presence</summary>

`undefined` is a unit type, so it discriminates exactly like `"link"` does:

```ts
type ToggleProps =
  | { checked: boolean; onChange: (next: boolean) => void }
  | { checked?: undefined; defaultChecked?: boolean | undefined };
```

Now `props.checked !== undefined` narrows to the controlled member. If you omit
the `checked?: undefined` key entirely, the check still compiles but narrows
nothing useful.
</details>

<details>
<summary>Hint 4 — TODO 5 and the falsy trap</summary>

`checked` is a boolean, so `false` is a legitimate controlled value. Compare
with `!== undefined`, not with truthiness — one of the tests is exactly
`{ checked: false }` against an internal `true`.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
why excess-property checking catches the cross-member props, when `?: never`
beats a separate component, and the controlled/uncontrolled API decision.

Next: [18/03 — typing hooks](../03-typing-hooks/).
