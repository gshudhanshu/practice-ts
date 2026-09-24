# 21/03 — String manipulation

## The shape of every type in this file

```
match the head → emit something → recurse on the tail → stop at a base case
```

`TrimLeft` peels a whitespace character, `Split` peels a part, `ReplaceAll`
peels a match, `KebabCase` peels a character. Different patterns, one algorithm.

## A union inside a pattern means "any of these"

```ts
type TrimLeft<S extends string> = S extends `${Whitespace}${infer R}` ? TrimLeft<R> : S;
```

`Whitespace` is `" " | "\n" | "\t"`, and the compiler tries each alternative
when matching. That is why one branch handles all three characters.

`TrimRight` is the same pattern reflected: `` `${infer R}${Whitespace}` ``. Note
that neither is greedy in the way a regex is — the compiler finds *a* split that
satisfies the pattern, and repeated application does the rest.

## How the compiler picks a split point

For `` S extends `${infer H}${D}${infer R}` `` with `D = ","`, the leading
`${infer H}` matches **as little as possible**, so on `"a,b,c"` it binds
`H = "a"` and `R = "b,c"` rather than `H = "a,b"`. That leftmost-shortest rule
is what makes recursive splitting produce parts in order.

It also explains 10/05's ordering warning: a pattern ending in a wildcard will
swallow everything, so the "there is more after this" case must be tested first.

## `Split`'s base case is `[S]`, not `[]`

```ts
Split<"", ",">;      // [""]
"".split(",");       // [""]
```

Both return a single empty part, because splitting a string always produces at
least one piece. Getting this wrong makes `Join<Split<S, D>, D>` stop being the
identity, and the test asserts that round trip.

## `infer H extends string`

```ts
T extends readonly [infer H extends string, ...infer R extends string[]] ? … : …
```

A bare `infer H` is `unknown`, and `unknown` cannot appear inside a template
literal type. The `extends` clause on an `infer` (TS 4.8+) constrains it at the
point of inference, so `` `${H}${D}` `` is legal. Before 4.8 you had to add a
second conditional to narrow it, which is why older library code looks noisier.

## The empty-pattern trap

```ts
ReplaceAll<"abc", "", "y">;   // without a guard: "excessively deep"
```

An empty `From` matches at every position, so `Rest` never shrinks and the
recursion has no base case. One guard at the top — `From extends "" ? S : …` —
removes the whole class of problem. Any recursive type that consumes "some
prefix" needs to prove that prefix is non-empty.

## `KebabCase` without an `IsUpper` primitive

There is no built-in "is this character uppercase?". The workaround compares the
**rest** of the string with its own `Uncapitalize`:

```ts
R extends Uncapitalize<R> ? …no hyphen… : …hyphen…
```

If lowercasing the first character of `R` changes `R`, that character was
uppercase. `Uncapitalize<H>` then lowercases the character being emitted, so
`"FooBar"` produces `"foo-bar"` and not `"-foo-bar"`.

### Where the type and the runtime disagree

```ts
KebabCase<"HTTPServer">;   // "h-t-t-p-server"
kebabCase("HTTPServer");   // "httpserver"
```

The type inserts a hyphen before **every** uppercase character; the regex only
fires at a lower-to-upper boundary. Neither is obviously right — real libraries
(lodash, change-case) add a third rule for acronym runs, and the two
implementations would have to agree on it explicitly.

This is the honest lesson of "type-level twin" code: the type and the value are
two implementations of one specification, and they drift unless something checks
them against each other. The test does that for the inputs it covers, which is
all any test does.

## What these types cost

Every character is a type instantiation, and recursion has a hard ceiling.
Measured on this repo's compiler (TypeScript 7.0.2):

| | Limit |
|---|---|
| Non-tail-recursive (result embedded in a template or tuple) | **48** levels |
| Tail-recursive (the recursive call *is* the branch) | ~1000 levels |

`KebabCase` is non-tail-recursive — the recursive call sits inside a template
literal, so the compiler must finish it before building the result. A
48-character property name is fine; a 60-character one fails with *"Type
instantiation is excessively deep and possibly infinite"*.

That is a real constraint on shipping this kind of type. Splitting a whole CSV
file or a long SQL string at the type level will not work, and the failure is a
hard compiler error, not a slowdown. 21/05 covers how tail-recursion elimination
buys back the other factor of twenty.

## Common mistakes

| Mistake | What happens |
|---|---|
| `Split`'s false branch returning `[]` | `Split<"a", ",">` is `[]`; round trips break |
| No `From extends ""` guard | Infinite recursion, "excessively deep" |
| Bare `infer H` in `Join` | `unknown` is not allowed in a template literal |
| Appending the delimiter after every element | `"a-b-c-"` |
| `Capitalize` instead of `Uncapitalize` in `KebabCase` | `"Foo-Bar"` |
| Expecting the regex and the type to agree on `"HTTPServer"` | They do not — acronyms need an explicit rule |

## Interview angle

> *"Write a type that splits a string literal on a delimiter."*

The recursive template pattern, and then the detail that separates a memorised
answer from an understood one: the base case is `[S]` because
`String.prototype.split` returns one part for a string with no delimiter, and
the leading placeholder matches leftmost-shortest, which is what keeps the parts
in order.

> *"What stops you shipping types like this?"*

Recursion depth — around 48 levels non-tail-recursive, ~1000 when the compiler
can eliminate the tail call — plus compile time, since every character is an
instantiation. Say what you would do instead: validate with a coarse pattern
(`` `${string}-${string}` ``) and keep the precise computation at runtime.
