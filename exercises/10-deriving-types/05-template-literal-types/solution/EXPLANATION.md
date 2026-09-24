# 10/05 — Template literal types

## Building strings

```ts
type Handler = `on${Capitalize<T>}`;
type HttpsUrl = `https://${string}`;
type Pixels = `${number}px`;
```

`${string}` and `${number}` are wildcards — they match any string or any numeric
literal. `${number}` includes negatives and decimals, which is why `"-4px"`
passes.

The four intrinsic helpers — `Uppercase`, `Lowercase`, `Capitalize`,
`Uncapitalize` — are implemented in the compiler itself, not in TypeScript.

Template literal types **distribute over unions** automatically:

```ts
EventHandlerName<"click" | "focus">;   // "onClick" | "onFocus"
```

Each member is substituted separately, which is why no conditional is needed.

## Taking strings apart

```ts
type RouteParams<T extends string> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? Param | RouteParams<Rest>
    : T extends `${string}:${infer Param}`
      ? Param
      : never;
```

Two patterns plus recursion:

1. **A parameter with more path after it.** `infer Rest` captures the remainder
   and the type recurses on it.
2. **A parameter at the end.** Capture and stop.
3. **No parameters.** `never`.

### Why the order matters

Check case 1 first. If case 2 came first, `` `${string}:${infer Param}` `` would
match `"/users/:userId/posts/:postId"` with `Param = "userId/posts/:postId"` —
the trailing wildcard swallows everything.

### How the split point is chosen

For `` `${string}:${infer Param}/${infer Rest}` ``, TypeScript matches the
leading `${string}` **lazily** (shortest first) and later placeholders greedily
enough to satisfy the rest of the pattern. So on
`"/users/:userId/posts/:postId"` it binds `Param = "userId"` and
`Rest = "posts/:postId"`, then recursion handles the tail.

Getting a feel for that is mostly experimental — hover the type and read what
came out.

## The type and the runtime doing the same job

`RouteParams<T>` and `pathParamNames(path)` compute the same answer at different
times, which is the shape of every typed router:

```ts
type Params = RouteParams<"/users/:id">;          // compile time: "id"
pathParamNames("/users/:id");                     // runtime: ["id"]
```

The type version lets `navigate("/users/:id", { id: "1" })` reject a missing or
misspelled key before the code runs. The runtime version does the actual
substitution. The test asserts the two agree — which is exactly the invariant
that would break if someone edited one and not the other.

## Combinatorial explosion — the real limit

Template literal types multiply:

```ts
type Size = "sm" | "md" | "lg";
type Colour = "red" | "green" | "blue";
type Class = `${Size}-${Colour}`;   // 9 members

// three unions of 50 -> 125,000 members
```

TypeScript caps a union at **100,000** members and errors with "Expression
produces a union type that is too complex to represent". Tailwind-style class
typing hits this constantly, which is why those libraries validate with a
pattern (`` `${string}-${string}` ``) rather than enumerating.

Recursion has its own limit: roughly 50 levels for non-tail-recursive
conditionals, ~1000 for tail-recursive ones (TS 4.5+). A path with 50 segments
would break `RouteParams` — acceptable, and worth knowing before you design
something that recurses per character.

## Common mistakes

| Mistake | What happens |
|---|---|
| Checking the end-of-path pattern first | `Param` swallows the rest of the string |
| `` `${string}:${infer P}` `` only | Only the last parameter is found |
| Forgetting `/g` on the regex | `matchAll` throws a TypeError |
| `match[1]!` | Compiles, but asserts where narrowing is free |
| `Capitalize<T>` without `T extends string` | `Capitalize` rejects a non-string parameter |
| `` `${number}px` `` written as `` `${Number}px` `` | `Number` is the interface, not the primitive |

## Interview angle

> *"How do typed routers know the parameters of a path?"*

Template literal types with `infer` and recursion — exactly TODO 4. Then the
detail that shows depth: the pattern with trailing path must be tested **before**
the end-of-string pattern, or the wildcard swallows everything.

> *"What are the limits of template literal types?"*

Union size (capped at 100,000 members — easy to hit when composing several
unions) and recursion depth. That is why libraries typing CSS classes validate
with a pattern rather than enumerating every combination. Naming a concrete
failure mode is much stronger than saying "they can get slow".
