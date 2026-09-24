# Section 21 — Type challenges

Deliberate practice at type-level programming, in the style of
[type-challenges](https://github.com/type-challenges/type-challenges).

Section 10 taught the mechanics — mapped types, conditionals, `infer`, template
literals, recursion. Section 20 rebuilt the standard library with them. This
section is the gym: six sets of katas at rising difficulty, each one a type you
could plausibly be asked to write on a whiteboard.

**Read this before you start.** Type-level programming is a **skill-sharpener**,
not a style. Most production code should not look like this: it is slow to
compile, hard to debug (there is no `console.log` for types), and a colleague at
2am will not enjoy it. What it buys you is the ability to *read* the types inside
the libraries you depend on, and the judgement to reach for a smaller version of
the same trick where it genuinely pays:

- **library and framework APIs** — `zod`'s inferred output types, `tRPC`'s
  end-to-end signatures, an event emitter that knows its own event names;
- **route typing** — extracting `:params` from a path so `navigate()` cannot be
  called with a missing key;
- **ORM field selection** — `select("id, name")` returning exactly
  `{ id: string; name: string }`;
- **fixed-arity and unit-safe APIs** — tuple lengths, `curry`, matrix sizes.

Everywhere else, a runtime validator and a plain interface will serve you
better. Each exercise's explanation says where its trick is worth shipping and
where it is not.

| # | Exercise | Tier | Time | Covers |
|---|---|---|---|---|
| 01 | [Tuple basics](01-tuple-basics/) | Core | 25 min | `Length`, `Head`, `Tail`, `Last`, `Push`, `Unshift`; variadic patterns, `const` type parameters |
| 02 | [Union tricks](02-union-tricks/) | Core → Challenge | 35 min | `IsAny`, `IsUnknown`, `IsUnion`, `UnionToIntersection`, `UnionToTuple`; **contravariance** |
| 03 | [String manipulation](03-string-manipulation/) | Core → Challenge | 35 min | `Trim`, `Split`, `Join`, `Replace`, `KebabCase`; recursive template literals |
| 04 | [Object transformations](04-object-transformations/) | **Challenge** | 40 min | `OptionalKeys`, `PickByValue`, `Merge`, `RequireAtLeastOne`; the `{} extends Pick<T, K>` trick |
| 05 | [Arithmetic & recursion](05-arithmetic-and-recursion/) | **Challenge** | 40 min | `BuildTuple`, `Add`, `Subtract`, `GreaterThan`, `Range`; **recursion limits**, tail-call elimination |
| 06 | [A mini parser](06-mini-parser/) | **Challenge** | 45 min | Type-level query-string parser paired with its runtime twin |

**Run one:** `npm run check 21/04` · **Run the section:** `npm run check 21`

Every exercise is mostly type-level, so the `Expect<Equal<…>>` assertions *are*
the specification — but each one also ships a runtime function, and several
assert that the type and the value agree on the same input. That pairing is the
point: a type-level `Split` is only interesting next to a runtime `split` that
computes the same answer.

## What to take away

- **Head/tail recursion is the only loop there is.** `[infer H, ...infer R]` for
  tuples, `` `${infer H}${infer R}` `` for strings. Match the head, emit
  something, recurse on the tail, stop at a base case.
- **A tuple knows its own length**, and that literal is the whole of type-level
  arithmetic. `Add` is concatenation; `Subtract` is a prefix match.
- **Distribution is a tool, not an accident.** `[T] extends [U]` turns it off;
  `<T, U = T>` lets you compare a distributed member against the whole union.
- **`infer` in parameter position intersects; in return position it unions.**
  That one sentence explains `UnionToIntersection` and the overload trick behind
  `UnionToTuple`.
- **`{} extends Pick<T, K>`** is the only reliable way to ask whether a property
  is optional — `undefined extends T[K]` answers a different question.
- **`Prettify<T> = { [K in keyof T]: T[K] }`** (20/02) costs nothing and makes
  every derived object type readable. Use it at the top of anything built from
  intersections.
- **Know the ceilings.** On this repo's compiler: ~1,000 levels of
  tail-recursive instantiation, **48** without tail-call elimination, and
  100,000 members in a union. These are hard errors, not slowdowns.
- **One contained cast beats a vague signature.** A deferred conditional return
  type cannot be checked from inside a generic function; contain the assertion to
  one commented line and keep the public API precise.

## Interview questions this section prepares you for

- Implement `Length`, `Head` and `Last` for a tuple type.
- What is the difference between a tuple type and an array type?
- Explain how `UnionToIntersection` works. *(The contravariance answer — 21/02.)*
- How would you detect an accidental `any` in a type test?
- Write a type that splits a string literal on a delimiter.
- How do you find the optional keys of a type?
- Type an options object where at least one of two fields must be present.
- Can TypeScript's type system do arithmetic? What are the limits?
- What is tail-recursion elimination in conditional types, and why does it exist?
- **How does `zod` (or a typed router) know the shape of what it returns?**
  *(21/06 is the full answer.)*
- When would you *not* write types like these?
