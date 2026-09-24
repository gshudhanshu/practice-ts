# 18/04 — CHALLENGE: generic & polymorphic components

**Tier:** Challenge · **Time:** ~40 min · **Course section:** 18 — React + TypeScript

---

## Why this exercise exists

Two patterns every design system arrives at, and the two that TypeScript makes
genuinely hard the first time.

**Generic.** The callback's parameter must follow the array's element type:

```tsx
<List items={users} renderItem={(user) => user.name} getKey={(u) => u.id} />
```

That makes the *component* generic. It is also where `React.FC` finally runs out
of road: `FC<P>` fixes `P` where the type is written, and there is nowhere to
put the `<T>` that changes per call site. This exercise makes that concrete —
the spec calls both a generic component and an `FC`, and only one of them works.

**Polymorphic.** The props a caller may pass change with the element rendered:

```tsx
<Text as="a" href="/docs" />   // href is legal
<Text href="/docs" />          // a <span> has no href
```

That means pulling in the native props of whatever `as` names — and **removing
the ones your own props already claim**, which is the step everyone leaves out.
A component with its own `size?: "sm" | "lg"` over a native `<input size?: number>`
intersects down to `undefined`, and nothing warns you.

Neither pattern needs JSX to state or to test. Both are properties of the types,
plus a small amount of pure prop-shuffling.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `ListProps<T>` — `items`, `renderItem`, `getKey`, all related by `T`. |
| 2 | `ListComponent` — the generic function type, `T` bound per call. |
| 3 | `renderList` — pure; entries in order; duplicate keys throw. |
| 4 | `PolymorphicProps<E, P>` — own props, `as`, and the native props minus both. |
| 5 | `splitTextProps` — pull `as` off, default it to `"span"`. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as` (the type assertion), no `!`.
- Type-only imports from `react`.
- `renderList` must not mutate `items`, and `splitTextProps` must not mutate its
  props.

## Done when

```bash
npm run check 18/04
```

<details>
<summary>Hint 1 — where the type parameter goes</summary>

```ts
type ListComponent = <T>(props: ListProps<T>) => ReactNode;   // per call
type StringList = FC<ListProps<string>>;                      // fixed forever
```

The `<T>` belongs to the **call signature**, not to the alias. `type ListComponent<T> = …`
would be a different thing entirely: a generic *alias*, which still has to be
instantiated before you have a component.

In a `.tsx` file you write `<T,>` with a trailing comma, or `<T extends unknown>`,
because a lone `<T>` parses as JSX. `.ts` files do not need it.
</details>

<details>
<summary>Hint 2 — the three pieces of a polymorphic props type</summary>

```ts
type PolymorphicProps<E extends ElementType, P> =
  & P
  & { as?: E | undefined }
  & Omit<ComponentPropsWithoutRef<E>, keyof P | "as">;
```

Read the `Omit` as: "the native props of `E`, except the ones this component
already defines". Both `keyof P` and `"as"` have to go, or your own props lose
the argument with the native ones.
</details>

<details>
<summary>Hint 3 — TODO 5 without a cast</summary>

```ts
const { as, ...rest } = props;
```

Rest destructuring removes `as` *and* copies everything else, and TypeScript
types `rest` as `Omit<TextProps<E>, "as">` by itself — which is exactly what
`TextSplit<E>` asks for. Then `as ?? "span"`.
</details>

<details>
<summary>Hint 4 — duplicate keys</summary>

A `Set<Key>` of the keys seen so far. Check before adding, and put the offending
key in the message — one test asserts the key appears in it.

One test uses the key `0`, so check with `Set.has`, never with truthiness.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
generic function types versus generic aliases, why `keyof P` must be subtracted,
what this pattern costs in error messages, and where `forwardRef` complicates it.

Next: [18/05 — a typed reducer and context](../05-typed-reducer-and-context/).
