# 02/02 — Object & Array Types

## Why each answer is what it is

### `readonly string[]` vs `string[]`

`readonly T[]` is shorthand for `ReadonlyArray<T>`. It removes the mutating
methods (`push`, `pop`, `splice`, `sort`, `reverse`) and blocks index assignment
— all at compile time, with **zero runtime cost**. It is not deep: the *array*
is protected, the objects inside it are not.

```ts
const b: Book = { /* … */ tags: ["scifi"] };
b.tags.push("x");   // compile error
b.tags = ["x"];     // still legal — the property itself is not readonly
```

To lock the property too, you would write `readonly tags: readonly string[]`.

### Optional properties and `exactOptionalPropertyTypes`

`publishedYear?: number` gives the property type `number | undefined`. But this
repo enables `exactOptionalPropertyTypes`, which draws a distinction most people
never learn:

```ts
const a: Book = { ...base };                            // absent          OK
const b: Book = { ...base, publishedYear: 1965 };       // present         OK
const c: Book = { ...base, publishedYear: undefined };  // explicit undef  ERROR
```

"Absent" and "explicitly `undefined`" are different states. Without the flag TS
conflates them, which is exactly how `{ retries: undefined }` silently clobbers
a default inside a config-merge function. If you genuinely want to allow both,
say so explicitly: `publishedYear?: number | undefined`.

### Accept `readonly Book[]`, return `Book[]`

Assignability runs one way: `Book[]` is assignable to `readonly Book[]`, but not
the reverse. So a parameter typed `readonly Book[]` accepts strictly more
callers than one typed `Book[]`, while *also* documenting that the function will
not mutate its input.

The return type stays `Book[]` because `.map` and `.filter` build brand-new
arrays that the caller owns and may freely mutate.

### `noUncheckedIndexedAccess` — the flag doing the real teaching here

Without it, TypeScript lies to you:

```ts
const first = books[0];  // claims `Book` even when books is empty
first.title;             // runtime TypeError, zero compile errors
```

With it on, `books[0]` is `Book | undefined` and `grouped[author]` is
`Book[] | undefined`. `firstBook` then simply returns what it actually has, and
`groupByAuthor` narrows with `if (bucket)` instead of asserting.

This flag is **not** part of `strict`. Turning it on is one of the
highest-value config changes available to a real codebase, and knowing that is a
genuinely strong signal in an interview.

## Common mistakes

| Mistake | What happens |
|---|---|
| `tags: string[]` | `Equal<Book["tags"], readonly string[]>` fails, and the `push` line stops erroring |
| `titlesOf(books: Book[])` | `_titlesParam` fails; readonly callers are rejected |
| `firstBook(): Book` with `return books[0]!` | Type assertion fails, and the empty-array test throws |
| `grouped[author].push(book)` | Compile error — the value is possibly `undefined` |
| `grouped[author]!.push(...)` | Compiles, then crashes on the first book of each author |
| Building `titlesOf` with `forEach` + a local array | Works, but `.map` is the idiom a reviewer expects |

## Interview angle

> *"What is the difference between `readonly T[]` and `Readonly<T>`?"*

`readonly T[]` (= `ReadonlyArray<T>`) applies to arrays and removes the mutating
methods. `Readonly<T>` is a mapped type that marks every property of an object
type `readonly`. Both are **shallow**, and both vanish at runtime — if you need
real immutability you still need `Object.freeze` or a persistent-data-structure
library.

> *"Why prefer `readonly` parameters?"*

Two payoffs: it widens what you accept, and it turns "this function does not
mutate my array" from a comment into a compiler-enforced contract. Cheap to
adopt, and it catches a real class of aliasing bug.
