# 21/04 — Object transformations

## `{} extends Pick<T, K>` — the optionality test

```ts
type OptionalKeys<T> = { [K in keyof T]-?: {} extends Pick<T, K> ? K : never }[keyof T];
```

There is no `IsOptional<T, K>` primitive, and the obvious substitutes are wrong:

| Attempt | Why it fails |
|---|---|
| `undefined extends T[K]` | True for `a: string \| undefined`, which is **required** |
| `keyof T` | Optional and required keys look identical |
| `Partial<T> extends T` | Answers a question about the whole type, not one key |

`Pick<T, K>` isolates a single property into its own object type. Optionality is
a property of the *declaration*, and `Pick` preserves it, so:

```ts
Pick<Account, "nickname">;   // { nickname?: string }  →  {} is assignable
Pick<Account, "id">;         // { id: string }         →  {} is not
```

That distinction is exactly what `exactOptionalPropertyTypes` (03/04) makes
meaningful: `{ a?: string }` may be absent; `{ a: string | undefined }` must be
present and may hold `undefined`. The test asserts both.

### Why `-?` is needed

```ts
{ [K in keyof T]-?: … }[keyof T]
```

Without `-?`, mapping over an optional key produces an optional property, and
indexing an optional property adds `undefined` to the union. You would get
`"nickname" | "bio" | undefined`. The modifier removes the optionality of the
**mapped** properties; it has nothing to do with the values you are computing.

## `PickByValue` and the missing optional property

```ts
PickByValue<Account, string>;   // { id: string; name: string }
```

`nickname?: string` has the type `string | undefined`, and
`string | undefined extends string` is false. So it is dropped — and that is
correct: a property that might be absent is not a `string` property.

If you want them, ask for what you actually mean:

```ts
PickByValue<Account, string | undefined>;   // includes nickname and bio
```

Key remapping is the mechanism: `as` may compute the key, and a key of `never`
removes the property entirely. It is the fourth of the four moves from 10/03.

## `Merge` — and what it loses

```ts
type Merge<A, B> = {
  [K in keyof A | keyof B]: K extends keyof B ? B[K] : K extends keyof A ? A[K] : never;
};
```

`A & B` is not a substitute. An intersection **combines** conflicting
properties, so `{ b: number } & { b: boolean }` has `b: never`, and it renders
in tooltips as two object types joined by `&` rather than one readable shape.

The honest limitation: this `Merge` is **not modifier-preserving**. Mapping over
a computed union of keys is not a homomorphic mapped type, so `readonly` and `?`
are dropped:

```ts
Merge<{ a?: string }, { b: number }>;   // { a: string | undefined; b: number }
```

The test asserts that, rather than pretending it does not happen. Preserving
modifiers means splitting the work into "keys only in A", "keys only in B" and
"keys in both", each mapped homomorphically — noticeably more code, and worth it
only when a caller will feel the difference. Say so when asked; a candidate who
knows what their own type loses is more convincing than one who does not.

## `RequireAtLeastOne` — spell out the union

```ts
type RequireAtLeastOne<T, K extends keyof T = keyof T> = Omit<T, K> &
  { [P in K]-?: Required<Pick<T, P>> & Partial<Pick<T, Exclude<K, P>>> }[K];
```

Read it inside out:

1. `Required<Pick<T, P>>` — this key, made mandatory.
2. `Partial<Pick<T, Exclude<K, P>>>` — the other candidate keys, still optional.
3. The mapped type holds one such variant per key; `[K]` collapses it to a
   **union** of variants.
4. `Omit<T, K> &` puts back everything that was never in question.

For `Contact` and `"email" | "phone"` that is:

```ts
{ name: string } & (
  | { email: string; phone?: string }
  | { phone: string; email?: string }
)
```

`{ name: "Ada" }` matches neither variant, so it fails — which is the whole
point.

`notify` can read `contact.email` without narrowing because both variants have
an `email` property (required in one, optional in the other). What TypeScript
*cannot* see is that at least one is defined, so `??` still needs a final
fallback. That is a fair trade: the type stops the wrong call at the boundary,
and the body stays free of assertions.

### The alternative that needs no clever type

```ts
type Contact =
  | { kind: "email"; name: string; email: string }
  | { kind: "phone"; name: string; phone: string };
```

A discriminated union (02/04) gives better errors, narrows properly in the body,
and anyone can read it. `RequireAtLeastOne` is the right tool when you are
*constrained* by an existing shape — a third-party API, a form model, an options
bag you cannot restructure. Reach for it second, not first.

## Common mistakes

| Mistake | What happens |
|---|---|
| `undefined extends T[K]` as the optionality test | Counts `a: string \| undefined` as optional |
| Omitting `-?` from the mapped type | The key union gains `undefined` |
| `T[K] extends V` where V should be `V \| undefined` | Optional properties silently vanish |
| `A & B` for `Merge` | Conflicting keys become `never`, and it displays badly |
| Checking `keyof A` before `keyof B` in `Merge` | A wins conflicts — the wrong way round |
| `Pick<T, P> & Partial<Omit<T, P>>` for RequireAtLeastOne | Loses keys outside K, and makes them all optional |

## Interview angle

> *"How do you find the optional keys of a type?"*

`{} extends Pick<T, K>`, and explain why the obvious alternative fails: an
optional property is not the same as a `| undefined` property, especially under
`exactOptionalPropertyTypes`. Then the second half of the idiom — build a mapped
type whose values are the keys, index it with `keyof T`, and remember `-?`.

> *"Type an options object where at least one of two fields must be present."*

Show `RequireAtLeastOne` as a union of variants, then say when you would not use
it: if you own the shape, a discriminated union is clearer, narrows in the body
and produces a better error message. Knowing the trick and knowing when to
decline it is the answer they are looking for.
