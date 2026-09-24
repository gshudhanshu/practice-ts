# 05/01 — Destructuring & default values

## Tuple vs array destructuring

This is the detail worth taking away:

```ts
const pair: [string, number] = ["a", 1];
const [text, value] = pair;      // string, number      — exact

const words: string[] = ["a", "b"];
const [head] = words;            // string | undefined  — the array might be empty
```

A **tuple** has a known length, so the compiler can give each position an exact
type. An **array** has an unknown length, so under `noUncheckedIndexedAccess`
every destructured element is possibly `undefined`.

That is exactly why `headAndRest` returns `first: string | undefined` while
`swap` returns a clean `[number, string]`. The types are simply reporting what
is knowable.

The rest element behaves differently from the head: `...rest` is always an
array — `string[]`, never `undefined` — and is `[]` when nothing remains.

## Where the default fires

```ts
const { title = "friend" } = user;
```

The default applies when the property is **absent or explicitly `undefined`**.
It does **not** apply to `null`, `0`, `""` or `false`:

```ts
const { count = 10 } = { count: 0 };      // 0     — default not used
const { name = "x" } = { name: null };    // null  — default not used
```

So a destructuring default is `??`-like, not `||`-like. Same nullish-vs-falsy
distinction as 02/04, in different clothing.

Inside the body the local's type has `undefined` removed — `title` is `string`,
not `string | undefined`. That is why no further guard is needed.

## Nested defaults, read inside-out

```ts
function locationOf({
  address: { city = "unknown", country = "unknown" } = {},
}: User): string
```

Three things happen in that one line:

1. `address: { … }` — read `address` and destructure it (rename-position syntax,
   but with a pattern instead of a name).
2. `= {}` — if `address` is absent, destructure `{}` instead. **Without this the
   function throws** on `{ name: "Ada" }`, because you cannot destructure
   `undefined`.
3. `city = "unknown"` — and if that object has no `city`, use the fallback.

It is dense. Two levels is about the limit before `?.` and `??` read better:

```ts
const city = user.address?.city ?? "unknown";
```

Both are correct. Prefer the destructuring form when you need several fields
from the same object; prefer optional chaining for one deep read.

## Renaming: `{ x: longitude }`

```ts
const { x: longitude } = point;   // renaming — longitude is a new local
const point: { x: number } = …;   // annotating — x has type number
```

Same punctuation, opposite meaning, one line apart. The rule: inside a
**pattern** (left of `=`, or a parameter's binding position) the colon renames;
inside a **type** it annotates.

## Common mistakes

| Mistake | What happens |
|---|---|
| `title ?? "friend"` in the body | Works, but the exercise asks for the pattern default |
| Destructuring `address` with no `= {}` | Throws for a user with no address |
| Expecting a default to fire on `null` | It does not — only absent/`undefined` |
| `const [first, ...rest] = values` then treating `first` as `string` | Compile error — it is `string \| undefined` |
| `{ longitude: x }` in TODO 4 | Backwards: that reads property `longitude` and binds `x` |

## Interview angle

> *"What does `const { a = 1 } = obj` do when `obj.a` is `null`?"*

`a` is `null`. Defaults fire on `undefined` only. People reliably get this wrong,
and it is the same family as the `??` vs `||` question — which is why both keep
appearing.

> *"Why does destructuring an array give `T | undefined` but a tuple doesn't?"*

Because the tuple's length is part of its type. Good follow-on: this is one of
the clearest everyday payoffs of using tuples for fixed-size data instead of
arrays — you stop needing guards the compiler cannot otherwise skip.
