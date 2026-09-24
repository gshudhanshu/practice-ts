# 18/02 — Discriminated union props

## The one idea

> If two props can never sensibly appear together, they belong to two different
> members of a union — not to one object with both of them optional.

Everything below is that sentence applied three ways.

## Shape 1 — tagged variants

```ts
type ActionProps =
  | { variant: "link"; href: string; label: string }
  | { variant: "button"; onClick: () => void; label: string }
  | { variant: "submit"; formId: string; label: string };
```

Two guarantees fall out, and it is worth knowing *which mechanism* gives you
each — interviewers ask.

**Missing props** come from ordinary assignability: `{ variant: "link", label }`
matches no member, because the link member requires `href`.

**Cross-member props** — `variant: "link"` *plus* `onClick` — come from **excess
property checking**, which is a weaker mechanism than it looks. TypeScript uses
the discriminant to pick the member the literal is aiming at, then rejects any
key that member does not declare. But that check applies to **object literals
only**:

```ts
const props = { variant: "link", href: "/d", label: "D", onClick: fn } as const;
const action: ActionProps = props;   // ✅ no error — the extra key slips through
```

JSX attributes are always a literal, so `<Action variant="link" onClick={fn} />`
is caught. A props object assembled in a variable and spread is not.

If you want the rejection to hold for both, declare the foreign key explicitly:

```ts
| { variant: "link"; href: string; label: string; onClick?: never }
| { variant: "button"; onClick: () => void; label: string; href?: never }
```

Now the extra key is an assignability failure rather than an excess-property
warning, and the variable above is rejected too. That is the same `?: never`
idiom as shape 2 below — worth reaching for on a component whose props get built
programmatically, and usually noise on one that is only ever written as JSX.

### Should the shared part be an intersection?

```ts
type ActionProps = { label: string } & (
  | { variant: "link"; href: string }
  | { variant: "button"; onClick: () => void }
);
```

Equivalent, and better once the shared part grows past two or three props. It
reads worse for small unions and error messages get noisier, so repeat the
shared props while there are few of them.

## Shape 2 — the all-or-nothing pair

```ts
type AsyncButtonProps =
  | { loading: true; loadingLabel: string }
  | { loading?: false; loadingLabel?: never };
```

Two tricks in three lines.

**A boolean literal is a discriminant.** `true` and `false` are unit types, so
`loading: true` picks a member exactly as `variant: "link"` does. Writing
`loading?: boolean` would destroy that — `boolean` is `true | false`, so it
matches both members and discriminates nothing.

**`?: never` means "not here".** No value has type `never`, so the property can
only be satisfied by being absent. Drop it and the *literal*
`{ loading: false, loadingLabel: "x" }` is still rejected — by excess-property
checking — but the same object built in a variable and then assigned is
accepted. Declaring `loadingLabel?: never` turns it into a plain assignability
failure, which holds either way, and states the intent where a reader will see
it.

> Under `exactOptionalPropertyTypes`, `loadingLabel?: never` also refuses an
> explicit `loadingLabel: undefined`. If you need to tolerate that (props coming
> in by spread), write `loadingLabel?: undefined` instead — it means "absent or
> undefined" rather than "absent".

**When to split the component instead.** A union of five members with five
different required props is a sign that `<Action>` should have been `<Link>`,
`<Button>` and `<SubmitButton>`. The union is right when the modes share most of
their rendering; three components are right when they share almost none.

## Shape 3 — controlled vs uncontrolled

```ts
type ToggleProps =
  | { checked: boolean; onChange: (next: boolean) => void; defaultChecked?: never }
  | { checked?: undefined; defaultChecked?: boolean | undefined;
      onChange?: ((next: boolean) => void) | undefined };
```

Three deliberate decisions:

- **`onChange` is required when `checked` is.** A controlled input whose parent
  never receives changes is a read-only input that looks interactive — React
  itself warns about this at runtime. The union turns the warning into a
  compile error.
- **`checked?: undefined`, not an absent key.** `undefined` is a unit type, so
  it discriminates. Spelling it out is what makes `props.checked !== undefined`
  narrow to the controlled member and give you `onChange` for free.
- **`defaultChecked?: never` on the controlled member.** Passing both owners is
  the single most common React mistake in this area; this makes it a build
  error.

### `false` is a value

```ts
if (props.checked !== undefined) { … }   // correct
if (props.checked) { … }                 // wrong: false means uncontrolled
props.checked ?? internal                // right by luck; says the wrong thing
```

The third one produces the correct answer but reads as "use the prop unless it
is nullish", which is a different rule from "use the prop when the component is
controlled". Write the rule you mean; the next person will change it.

### Why `internal` and not `defaultChecked`

`defaultChecked` seeds the state **once**, at mount. After that, the component's
own state is the truth. Reading `defaultChecked` on every render is the bug that
makes an uncontrolled input snap back to its initial value whenever the parent
re-renders — and it is invisible in tests that only render once.

## `assertNever` earns its place here

```ts
default:
  return assertNever(props, "unhandled action variant");
```

The value of the guard is not the runtime throw. It is that adding a fourth
member to `ActionProps` makes `props` no longer `never` in the default branch,
so **the build fails at every switch that forgot it**. A `default: return ""`
would ship the gap silently.

The runtime throw still matters, because unions are erased: an action replayed
from `localStorage`, or a payload from an untyped API, can reach the switch with
a variant no member declares. The test builds one via `JSON.parse` — which
returns `any` — because that is genuinely the only door such a value comes
through.

## Common mistakes

| Mistake | What happens |
|---|---|
| One object, every prop optional | Illegal combinations compile; runtime guards everywhere |
| `loading?: boolean` as a discriminant | `boolean` is `true \| false`; it matches both members |
| Omitting `checked?: undefined` | `!== undefined` compiles but narrows nothing |
| `if (props.checked)` | `checked: false` is misread as uncontrolled |
| Reading `defaultChecked` every render | Uncontrolled input snaps back on parent re-render |
| `default: return ""` instead of `assertNever` | A new variant ships unhandled and silent |
| `"href" in props` inside the switch | The discriminant already narrowed; the check is dead code |
| A 6-member union with nothing shared | Should have been separate components |

## Interview angle

> *"How do you stop someone passing `href` and `onClick` to the same component?"*

Name the mechanism, not just the syntax: a discriminated union of props, where
the discriminant selects the member and **excess-property checking** rejects the
foreign key. Then add the two refinements that show experience: `?: never` for a
prop that must be absent rather than merely undeclared, and the observation that
past three or four members you probably want separate components.

> *"How would you type a component that is either controlled or uncontrolled?"*

A two-member union discriminated on the presence of `value`/`checked`, with
`onChange` required in the controlled member and the default-value prop
forbidden there. The detail that separates a good answer: `checked?: undefined`
is what makes the presence check narrow, and `defaultChecked` is read once at
mount, never on subsequent renders.
