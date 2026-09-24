# 20/02 — Key selection

## The three definitions

```ts
type MyPick<T, K extends keyof T> = { [P in K]: T[P] };
type MyRecord<K extends keyof any, V> = { [P in K]: V };
type MyOmit<T, K extends keyof any> = {
  [P in keyof T as P extends K ? never : P]: T[P];
};
```

The first two are the standard library's, verbatim. The third is not — the real
one is:

```ts
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
```

Both produce the same type for every case in the tests. The remapped version
states the intent directly (*"keep the key unless it is in K"*) and needs no
second utility; the stdlib version reuses machinery it already had. You rebuild
`Exclude` in 20/03, at which point the stdlib form is a one-liner for you too.

## `Pick` maps over `K` — and is still homomorphic

The homomorphism rule from 20/01 has a second clause that is easy to miss:

> A mapped type is homomorphic when its keys come from `keyof T` **or from a
> type parameter constrained by `keyof T`**.

`K extends keyof T` satisfies the second clause, so `{ [P in K]: T[P] }`
preserves modifiers:

```ts
MyPick<User, "id">        // { readonly id: string }   ← readonly kept
MyPick<User, "lastLogin"> // { lastLogin?: Date }      ← optional kept
```

Change the constraint to `K extends string` and that stops being true — same
body, modifiers gone. The constraint is not decoration; it participates in how
the mapped type behaves.

It is also what makes `Omit` keep modifiers even though `Exclude<keyof T, K>` is
a computed union: the mapped type inside `Pick` was *declared* homomorphic, and
that is decided where it is written, not where it is instantiated.

## Why `Omit`'s constraint is loose

```ts
Omit<User, "pasword">   // compiles. Removes nothing. Returns User.
Pick<User, "pasword">   // error, as you would hope.
```

An inconsistency in the standard library, and a deliberate one. The reasons the
team gives:

1. **`Omit` is routinely used on generic or partially-known types.** In
   `Omit<T, K>` where `T` is still a type parameter, `keyof T` is unresolved,
   and a strict constraint makes perfectly reasonable code fail to compile.
2. **Union inputs.** `Omit<A | B, "id">` with a strict constraint would demand
   `"id"` exist in *both* members.
3. **Backwards compatibility.** `Omit` was added in 3.5 after several years of
   everybody hand-rolling it; tightening it now would break a great deal of
   working code.

The cost is that the most common refactoring bug in TypeScript — renaming a
property and forgetting one `Omit` — is silent. 20/05 builds the strict version
and shows when to reach for it.

## `Record` and the two kinds of key

```ts
MyRecord<"admin" | "editor", number>  // { admin: number; editor: number }
MyRecord<string, boolean>             // { [key: string]: boolean }
```

Same definition, two very different results. Mapping over a union of string
*literals* produces named properties; mapping over `string`, `number` or
`symbol` produces an **index signature** (07/02). That is why
`Record<string, T>` is the idiomatic way to write a dictionary, and why
`noUncheckedIndexedAccess` (03/02) then makes every lookup `T | undefined`.

`keyof any` is just `string | number | symbol` — the set of things that can be a
key. Written that way in the stdlib because it reads as "any key type".

## `Prettify` — what it actually does

```ts
type Prettify<T> = { [K in keyof T]: T[K] };
```

An identity mapped type: same keys, same values, same modifiers. It changes
nothing about which values are assignable. What it changes is the type's
**display and identity**:

```ts
type A = Omit<User, "email"> & { email?: string };  // shown as an intersection
type B = Prettify<A>;                               // shown as one flat object
```

`Equal<A, B>` is `false` — the strict equality check in `src/type-testing.ts`
compares types invariantly, and an intersection is not the same type as the
object it resolves to. Hence its use in TODO 4, and hence its presence in every
serious codebase under some name (`Simplify` in `type-fest`, `Compute` in
`ts-toolbelt`). The real day-to-day value is tooltips: `Prettify` is the
difference between an editor showing you the object and showing you the
algebra.

## The `Omit`-on-a-union trap

```ts
type Shape = { kind: "circle"; id: string; radius: number }
           | { kind: "square"; id: string; side: number };

Omit<Shape, "id">   // { kind: "circle" | "square" }   ← the union collapsed
```

`Omit` is not distributive: it takes `keyof Shape` — which for a union is only
the keys *common* to every member — and everything else is thrown away. Your
discriminated union quietly becomes one object with a union-typed discriminant,
and narrowing stops working.

This bites hardest in React prop types (`Omit<ButtonProps, "onClick">` where
`ButtonProps` is a union) and it is a favourite interview follow-up. The fix is
`DistributiveOmit`, which you build in 20/05.

## `Omit` at runtime

```ts
const { passwordHash: _passwordHash, ...rest } = user;
return rest;
```

Rest destructuring is the runtime counterpart of `Omit`, and the compiler types
`rest` as exactly the omitted shape. Two alternatives, both worse:

- `delete user.passwordHash` mutates the caller's object and, because `delete`
  only works on optional properties, does not typecheck anyway.
- Building `{ id: user.id, name: user.name, email: user.email }` by hand
  compiles and then silently leaks the next field somebody adds to `User` —
  or, worse, silently *drops* it.

## Common mistakes

| Mistake | What happens |
|---|---|
| `{ [P in keyof T]: T[P] }` for `MyPick` | Every key comes back; `K` is ignored |
| `K extends string` instead of `K extends keyof T` | Loses homomorphism and lets typos through |
| Using `Exclude` before writing it (20/03) | Fine — but know what it does |
| Forgetting `Prettify` in TODO 4 | Values assign correctly, `Equal<>` still fails |
| `Omit` on a discriminated union | The union collapses to its common keys |
| `delete` in `toPublicUser` | Mutates the caller and does not compile under `strict` |

## Interview angle

> *"Implement `Omit<T, K>`."*

Answer with the composition — `Pick<T, Exclude<keyof T, K>>` — because that is
what ships, then note you can also write it as a single key-remapping mapped
type. The follow-up you should volunteer: *"its constraint is `keyof any`, not
`keyof T`, so a typo compiles and removes nothing — which is why some codebases
wrap it in a strict version."*

> *"Why does `Omit` break my discriminated union?"*

Because it is not distributive: `keyof` a union gives only the shared keys, so
the members are flattened into one object. Say the fix out loud —
`T extends unknown ? Omit<T, K> : never` — and mention that the same
distribution rule is what makes `Exclude` work at all.
