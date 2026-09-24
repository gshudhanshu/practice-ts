# 08/02 — Generic constraints

## `K extends keyof T` — the pattern to memorise

```ts
function pluck<T, K extends keyof T>(item: T, key: K): T[K] {
  return item[key];
}
```

Three things happen at once:

- `keyof T` produces the union of `T`'s keys, so an unknown key is a compile
  error at the call site.
- `K` captures **which** key was passed — not the whole union.
- `T[K]` is an indexed access type, so the return type follows that key.

Without capturing `K`, the return type would be `T[keyof T]` — the union of
*every* property type, which is exactly the imprecision you were trying to
avoid:

```ts
function bad<T>(item: T, key: keyof T): T[keyof T]
bad(user, "name");   // string | number | string[]  — useless
```

You will meet this shape constantly: `lodash.get`, form libraries binding to
field names, ORMs selecting columns, `Object.entries` wrappers.

## Constraining `T` instead of `T[K]`

TODO 3 needs "T has a property named K whose value is comparable". The natural
phrasing does not work well:

```ts
function sortByKey<T, K extends keyof T>(items: readonly T[], key: K): T[]
//    T[K] is unconstrained — you cannot compare it
```

Turn it around and constrain `T` through a `Record`:

```ts
function sortByKey<K extends PropertyKey, T extends Record<K, Comparable>>(
  items: readonly T[],
  key: K,
): T[]
```

Now `sortByKey(users, "tags")` fails, because `User` does not extend
`Record<"tags", Comparable>` — `tags` is a `string[]`. The error even names the
offending property.

Note the **parameter order**: `K` is declared first because `T`'s constraint
mentions it. Inference still works from the arguments in either direction, but
the declaration must be ordered so `K` exists when `T`'s constraint is read.

`PropertyKey` is the built-in `string | number | symbol` — the set of things
that can be an object key.

## Constraint vs callback — a real design choice

```ts
sortByKey(users, "age")                  // constrained by a KEY
maxBy(users, (user) => user.age)         // constrained by a CALLBACK
```

| | Key | Callback |
|---|---|---|
| Call site | shorter | slightly noisier |
| Typo safety | compile-checked key | n/a |
| Flexibility | one property only | any derived value |
| Works on | objects with that key | anything |

`maxBy(users, u => u.age * 2 - u.id)` is impossible with the key form. Library
APIs often provide both (lodash's `maxBy` accepts a key *or* a function) — via
overloads, from 07/03.

## Building a `Pick<T, K>` needs a cast — a known limitation

This exercise deliberately avoids `pickFields`, because it cannot be written
without an assertion:

```ts
function pickFields<T, K extends keyof T>(item: T, keys: readonly K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;      // unavoidable
  for (const key of keys) result[key] = item[key];
  return result;
}
```

TypeScript cannot track that a mapped type is "partially built" — the empty
object is not yet a `Pick<T, K>`, and there is no way to express "it will be by
the end of the loop". Every library does this with a cast.

Worth knowing so you recognise it as a genuine limitation rather than assuming
you are missing a trick. `pluckAll` avoids it entirely because `.map` produces a
finished array in one expression.

## `extends object` vs `extends {}` vs no constraint

```ts
function merge<A extends object, B extends object>(a: A, b: B): A & B
```

- `extends object` — any non-primitive. Rules out `string`, `number`, `boolean`.
- `extends {}` — anything **except** `null` and `undefined`. Primitives pass,
  because they box.
- no constraint — anything at all, including `null`.

`object` is the right choice for something that spreads its arguments.
(Spreading a primitive is legal JavaScript but produces `{}`, silently losing
the value — exactly the bug the constraint prevents.)

Returning `A & B` is a small lie worth knowing about: on a key clash the runtime
value is `b`'s, but the type says `A & B`, so a clashing property is typed as the
intersection of both. For `merge({a: 1}, {a: 2})` that is fine (`number`), but
`merge({a: 1}, {a: "x"})` types `a` as `never`. Libraries solve this with
`Omit<A, keyof B> & B`.

## Common mistakes

| Mistake | What happens |
|---|---|
| `key: keyof T` without capturing `K` | Return type is the union of all property types |
| `sortByKey<T, K extends keyof T>` | `T[K]` is unconstrained; the comparison will not compile |
| `items.sort(...)` without copying | Mutates the caller's array |
| `String(a) < String(b)` for numbers | `"10" < "9"` — numeric order breaks |
| `>=` in `maxBy` | Returns the last of a tie, not the first |
| `bestScore` starting at `0` | Wrong for all-negative scores; use `-Infinity` or the `undefined` check |
| `merge<A, B>` with no constraint | Primitives are accepted and silently vanish when spread |

## Interview angle

> *"Write a type-safe `get(object, key)`."*

`<T, K extends keyof T>(obj: T, key: K): T[K]`. Then explain what each piece
buys: `keyof T` rejects unknown keys, capturing `K` (rather than using
`keyof T` directly in the parameter) is what makes the return type follow the
specific key. That second half is the part most candidates miss.

> *"How would you constrain a generic to objects that have a numeric `id`?"*

`<T extends { id: number }>`. Then the more interesting version — constraining
through a `Record` when the key itself is a type parameter, as in `sortByKey`.
Being able to write that shows you have gone past the basics.
