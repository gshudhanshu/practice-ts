# 10/06 — Typed deep paths

## The "mapped type indexed by `keyof`" idiom

```ts
type ChangeEvent<T> = { [K in keyof T]: { key: K; value: T[K] } }[keyof T];
```

Two steps that always go together:

1. The mapped type builds an object whose **values** are the union members you
   want: `{ count: {key:"count"; value:number}, darkMode: {…}, … }`.
2. Indexing it with `[keyof T]` collapses that object into the **union of its
   value types**.

The object is pure scaffolding — it never exists as a type you use. This is
*the* way to turn "one thing per property" into a union, and once you can see
it, a lot of library type code stops looking like magic.

The result is a genuine discriminated union, so `describeChange` narrows on
`event.key` exactly like a hand-written one (02/04) — but adding a field to
`AppState` extends it automatically, and `assertNever` then fails to compile
until you handle the new case.

## `Paths<T>`

```ts
type Paths<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? K | `${K}.${Paths<T[K]>}`
        : K;
    }[keyof T & string]
  : never;
```

The same idiom, recursively. Per key:

- **object value** → contribute both `K` *and* every path beneath it, prefixed.
- **anything else** → contribute just `K`.

`& string` twice, because template literals reject `number | symbol` keys, and
the collapsing index must match the mapped type's key set.

### Caveats worth knowing

This is a teaching version, not a library-grade one:

- **Arrays** are objects, so `Paths<{ items: string[] }>` recurses into array
  methods and produces nonsense. Real implementations special-case
  `readonly unknown[]` and emit `` `items.${number}` ``.
- **Optional properties** come through, but the path does not record that the
  value may be `undefined`.
- **Recursive types** (a tree with `children: Node[]`) blow the depth limit.
- **`Date`, `Map`, class instances** all match `extends object` and get walked.

Library versions (`ts-toolbelt`, `type-fest`) handle these and are correspondingly
much longer. Knowing *which* cases break is the useful part.

## `ValueAt<T, P>`

```ts
type ValueAt<T, P extends string> =
  P extends `${infer Head}.${infer Rest}`
    ? Head extends keyof T ? ValueAt<T[Head], Rest> : never
    : P extends keyof T ? T[P] : never;
```

Split on the **first** dot, take that key, recurse on the remainder. Both
branches need the `extends keyof T` guard — without it an invalid path would
error instead of resolving to `never`, and `ValueAt<AppState, "nope">` would not
be checkable.

Note it mirrors `getPath`'s loop exactly: one segment at a time, following the
structure down. The type and the runtime doing the same walk.

## The one cast, and why it is unavoidable

```ts
return current as ValueAt<T, P>;
```

Inside the function `T` and `P` are unresolved, so `ValueAt<T, P>` is a
**deferred conditional** (10/04). The compiler cannot evaluate it and therefore
cannot verify `current` against it — even though it resolves perfectly at every
call site.

What makes this acceptable rather than sloppy:

- The **public signature is exact** — `P extends string & Paths<T>` rejects any
  invalid path before the function is even entered.
- Everything before the return is properly narrowed with `isRecord`.
- The unsafety is one line, and it is the line the type system cannot express.

Same shape as the store cast in 08/05. That is the pattern: **contain it, do not
spread it.**

`string & Paths<T>` in the constraint is what allows `path.split(".")` — a bare
`P extends Paths<T>` is deferred and carries no string methods.

## Where this pattern is used for real

- `lodash.get` / `_.set` typings
- form libraries (`react-hook-form`'s `name="user.address.city"`)
- i18n key checking
- ORM field selection and `orderBy` clauses
- config readers with dotted keys

Every one of them is `Paths<T>` plus `ValueAt<T, P>`.

## Common mistakes

| Mistake | What happens |
|---|---|
| Forgetting `[keyof T]` after the mapped type | You get an object, not a union |
| `keyof T` without `& string` | Template literal rejects `number \| symbol` |
| `Paths` contributing only the nested paths | `"user"` itself goes missing |
| `ValueAt` without the `extends keyof T` guards | Invalid paths error instead of yielding `never` |
| Splitting on the **last** dot | Recursion walks the wrong way |
| `P extends Paths<T>` without `string &` | `path.split` does not compile |
| Casting inside the loop instead of at the return | More unsafety than necessary |

## Interview angle

> *"How would you type `lodash.get`?"*

`Paths<T>` for the key and `ValueAt<T, P>` for the return, and say the two
idioms out loud: a mapped type indexed by `keyof` to build the union, and a
template-literal split with recursion to walk it. Then the honest part —
arrays and recursive types need special handling, and the implementation needs
one cast because the conditional is deferred.

> *"Isn't that cast a code smell?"*

It is a *contained* one. The public signature rejects invalid paths, the body is
otherwise fully narrowed, and the cast sits on the single line where the type
system genuinely cannot follow. Being able to distinguish that from a cast used
to silence an inconvenient error is the actual judgement being tested.
