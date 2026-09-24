# 08/01 — Generic functions

## What a generic is for

A type parameter **relates** types to each other:

```ts
function first<T>(items: readonly T[]): T | undefined
//               ^ input element                ^ output
```

`T` appears twice, connecting them. That connection is the entire value: pass
`string[]`, get `string | undefined`; pass `Item[]`, get `Item | undefined`.

Without it you would need one function per type, or `unknown` and a cast at
every call site.

## The "appears once" rule

> If a type parameter appears **only once** in a signature, delete it.

```ts
function totalLength<T extends { length: number }>(items: readonly T[]): number
//                   ^ appears once — relates nothing

function totalLength(items: readonly { length: number }[]): number
//                   honest: "a list of things with a length"
```

The generic version is not *wrong*, it is **noise** — it implies a relationship
that does not exist, and readers have to work out that there isn't one.

It is also subtly worse. In the generic form, `T` could be inferred as `string`
(strings have a `length`), so `totalLength("abc")`… actually still fails, since
the parameter is an array — but `totalLength(["ab"])` and
`totalLength([[1,2]])` both work in either version. The point stands: the
non-generic signature says exactly what it needs and nothing more.

This rule is from the TypeScript team's own guidance, and it is a fast way to
spot over-engineered code in review.

## One type parameter or several?

```ts
function pair<T>(a: T, b: T): [T, T];       // forces both to the same type
function pair<A, B>(a: A, b: B): [A, B];    // independent
```

With one parameter, `pair("a", 1)` infers `T = string | number` and you get
`[string | number, string | number]` — both positions lose their specific type.

Use separate parameters whenever the values are genuinely independent. Use one
when you *want* to force agreement — `function areEqual<T>(a: T, b: T): boolean`
deliberately rejects `areEqual("a", 1)`.

## How inference picks `T`

TypeScript infers from the **arguments**, matching the parameter type against
the argument type:

```ts
first([1, 2, 3]);   // readonly T[] vs number[]  ->  T = number
pair("a", 1);       // A vs string, B vs number
```

When several arguments imply different types for one parameter, it picks the
best common supertype — which is exactly why `pair<T>` would widen to a union.

**Explicit type arguments are usually a smell.** `identity<string>("a")` means
either inference failed (worth understanding why) or the code is over-specified.
Legitimate cases are rare: an empty array literal (`useState<Item[]>([])`),
where there is nothing to infer from.

## Contextual typing flows into callbacks

```ts
partition(["a", "bb"], (word) => word.length > 1);
//                      ^ inferred as string
```

Once `T` is fixed by the first argument, the predicate parameter `(item: T)`
gives `word` its type with no annotation. Left-to-right inference is why the
array argument comes first — swapping the parameters would break it.

## `readonly T[]` in the signature

`first(items: readonly T[])` accepts both mutable and readonly arrays, and
documents that nothing is mutated (02/02). Returning `T[]` from `partition` is
correct in the other direction: those are fresh arrays the caller owns.

## Common mistakes

| Mistake | What happens |
|---|---|
| `identity(value: any): any` | Compiles, relates nothing — the type assertions fail |
| `pair<T>(a: T, b: T)` | `pair("a", 1)` widens to `[string \| number, …]` |
| `first(): T` without `\| undefined` | Lies about the empty case |
| `predicate: (item: unknown) => boolean` | `word.length` will not compile in the caller's callback |
| Keeping the generic in TODO 5 | The `Parameters<>` assertion fails |
| `items.filter(p)` twice in `partition` | Correct, but two passes and two predicate calls per item |

## Interview angle

> *"When would you use a generic?"*

When a function's output type depends on its input type. Then give the rule that
shows judgement: **if a type parameter appears only once, it is not relating
anything — use a constraint or `unknown` instead.** That single sentence is
worth more than a definition, because it is the mistake most people make.

> *"What's the difference between `<T>(x: T) => T` and `(x: any) => any`?"*

`any` throws the type away and stops checking everything downstream. `T` carries
it through, so the caller keeps the exact type they passed in. Same call sites,
completely different safety.
