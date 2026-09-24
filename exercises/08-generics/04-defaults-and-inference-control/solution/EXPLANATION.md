# 08/04 — Type-parameter defaults & controlling inference

## Defaults

```ts
type ApiResponse<TData, TError = string> = …
class Store<TState = Record<string, unknown>> { … }
```

A default lets callers omit the argument: `ApiResponse<User>` means
`ApiResponse<User, string>`. Same ordering rule as default function parameters
— defaulted type parameters come last.

**A default is not a constraint.** They answer different questions and can be
combined:

```ts
<T extends object = Record<string, unknown>>
//  ^ constraint: what is ALLOWED
//                ^ default: what is USED when omitted
```

A default does not restrict what an explicit argument may be; a constraint does
not supply one when omitted.

## `never` as a deliberate type argument

```ts
function failWith<TError>(error: TError): ApiResponse<never, TError>
```

A failure has no data, so its success branch can never occur. `never` states
that precisely: nothing is assignable to it, so that branch is unconstructable
and unreadable. The value still narrows correctly at the call site:

```ts
const result = failWith("nope");
if (result.ok) {
  result.data;   // typed `never` — and unreachable
}
```

This is the same "make illegal states unrepresentable" idea from 02/04, applied
to a type argument rather than a property.

## `const` type parameters

```ts
function asTuple<const T extends readonly unknown[]>(values: T): T
asTuple(["a", "b"]);   // readonly ["a", "b"]
```

Before TS 5.0, the caller had to write `asTuple(["a", "b"] as const)` — easy to
forget, and noisy at every call site. `const T` moves that decision to the
**API author**, which is where it belongs: the function knows it wants literal
types; the caller should not have to.

The library that made this famous is routing/validation code — think
`defineRoutes(["/a", "/b"])` producing a `"/a" | "/b"` union instead of
`string`.

**When it gets in the way:** `const` makes everything readonly and literal, so
if the caller wants to mutate the array afterwards, or genuinely wants `string`
rather than `"a"`, it is the wrong default. It also only affects inference from
*literal* expressions — passing an existing `string[]` variable is unchanged.

## `NoInfer<T>`

The problem it solves:

```ts
function pickOne<T>(options: readonly T[], fallback: T): T
pickOne(["a", "b"], 1);   // T infers as string | number — the bug compiles
```

Inference considers **every** position where `T` appears, so a wrong fallback
does not fail — it *widens `T`* until it fits. That is almost never what you
want; the fallback should be checked against the array, not vote on its type.

```ts
function pickOne<T>(options: readonly T[], fallback: NoInfer<T>): T
pickOne(["a", "b"], 1);   // Error: 1 is not assignable to string
```

`NoInfer<T>` marks a position as "check here, do not infer from here". Before
TS 5.4 people faked it with intersection tricks (`T & {}`) or a second dummy
type parameter.

**The consequence to remember:** if the inferring position gives nothing, `T`
collapses. `pickOne([], "z")` infers `T = never` from the empty array literal,
and the fallback can no longer rescue it. That is correct — annotate the array
or pass `pickOne<string>([], "z")`.

Real uses: default values, config overrides, and anywhere one argument should be
the "source of truth" for a type while another is merely validated against it.

## Common mistakes

| Mistake | What happens |
|---|---|
| `<TError = string, TData>` | Syntax error — defaults must come last |
| `failWith(): ApiResponse<unknown, TError>` | The success branch becomes readable; the assertion fails |
| `asTuple` without `const` | Infers `string[]`; the tuple assertion fails |
| `fallback: T` without `NoInfer` | `pickOne(["a"], 1)` compiles with `T = string \| number` |
| `options[0] \|\| fallback` | A first option of `""` or `0` returns the fallback |
| Forgetting the default on `Store` | `Store` with no argument stops compiling |

## Interview angle

> *"What does `NoInfer` do?"*

It excludes a position from type inference, so one argument decides `T` and the
others are only checked against it. The motivating case is a default/fallback
parameter: without it, a wrong default silently widens `T` instead of erroring.
Knowing this is a strong signal of current TypeScript — it landed in 5.4.

> *"How do you get literal types out of a function argument without `as const`
> at the call site?"*

A `const` type parameter (TS 5.0). Then the judgement half: it forces readonly
and literal inference, so it is right for config/route/schema APIs and wrong
when the caller legitimately wants a mutable, widened value.
