# 18/01 — Typing props

**Tier:** Drill → Core · **Time:** ~20 min · **Course section:** 18 — React + TypeScript

---

## Why this exercise exists

A React component is a function from props to UI. Almost everything TypeScript
has to say about React is therefore about **one object type**: the props.

Four decisions separate a props type that survives review from one that does
not:

1. **Required vs optional** — and, under this repo's
   `exactOptionalPropertyTypes`, whether an *explicit* `undefined` counts as
   provided. `{ tone?: Tone }` and `{ tone?: Tone | undefined }` are different
   types, and React code needs both.
2. **`ReactNode`** for anything renderable, `children` included.
3. **Extending the native element** (`ComponentPropsWithoutRef<"button">`)
   instead of re-declaring `onClick`, `disabled` and 200 ARIA attributes.
4. **Resolving defaults once**, with a type that says every optional is now
   filled in.

No JSX and no rendering here. All four are properties of the *types*, which is
the half an interview probes — and the half you cannot check by looking at the
screen.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `BadgeProps` — `label` required; `tone` and `count` **exact** optionals. |
| 2 | `SpreadableBadgeProps` — same, but every optional also admits `undefined`. |
| 3 | `PanelProps` — `heading`, an optional `footer`, and `children`; `ReactNode` throughout. |
| 4 | `IconButtonProps` — every native `<button>` prop, plus `icon`, with `type` narrowed to `"button"`. |
| 5 | `resolveBadgeProps` — apply the defaults in one pure function. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.
- Type-only imports from `react` (`import type { … } from "react"`). React
  itself is not installed and nothing here renders — see the
  [section README](../README.md) for why that is deliberate.

## Done when

```bash
npm run check 18/01
```

<details>
<summary>Hint 1 — the two flavours of optional</summary>

```ts
type Exact      = { tone?: Tone };              // absent only
type Spreadable = { tone?: Tone | undefined };  // absent OR explicit undefined
```

With `exactOptionalPropertyTypes` on, `{ tone: undefined }` is an error against
the first and fine against the second. Every prop in `@types/react` is written
the second way.
</details>

<details>
<summary>Hint 2 — children</summary>

```ts
type PanelProps = PropsWithChildren<{ heading: string; footer?: ReactNode }>;
```

`PropsWithChildren<P>` is nothing more than `P & { children?: ReactNode | undefined }`.
Writing that intersection yourself is equally correct — but use the helper once
so you recognise it in other people's code.
</details>

<details>
<summary>Hint 3 — overriding a native prop</summary>

You cannot simply intersect a narrower `type` onto the native props and expect
the intent to be readable. Remove the prop first, then add your own:

```ts
type Props = Omit<ComponentPropsWithoutRef<"button">, "type"> & {
  icon: string;
  type?: "button" | undefined;
};
```

Keep the `| undefined` — you are extending React's props, so match React's
convention.
</details>

<details>
<summary>Hint 4 — defaults that fire on undefined, not on falsiness</summary>

```ts
const { label, tone = "info", count = 0 } = props;
```

A destructuring default fires **only** on `undefined`, so an absent key and an
explicit `undefined` both get the default, while `0`, `""` and `false` survive.
`??` is the expression form. `||` is the bug the tests check for.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
what `ReactNode` actually contains, the `Required<T>` surprise under
`exactOptionalPropertyTypes`, and why `React.FC` fell out of favour.

Next: [18/02 — discriminated union props](../02-discriminated-union-props/).
