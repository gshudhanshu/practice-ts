# 05/05 — Array pipelines

## Compose small functions, don't repeat the rule

Every TODO after the first calls `activeOrders`. That is not laziness — it is
the point. "Cancelled orders don't count" is a **business rule**, and it lives
in exactly one function. When someone adds a `"refunded"` status next quarter,
there is one line to change instead of five places to find.

The alternative — repeating `order.status !== "cancelled"` in each function — is
how a codebase ends up with three subtly different definitions of "active".

## `flatMap` vs `map().flat()`

```ts
orders.flatMap((order) => order.items);   // OrderItem[]
orders.map((o) => o.items).flat();        // same result, two passes
```

`flatMap` maps and flattens **one level** in a single traversal, with no
intermediate array. It is also the idiomatic "expand each element into zero or
more" tool — returning `[]` from the callback drops an element entirely, which
makes it a filter-and-map in one:

```ts
items.flatMap((item) => (item.qty > 0 ? [item] : []));
```

It flattens exactly one level, always. For deeper nesting you still need
`.flat(n)`.

## When `reduce` is the right tool — and when it is not

`reduce` is right when you are **collapsing a list into a single value**:
`totalRevenue` is a textbook case.

It is the wrong tool when the accumulator is an object you keep mutating:

```ts
// Clever, harder to read, and allocates a new object per element:
items.reduce((acc, item) => ({ ...acc, [item.sku]: … }), {});

// Or mutating, which most linters flag:
items.reduce((acc, item) => { acc[item.sku] = …; return acc; }, {});
```

`skuQuantities` uses a plain `for...of` loop over the flattened items instead.
It is more readable, and the spread version is O(n²) because it copies the whole
accumulator on every element — a real performance bug that looks elegant.

Rule of thumb: `reduce` to a **primitive**, loop to an **object**. Or reach for
`Object.groupBy` / `Map.groupBy` (ES2024) when your runtime has them.

## Mutating vs non-mutating array methods

The ones that **mutate in place** and are easy to call by accident:

`sort` · `reverse` · `splice` · `push` · `pop` · `shift` · `unshift` · `fill` · `copyWithin`

The non-mutating counterparts added in ES2023 (Node 20+, all modern browsers):

`toSorted` · `toReversed` · `toSpliced` · `with`

```ts
orders.sort(…)          // reorders the CALLER's array
[...orders].sort(…)     // safe, works everywhere
orders.toSorted(…)      // safe, modern
```

In the solution, `.sort()` is called on the array produced by `.map()`, so it is
already a private copy — safe. That is a distinction worth being deliberate
about rather than lucky with. (This is also why `readonly T[]` parameters are
useful: `readonly` arrays do not have `sort` at all, so the compiler catches the
mistake for you.)

## Guard before dividing

```ts
if (active.length === 0) return 0;
return Math.round(total / active.length);
```

`0 / 0` is `NaN`, and `NaN` propagates silently through every subsequent
arithmetic operation and comparison (`NaN === NaN` is `false`). One guard beats
debugging a report that says `NaN` three screens later.

## The performance question

"Doesn't chaining `filter().map().sort()` traverse the array multiple times?"

Yes — each link is a separate pass, and each allocates a new array. For the
sizes you meet in application code (thousands of rows) this is irrelevant, and
readability wins comfortably.

It starts to matter at hundreds of thousands of elements or in a hot loop, and
then the answers are: a single `for...of` doing all the work, or a lazy
iterator/generator pipeline that fuses the passes.

The right interview answer is that sentence — **know the trade-off, default to
readable, optimise when measured.** Reaching for the manual loop first is
premature; not knowing why anyone would is a gap.

## Common mistakes

| Mistake | What happens |
|---|---|
| Repeating the cancelled check in each function | Works, but the rule now lives in five places |
| `orders.sort(…)` directly | Reorders the caller's array |
| Spreading the accumulator in `reduce` | O(n²); correct but quadratic |
| Forgetting `limit <= 0` | `.slice(0, 0)` happens to work, `.slice(0, -1)` does not |
| No empty guard in TODO 5 | `NaN` instead of `0` |
| `a.totalCents - b.totalCents` | Ascending; the ranking test fails |
| Omitting the name tie-break | Order becomes input-dependent |

## Interview angle

> *"Given a list of orders, get me the top 3 customers by spend."*

This is TODO 4 verbatim, and it is a genuinely common screening question. Say
the three phases out loud as you write them — accumulate, transform, sort —
then mention the tie-break unprompted. Handling ties without being asked is a
strong signal, because it shows you think about determinism.

> *"`map`/`filter`/`reduce` or a `for` loop?"*

Chained methods by default: clearer intent, no index bookkeeping, no accidental
mutation. Switch to a loop when you need early exit (`some`/`find` cover the
common cases), when you are building an object accumulator, or when profiling
says the extra passes matter.
