# 18/04 — Generic & polymorphic components

## Part 1 — the generic component

### Where the `<T>` goes

```ts
type ListComponent = <T>(props: ListProps<T>) => ReactNode;   // generic SIGNATURE
type ListComponent<T> = (props: ListProps<T>) => ReactNode;   // generic ALIAS
```

They look almost the same and behave completely differently. The first is a
*single type* describing a function whose `T` is chosen **per call**. The second
is a type *constructor*: you must supply `T` before you have a component type at
all, so a value of that type renders one element type forever.

A generic component needs the first. That is why `React.FC` cannot express one:

```ts
type StringList = FC<ListProps<string>>;
StringList({ items: users, … });   // error — stuck at string
```

`FC<P>` is `(props: P) => ReactNode | Promise<ReactNode>` with `P` already
supplied. There is nowhere to bind a per-call parameter. The workaround people
reach for — `FC<ListProps<any>>` — throws away the relationship that made the
component worth writing.

In practice you rarely write the component *type* at all; you write the function
and let inference do the rest:

```tsx
function List<T>({ items, renderItem, getKey }: ListProps<T>) { … }
```

Knowing the type exists is still what lets you answer why `FC` cannot hold it.

### `.tsx` and the lone `<T>`

In a `.tsx` file `<T>(props: …) => …` parses as JSX. Three fixes, all common:

```tsx
const f = <T,>(x: T) => x;                 // trailing comma
const f = <T extends unknown>(x: T) => x;  // pointless constraint
function f<T>(x: T) { return x; }          // a declaration — no ambiguity
```

`.ts` files (this exercise) have no ambiguity, but write the comma out of habit.

### `readonly T[]`

```ts
items: readonly T[];
```

Two benefits for one word. It documents that the component will not mutate the
caller's array — a real hazard, because `items.sort()` mutates in place and
React will not re-render for it. And it is *more* permissive: a `readonly T[]`
parameter accepts a mutable `T[]`, while the reverse is rejected.

### `T` appears three times

08/01's test for whether a generic earns its keep: a type parameter that appears
**once** relates nothing and should be a constraint or `unknown`. Here `T`
appears in `items`, in `renderItem` and in `getKey`, which is exactly the
relationship the component exists to enforce.

### Duplicate keys

React only *warns* about duplicate keys, in development. What actually happens
is worse than the warning suggests: React matches children across renders by
key, so two rows sharing one key end up sharing component state. Reorder the
list and a row keeps the previous row's uncontrolled input value. That bug is
very hard to find and trivial to prevent, so `renderList` throws.

Check with `Set.has`, not truthiness — `0` and `""` are legal keys, and
`if (!key)` would wave both through.

## Part 2 — the polymorphic component

```ts
type PolymorphicProps<E extends ElementType, P> =
  & P
  & { as?: E | undefined }
  & Omit<ComponentPropsWithoutRef<E>, keyof P | "as">;
```

### Why `Omit<…, keyof P>` is not optional

Intersection does not override. It *combines*, and for two property types that
do not overlap the combination is `never`:

```ts
// without the Omit:
type Bad = { size?: "sm" | "lg" } & ComponentPropsWithoutRef<"input">;
Bad["size"];   // ("sm" | "lg" | undefined) & (number | undefined) → undefined
```

The prop is now unsatisfiable, and nothing was reported at the declaration —
the error lands on your users, at every call site, saying something about
`undefined`. Subtracting `keyof P` first makes the component's own props win,
which is what "my props override the element's" has to mean.

`"as"` is removed for the same reason. Some elements (`<a as>`, in some HTML
dialects, and any component that already has an `as` prop) would otherwise
collide with the `{ as?: E }` member.

### `ElementType`, and the default

```ts
type TextProps<E extends ElementType = "span"> = …
```

`ElementType` covers both intrinsic tags (`"a"`, `"span"`) and components
(`FunctionComponent`, `ComponentClass`), so `<Text as={Link}>` works as well as
`<Text as="a">`. The default is what makes `TextProps` — with no argument — mean
"the span version", which is what the component renders when `as` is absent.

Give the *function's* type parameter the same default. Without a candidate to
infer from (no `as` prop passed), `E` would otherwise resolve to its constraint,
and `ComponentPropsWithoutRef<ElementType>` is not a useful prop set.

### Splitting `as` off, without a cast

```ts
const { as, ...rest } = props;
return { tag: as ?? "span", rest };
```

Rest destructuring does two jobs at once: it removes `as` and it copies the
remaining props into a fresh object, so the caller's props are untouched.
TypeScript types `rest` as `Omit<TextProps<E>, "as">` on its own — no assertion
needed, which is a pleasant surprise on a generic type.

`as` must not survive into `rest`. Spreading it onto a DOM element produces an
unknown-attribute warning in development and an invalid `as="a"` attribute in
the HTML.

### What this pattern costs

Be honest about it in an interview: polymorphic props make error messages much
worse. A typo in a prop name on `<Text as="a">` produces a message about a large
intersection, not "did you mean `href`". Editor autocomplete degrades too, and
`forwardRef` compounds both — it erases generics, so ref-forwarding polymorphic
components need a manual cast of the wrapper or a redeclared signature.

React 19 improves half of this by making `ref` an ordinary prop, so a
polymorphic component can just declare `ref?: ComponentPropsWithRef<E>["ref"]`
and skip `forwardRef` entirely. The error messages are still bad.

Reach for the pattern in a design system, where one `<Text>` saves fifty
one-line wrappers. Do not reach for it in application code, where two components
are cheaper than one clever one.

## Common mistakes

| Mistake | What happens |
|---|---|
| `type ListComponent<T> = (props: ListProps<T>) => ReactNode` | A generic alias; the value still renders one type only |
| `FC<ListProps<any>>` | Compiles, and throws away every guarantee |
| `items: T[]` | Rejects a `readonly` array, and permits mutation |
| Omitting `Omit<…, keyof P>` | Conflicting props silently become `never`/`undefined` |
| Forgetting to remove `"as"` | `as` collides with the element's own props |
| No default on the function's `E` | `E` falls back to `ElementType`; native props become useless |
| Spreading `as` onto the element | React warns; invalid HTML attribute |
| `if (!key)` for the duplicate check | Key `0` treated as missing |

## Interview angle

> *"Write a `<List>` that infers its item type from `items`."*

The signature is the answer: `<T>(props: { items: readonly T[]; renderItem: (item: T, i: number) => ReactNode })`.
Then the two follow-ups that show depth: `T` must appear more than once or the
generic is pointless, and this is the case `React.FC` cannot express — because
`FC<P>` fixes `P`, whereas a generic function type binds `T` at each call.

> *"How would you type an `as` prop?"*

Give the three pieces — own props, `{ as?: E }`, and the native props of `E`
minus `keyof P | "as"` — and lead with *why* the subtraction is there, because
that is the part most answers miss and the part that actually breaks: an
intersection of two disjoint prop types is `never`, silently. Finish with the
trade-off: worse error messages and worse autocomplete, so it belongs in a
design system and not in feature code.
