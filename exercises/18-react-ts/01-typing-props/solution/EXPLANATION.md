# 18/01 — Typing props

## The two flavours of optional, and why React needs both

```ts
type Exact      = { tone?: Tone };              // absent only
type Spreadable = { tone?: Tone | undefined };  // absent OR present-and-undefined
```

Without `exactOptionalPropertyTypes` these are the same type. With it — and this
repo has it on, as does any codebase that has thought about it — they are not:

```ts
const a: Exact = { tone: undefined };       // error
const b: Spreadable = { tone: undefined };  // fine
```

Both belong in React code, for different jobs:

- **Exact optionals** for a component's own contract. "Absent" and "present but
  undefined" mean the same thing to a reader, so forbidding one of them removes
  a distinction nobody wants to think about.
- **`| undefined`** at boundaries where props arrive by spreading. `<Badge {...rest} />`
  passes `tone: undefined` whenever `rest` has the key at all, and a value built
  by `{ ...defaults, ...overrides }` almost always does.

`@types/react` picks the second everywhere: `className?: string | undefined`,
`onClick?: MouseEventHandler<T> | undefined`, all of them. That is not an
oversight — the whole point is that a DOM prop must survive being spread.

## The `Required<T>` surprise

This one costs people an afternoon:

```ts
Required<{ tone?: Tone }>["tone"];             // Tone
Required<{ tone?: Tone | undefined }>["tone"]; // Tone | undefined  ← still there
```

`Required<T>` is `{ [K in keyof T]-?: T[K] }`. The `-?` removes the *optionality
marker*. Under `exactOptionalPropertyTypes` an exact optional carries its
`undefined` in that marker, so removing the marker removes the `undefined` too.
A property written `tone?: Tone | undefined` carries the `undefined` in its
declared **type**, where `-?` cannot reach it.

The practical consequence: `Required<ComponentPropsWithoutRef<"button">>` does
**not** give you a button whose props are all present. Every one of them is
still `X | undefined`, and the compiler will not stop you from believing
otherwise. If you want that, you need `NonNullable` on the values as well:

```ts
type FullyResolved<T> = { [K in keyof T]-?: NonNullable<T[K]> };
```

This exercise derives `ResolvedBadgeProps` from `BadgeProps` (the exact
optionals) precisely so `Required` behaves.

## `ReactNode` is wider than you think

```ts
type ReactNode =
  | ReactElement | string | number | bigint
  | Iterable<ReactNode> | ReactPortal | boolean
  | null | undefined | Promise<AwaitedReactNode>;
```

Two things follow.

**It already contains `undefined`.** So `footer?: ReactNode` accepts an explicit
`undefined` even under `exactOptionalPropertyTypes` — the `| undefined` is
already in the declared type. This is the one place where the two flavours of
optional collapse back into one.

**It contains `boolean` and `Promise`.** `boolean` is there because
`{cond && <X/>}` evaluates to `false` when `cond` is falsy, and React must
accept that. `Promise` is there for React Server Components. Neither renders
anything visible, which is why `{count && <Badge/>}` prints a bare `0` when
`count` is `0` — `0` is a *number*, and numbers do render.

Use `ReactNode` for "content" props. Use `ReactElement` only when you genuinely
need an element (to call `cloneElement`, say), and accept that it rejects
strings.

## Extending the native element

```ts
type IconButtonProps = Omit<ComponentPropsWithoutRef<"button">, "type"> & {
  icon: string;
  type?: "button" | undefined;
};
```

`ComponentPropsWithoutRef<"button">` is every attribute a `<button>` takes, with
correctly-typed events (`MouseEventHandler<HTMLButtonElement>`, not a bare
`Function`), `aria-*`, `data-*` and `children`. Re-declaring even a handful of
those by hand is how components end up rejecting `aria-label`.

Three variants worth telling apart:

| Helper | Use it for |
|---|---|
| `ComponentPropsWithoutRef<T>` | The default. `ref` is not yours to accept. |
| `ComponentPropsWithRef<T>` | You forward a ref (React 19 makes `ref` an ordinary prop again). |
| `ComponentProps<T>` | Rarely — it resolves to `WithRef` for intrinsics, which surprises people. |

**Why `Omit` before overriding.** Intersecting a narrower type onto an existing
prop *sometimes* works: `("button" | "submit" | "reset") & "button"` is
`"button"`. But when the types do not overlap — say you want `size?: "sm" | "lg"`
over the native `size?: number` — the intersection is `never`, and a `never`
prop is unsatisfiable without any error at the declaration site. `Omit` first
makes the override explicit and always correct.

## Why `React.FC` fell out of favour

It was the default for years. Three things happened.

1. **It used to add `children` implicitly.** A component that took no children
   still accepted them, silently. React 18's types removed that — which was a
   breaking change for everyone who *relied* on it, and left a generation of
   Stack Overflow answers wrong.
2. **It cannot express a generic component.** `FC<P>` fixes `P`. There is no way
   to write `<T,>(props: ListProps<T>) => …` through it — you need a plain
   generic function type. That is 18/04, and it is the reason that actually
   forces the change.
3. **It buys nothing.** Annotating the props parameter gives the same checking,
   plus an inferred return type, plus room for `async` components (`FC`'s return
   type is `ReactNode | Promise<ReactNode>` for exactly that reason, which tells
   you how the type has had to be stretched).

The modern default is simply:

```ts
function Badge(props: BadgeProps) { … }
```

Not "`FC` is wrong" — plenty of codebases still use it happily — but "typing the
parameter is strictly more capable", which is the answer an interviewer wants.

## Common mistakes

| Mistake | What happens |
|---|---|
| `tone?: Tone` at a spread boundary | `{...rest}` with `tone: undefined` fails to compile |
| `| undefined` on the component's own contract | Two ways to say "not set"; readers must care |
| `Required<T>` over `| undefined` props | Silently still `T \| undefined` — no error, wrong belief |
| `children: ReactNode` (required) | Every call site must pass children, even `<Panel />` |
| Re-declaring native props by hand | `aria-*`, `data-*` and event element types quietly lost |
| Intersecting a narrower prop without `Omit` | `never` when the types do not overlap |
| `count || 0` for a default | `0` is falsy; the default fires on a legitimate value |
| Mutating `props` to apply defaults | Props are read-only; memoisation stops telling the truth |

## Interview angle

> *"How would you type a component that wraps a native `<button>` and adds an icon?"*

Lead with `ComponentPropsWithoutRef<"button">` and say why: correct event
element types, ARIA and data attributes, and no drift when the DOM types update.
Then show the override — `Omit` the prop, intersect your narrower version — and
mention `ComponentPropsWithRef` as the variant for when you forward a ref. If
you get to explain *why* `Omit` rather than a bare intersection (the `never`
trap), you have answered better than most.

> *"Do you use `React.FC`? Why or why not?"*

The strong answer is not an opinion, it is three facts: it used to inject
`children` and no longer does (so old advice about it is wrong), it cannot
express a generic component, and annotating the props parameter gives you
everything it gives you plus an inferred return type. Then say what you actually
do on a team: pick one and lint for it, because the mixed codebase is the only
genuinely bad outcome.
