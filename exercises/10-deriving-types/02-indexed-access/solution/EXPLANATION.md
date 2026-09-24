# 10/02 — Indexed access types

## The forms

```ts
User["id"]                                     // string
User["name" | "age"]                           // string | number
User["address"]["geo"]                         // { lat: number; lon: number }
User["orders"][number]                         // one order
User["orders"][number]["items"][number]        // one line item
```

Indexing with a **union of keys** gives the union of those property types.
`[number]` gives an array's element type — the same operator as
`(typeof ROLES)[number]` in 10/01, applied to an array rather than a tuple.

Everything nests, so any type inside a structure is reachable without naming the
levels in between.

## Why not extract sub-interfaces?

The usual instinct is to break `User` apart:

```ts
type Geo = { lat: number; lon: number };
type Address = { city: string; country: string; geo: Geo };
type User = { id: string; address: Address; … };
```

That is fine, and sometimes better — if `Address` is a **domain concept** used
in several places, it deserves a name.

But when the shape only exists as part of `User`, extracting it creates a second
thing to keep in sync and a name that adds no information. Indexed access gives
you the type without the bookkeeping:

```ts
type Geo = User["address"]["geo"];
```

The practical test: **would this type be meaningful on its own?** If yes, extract
it. If it is only ever "the geo bit of a user", reach in.

This matters most with types you do not own — a generated API client, a library's
options object. You cannot refactor those, but you can index into them:

```ts
type FetchOptions = Parameters<typeof fetch>[1];
type QueryResult = Awaited<ReturnType<typeof api.getUser>>;
```

That pattern — indexing into `Parameters` and `ReturnType` — is how you type
against a library that did not export the type you need.

## The `T[keyof T]` trap

```ts
type AllValues = User[keyof User];
// string | number | { city: … } | { id: … }[]
```

This is occasionally what you want, and usually not. It flattens every property
type into one union, so you lose which key produced which type — exactly the
imprecision `K extends keyof T` was invented to avoid (08/02).

If you find yourself writing `T[keyof T]`, check whether you actually wanted a
generic that captures `K`.

## Optional properties come through as-is

```ts
type MaybeNote = { note?: string }["note"];   // string | undefined
```

Indexed access reads the property's declared type, so an optional property
yields `| undefined` — and a `readonly` modifier is dropped, because modifiers
belong to the property, not the type.

## Common mistakes

| Mistake | What happens |
|---|---|
| `User.address` (dot syntax) | Not valid in type position — always brackets |
| `User["orders"]["items"]` | Error: `items` is not a key of an *array*. You need `[number]` first |
| Re-declaring `Geo` by hand | Works, then drifts when `User` changes |
| `User[keyof User]` for TODO 2 | Every value type, not just `name` and `age` |
| `allSkus(): string[]` written literally | Passes the test, but misses the exercise's point |

## Interview angle

> *"A library exports a function but not the type of its options. How do you get
> it?"*

Index into it: `Parameters<typeof theFunction>[0]`, or
`Awaited<ReturnType<typeof theFunction>>` for the result. This comes up
constantly with generated clients and under-exported libraries, and knowing it
saves re-declaring a type you cannot keep in sync.

> *"When would you extract a sub-type instead of indexing into it?"*

When it is a domain concept in its own right and gets used elsewhere. When it is
only "that part of this other type", indexing avoids a name that adds nothing
and a definition that can drift.
