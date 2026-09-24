# 09/01 — A typed collection

## Class parameter vs method parameter

```ts
class Collection<T> {              // T — what this collection holds
  map<U>(transform: (item: T) => U): Collection<U>   // U — this call's result
  reduce<U>(fold: (acc: U, item: T) => U, seed: U): U
}
```

`T` describes the instance; `U` is fresh per call. Getting this split right is
the whole design:

- `filter` returns `Collection<T>` — same element type.
- `map` returns `Collection<U>` — a **different** one.

If `U` were on the class, every `map` would have to return the same type, and
the class would need two parameters for no reason (08/03).

`reduce<U>` shows the same idea with `U` fixed by the *seed* rather than the
callback — which is why `reduce<string[]>(…, [])` needs the explicit argument:
an empty array literal gives inference nothing to work from.

## Three copies, three different reasons

Immutability is not one decision, it is three:

```ts
static from<T>(items) { return new Collection([...items]); }   // 1
toArray(): T[] { return [...this.#items]; }                    // 2
sort(compare) { return new Collection([...this.#items].sort(compare)); }  // 3
```

1. **Copy the input.** Otherwise `const source = [1,2]; Collection.from(source);
   source.push(3);` changes the collection from the outside.
2. **Copy the output.** Otherwise a caller mutating the returned array mutates
   your storage.
3. **Copy before sorting.** `.sort()` mutates in place, so without the copy it
   would reorder the array `#items` points at.

Each has its own test, because each is a separate real bug. `filter` and `map`
need no copy — they already allocate.

## Private constructor + static factory

```ts
private constructor(items: readonly T[]) { … }
static from<T>(items: readonly T[]): Collection<T> { … }
```

From 06/02: the factory is the only entry point, so the defensive copy cannot be
skipped and internal methods can construct freely without re-copying.

Note that `from` declares its **own** `T` — a static method has no access to
the class's type parameter, because there is no instance to get it from.

## The chaining pattern

```ts
Collection.from(users)
  .filter((user) => user.age >= 25)
  .sort(byAge)
  .map((user) => user.name)
  .take(2)
  .toArray();
```

Each method returns a new `Collection`, so calls compose and the types flow —
after `.map`, the chain is a `Collection<string>` and `.filter` narrows on
strings.

This is the same shape as `Array.prototype` methods, lodash chains and RxJS
pipelines. The cost is an allocation per step; the benefit is that no
intermediate state is shared, so nothing can be corrupted mid-chain. For large
data you would reach for a lazy/iterator version that fuses the passes (05/05).

## `readonly #items` — two guarantees, not one

```ts
readonly #items: readonly T[];
```

- `readonly` on the **field**: the reference cannot be reassigned.
- `readonly T[]` on the **type**: the array cannot be mutated through it.

You want both, and they are independent. `#` on top makes it genuinely private
at runtime (06/01).

## Common mistakes

| Mistake | What happens |
|---|---|
| `map<U>` returning `Collection<T>` | The element type stops changing; assertions fail |
| `U` declared on the class | Every `map` is forced to one result type |
| `from` storing the array directly | Mutating the source changes the collection |
| `toArray` returning `#items` | Callers can mutate your storage |
| `sort` without copying | Reorders the collection in place |
| `take(-1)` unclamped | `.slice(0, -1)` drops the last element instead of returning none |
| Public constructor | The `@ts-expect-error` on `new Collection(…)` stops erroring |

## Interview angle

> *"Design an immutable collection wrapper."*

Lead with the `map<U>` signature, because it is the part that shows you
understand generics rather than just syntax. Then the three copies and *why each
one exists* — that is the answer that sounds like production experience rather
than a tutorial.

> *"What does this cost?"*

An allocation per chained call. Fine for typical application data; for large
datasets or hot paths you would use a lazy iterator pipeline so the passes fuse
into one. Knowing the trade-off, and not pre-optimising for it, is the point.
