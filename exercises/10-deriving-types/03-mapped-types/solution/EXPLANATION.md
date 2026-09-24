# 10/03 — Mapped types

## The four moves

```ts
{ [K in keyof T]: T[K] | null }                       // 1. change the value
{ -readonly [K in keyof T]: T[K] }                    // 2. change modifiers
{ [K in keyof T as `get${Capitalize<string & K>}`]: … } // 3. rename the key
{ [K in keyof T as Cond extends true ? K : never]: … }  // 4. drop the key
```

That is the whole feature. Everything else is combination.

## How the standard utilities are built

Every one is a one-liner from the moves above:

```ts
type Partial<T>  = { [K in keyof T]?: T[K] };
type Required<T> = { [K in keyof T]-?: T[K] };
type Readonly<T> = { readonly [K in keyof T]: T[K] };
type Pick<T, K extends keyof T> = { [P in K]: T[P] };
type Record<K extends keyof any, V> = { [P in K]: V };
```

Note `Pick` maps over `K` rather than `keyof T` — you can map over **any** union
of keys, not just an existing type's. `Record` does the same with a fixed value
type.

## Modifiers: `-` removes, `+` adds

```ts
-readonly   // strip readonly        (Mutable)
-?          // strip optional        (Required)
+?  or  ?   // add optional          (Partial)
```

`+` is the default and almost always omitted. `-` is the interesting one, and it
is the only way to undo `readonly` or `?`.

## Homomorphic mapped types

A mapped type written directly over `keyof T` is **homomorphic**, which means it
preserves the original modifiers unless you change them:

```ts
type User = { readonly id: string; name?: string };
type Nullable<T> = { [K in keyof T]: T[K] | null };
type N = Nullable<User>;
// { readonly id: string | null; name?: string | null }
//   ^ readonly kept        ^ optional kept
```

That is why `Mutable<User>` equals `User` for an already-mutable type — nothing
was there to remove. It is also why `Nullable` does not accidentally strip
anything.

The property is lost if you map over a computed key union instead
(`[K in Exclude<keyof T, "x">]`), which is a real source of "why did my
`readonly` disappear?" confusion.

## The two meanings of `as`

```ts
value as SomeType                                  // TYPE ASSERTION (07/04)
{ [K in keyof T as NewKey]: T[K] }                 // KEY REMAPPING
```

Completely unrelated, like `as const`. In a mapped type, `as` computes the
output key from the input key. Map it to `never` and the key vanishes — which is
what turns the rename clause into a filter.

## `string & K` — why it is needed

```ts
`get${Capitalize<string & K>}`
```

`keyof T` is `string | number | symbol`. Template literal types accept
string-like types but not `symbol`, so `Capitalize<K>` fails on the general
case. `string & K` intersects the key with `string`, which keeps the string keys
and collapses the others to `never` — and a `never` key drops out.

You will write this intersection every time you build a key-renaming mapped
type.

## Filtering by value type

```ts
type PickByType<T, V> = {
  [K in keyof T as T[K] extends V ? K : never]: T[K];
};
```

Reads as: for each key, if its value type is assignable to `V`, keep the key;
otherwise map it to `never` and drop it.

`PickByType<User, symbol>` correctly gives `{}` — every key was dropped. Worth
knowing that `{}` here means "an object with no declared properties", not "no
type".

> Careful with `boolean`: it is `true | false` internally, so a conditional over
> a naked `T[K]` can distribute over it. Not an issue in this shape (the
> condition is on the key, not distributing), but it bites in 10/04.

## Common mistakes

| Mistake | What happens |
|---|---|
| `[K in T]` instead of `[K in keyof T]` | Maps over the type itself, not its keys |
| `readonly` without `-` in `Mutable` | Adds the modifier instead of removing it |
| `Capitalize<K>` without `string & K` | Fails because `K` may be `number \| symbol` |
| Using `Omit`/`Pick` for TODO 4 | They filter by key name, not by value type |
| Truthiness checks in `fillNulls` | `""`, `0` and `false` wrongly rejected |
| Building the result then casting it | Unnecessary — narrowed locals are already assignable |

## Interview angle

> *"Implement `Partial<T>` yourself."*

`{ [K in keyof T]?: T[K] }`. Then show range by giving `Required` (`-?`) and
`Readonly` — and mention that mapping over `keyof T` directly is *homomorphic*,
so modifiers are preserved. That word, used correctly, signals you have read
past the tutorials.

> *"Give me a type that keeps only the string-valued properties of an object."*

The key-remapping filter above. The insight worth stating out loud: **mapping a
key to `never` removes it**, which is what lets an `as` clause act as a filter
rather than just a rename.
