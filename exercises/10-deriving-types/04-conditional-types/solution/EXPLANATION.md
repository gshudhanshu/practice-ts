# 10/04 — Conditional types & `infer`

## `infer` binds a type out of a pattern

```ts
type ElementOf<T> = T extends readonly (infer E)[] ? E : never;
```

`infer E` sits **where the type you want appears**. If the pattern matches, `E`
is bound to what was in that slot and the true branch can use it.

The standard library is built from this:

```ts
type ReturnType<T> = T extends (...args: any) => infer R ? R : any;
type Parameters<T> = T extends (...args: infer P) => any ? P : never;
type Awaited<T>    = T extends Promise<infer U> ? Awaited<U> : T;
```

Note `readonly (infer E)[]` rather than `(infer E)[]` — the readonly form
matches both, because `string[]` is assignable to `readonly string[]` but not
the reverse (02/02).

## Distribution — the big one

A conditional type over a **naked** type parameter runs once per union member:

```ts
type Distributed<T> = T extends unknown ? T[] : never;
Distributed<string | number>;   // string[] | number[]
```

The compiler splits the union, applies the conditional to each part, then unions
the results. Turn it off by wrapping **both** sides in a tuple:

```ts
type Collected<T> = [T] extends [unknown] ? T[] : never;
Collected<string | number>;     // (string | number)[]
```

"Naked" means `T` appears alone on the left — not `T[]`, not `[T]`, not
`Promise<T>`. Wrapping only one side does not work.

Distribution is a **feature**, not a quirk: it is exactly how `Exclude` works.

```ts
type Exclude<T, U> = T extends U ? never : T;
Exclude<"a" | "b" | "c", "c">;   // "a" | "b" — each member tested separately
```

Without it, `"a" | "b" | "c" extends "c"` would be false as a whole and nothing
would be filtered.

### Two distribution gotchas

**`never` distributes over nothing.**

```ts
type IsNever<T> = T extends never ? true : false;
IsNever<never>;   // never (!) — not true
```

`never` is the empty union, so there are zero members to distribute over and the
result is `never`. This is why `src/type-testing.ts` defines
`IsNever<T> = [T] extends [never] ? true : false` — the tuple wrapper stops
distribution and gives the answer you meant.

**`boolean` is a union.**

`boolean` is `true | false` internally, so a distributive conditional splits it
in two. That is usually harmless and occasionally baffling.

## Recursion

```ts
type DeepAwaited<T> = T extends Promise<infer U> ? DeepAwaited<U> : T;
```

Each application peels one layer; the false branch is the base case.
TypeScript allows this and enforces a depth limit (around 50 for
non-tail-recursive cases, ~1000 for tail-recursive since 4.5) so a runaway type
errors rather than hanging the compiler.

The real `Awaited<T>` is more careful — it handles thenables, `null`/`undefined`
and non-promise objects with a `.then`. Bonus section 20 rebuilds it properly.

## Deferred conditionals — TODO 5's trap

```ts
function firstElement<T extends readonly unknown[]>(items: T): ElementOf<T> | undefined {
  return items[0];   // Error: 'unknown' is not assignable to 'ElementOf<T> | undefined'
}
```

Inside the function body, `T` is still an unresolved type parameter, so
`ElementOf<T>` is a **deferred** conditional — the compiler cannot evaluate it,
and therefore cannot prove anything is assignable to it. It resolves fine at
every *call site*; it just cannot be checked from inside.

The fix is to use a form that needs no evaluation:

```ts
function firstElement<T extends readonly unknown[]>(items: T): T[number] | undefined
```

`T[number]` is an indexed access — resolvable structurally, and identical to
`ElementOf<T>` for every array. This is the general workaround: **prefer indexed
access to a conditional when the type appears in a generic function's
signature**, or accept a single cast at the return.

Hitting this is a rite of passage. Recognising it as "deferred conditional"
rather than "TypeScript is broken" is what the exercise is for.

## Common mistakes

| Mistake | What happens |
|---|---|
| `(infer E)[]` without `readonly` | `ElementOf<readonly number[]>` fails |
| `[T] extends [unknown]` for `Distributed` | No distribution — the union stays whole |
| `T extends unknown` for `Collected` | Distributes — you get `string[] \| number[]` |
| Wrapping only one side in a tuple | Distribution is still on |
| `T extends never ? … : …` to detect never | Yields `never`, not `true` |
| `ElementOf<T>` as a return type in TODO 5 | Deferred conditional — will not compile |

## Interview angle

> *"What is a distributive conditional type?"*

A conditional over a naked type parameter applies once per union member. Give
`Exclude<T, U> = T extends U ? never : T` as the reason it exists — filtering a
union depends on it entirely. Then show you know how to switch it off with the
`[T] extends [U]` tuple trick.

> *"Implement `ReturnType` yourself."*

`T extends (...args: any) => infer R ? R : any`. A strong follow-up is the
`never`-parameter quirk from 02/06: `ReturnType` silently yields `any` when the
function has a `never` parameter, because `any` is not assignable to `never` and
the conditional falls through to its false branch.
