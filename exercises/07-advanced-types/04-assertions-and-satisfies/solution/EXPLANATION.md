# 07/04 — `as`, `satisfies` and `as const`

## Three operators, three jobs

```ts
const a = "#fff" as ColorValue;                    // ASSERTION
const b = { primary: "#fff" } satisfies Theme;     // CHECK
const c = ["/", "/about"] as const;                // CONST ASSERTION
```

Only the first one reduces safety. The other two increase it, despite the shared
`as` keyword in one of them.

## The problem `satisfies` solves

Before TS 4.9 you had to choose:

```ts
const PALETTE = { primary: "#0055ff" };
//    inferred, narrow — but NOT checked. "red" would compile.

const PALETTE: Theme = { primary: "#0055ff" };
//    checked — but keyof is now `string` and the value is `ColorValue`.
```

Annotating **checks and widens**: the variable takes the annotated type, and the
narrower inference is discarded. That is fine for a `string` but destroys
everything for a config object — you lose autocomplete on the keys, and typos in
`PALETTE.primry` become legal because the index signature admits any string.

`satisfies` decouples the two:

```ts
const PALETTE = { … } satisfies Theme;
//    checked AND still narrow: keys are literal, values are literal
```

The expression's inferred type is unchanged; `satisfies` only *asserts a
relationship*. That is why `getColor(name: keyof typeof PALETTE)` can reject
`"primry"` at compile time.

## `as const satisfies T` — order matters

```ts
const ROUTES = ["/", "/about"] as const satisfies readonly Route[];
```

Read it left to right:

1. `as const` — infer `readonly ["/", "/about"]` instead of `string[]`.
2. `satisfies` — verify each of those literals is assignable to `Route`.

Reversed (`satisfies … as const`) the check would run against the widened
`string[]`, and you would lose the tuple. This combination is now the standard
idiom for a checked literal table — routes, feature flags, permission lists.

## What `as` can and cannot do

`as` only moves along an **existing** relationship — it can narrow or widen, but
not convert:

```ts
const wrong = "abc" as unknown as number;   // the escape hatch
```

`"abc" as number` alone is an error ("neither type sufficiently overlaps"). The
double assertion `as unknown as T` bypasses that check entirely, and is a real
red flag in review: it means *"I am telling the compiler something it has
explicitly refused to believe."*

Critically, `as` has **zero runtime effect**. It does not convert, validate or
parse. `raw as StatusCode` produces exactly the same JavaScript as `raw`, so
`toStatusCode(999)` would happily return `999` typed as a valid code, and the
bug surfaces somewhere far away.

## When `as` is genuinely right

It is not always wrong. Legitimate uses:

- **You know more than the compiler about the environment.**
  `document.getElementById("x") as HTMLInputElement` — the DOM API cannot know
  the element type, and you can see the markup.
- **Immediately after a runtime check the compiler cannot express.** Prefer a
  type predicate (`x is T`), which is the checked version of the same idea.
- **Const assertions** (`as const`) — a different operator that happens to share
  the keyword.

Everywhere else, prefer proving it. The rule of thumb: **if you can write a
runtime check, write the check.** `toStatusCode` is four lines and cannot lie;
the cast is one line and can.

## `!` is `as` in disguise

```ts
values[0]!.toUpperCase();          // silences the warning
(values[0] as string).toUpperCase(); // identical meaning
```

Both are erased at runtime, and both turn a compile-time warning into a
production `TypeError` on an empty array. TODO 5 exists to make that concrete:
the starter compiles and `firstUpper([])` throws.

The fix is always the same shape — narrow into a local:

```ts
const first = values[0];
if (first === undefined) return "";
return first.toUpperCase();
```

## Common mistakes

| Mistake | What happens |
|---|---|
| `const PALETTE: Theme = { … }` | Checks, but `keyof` widens to `string`; `getColor("primry")` compiles |
| `satisfies` without `as const` on `ROUTES` | Inferred `string[]`; the tuple assertion fails |
| `satisfies ... as const` (wrong order) | The tuple is lost |
| `raw as StatusCode` in TODO 4 | Compiles; `toStatusCode(999)` returns 999 |
| `values[0]!` in TODO 5 | Compiles; throws on `[]` |
| `PALETTE[name] ?? "#000"` in TODO 3 | Works, but the `??` is dead code — the keys are literal, so the access is total |

## Interview angle

> *"What is `satisfies` and when would you use it?"*

It checks a value against a type **without changing the inferred type**. The
motivating example is a config object: annotating it widens `keyof` to `string`
and you lose typo-safety on the keys; `satisfies` gives you the check and keeps
the narrow inference. Mentioning `as const satisfies T` as the modern idiom for
literal tables is the detail that shows current knowledge.

> *"When is a type assertion acceptable?"*

When you have information the compiler cannot have — DOM element types being the
canonical case. Then the caveat that matters: `as` has no runtime effect, so it
never *makes* anything true. If a runtime check is possible, write a type
predicate instead. And `x as unknown as T` is a review flag, not a technique.
