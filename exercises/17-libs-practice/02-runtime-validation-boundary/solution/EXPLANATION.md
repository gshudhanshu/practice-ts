# 17/02 — The runtime validation boundary

## Types are erased; the network is not

This is the sentence the whole exercise exists for:

> A type annotation is a claim about a value. At the edge of your program,
> nobody has checked the claim.

`response.body as ProductPage` compiles because `as` *is* the claim — you
asserting it, with no evidence. At 3am when the upstream team ships
`price_cents` as a string, the failure surfaces three modules away in
`formatPrice`, and the stack trace points at your code rather than theirs.

`parseProductPage(response.body, "body")` fails at the boundary, immediately,
with `body.items[0].price_cents: expected an integer`. Same bug, ten minutes of
debugging instead of two hours.

## Parsers, not validators

Note the return type:

```ts
type Parser<T> = (value: unknown, path: string) => T;
```

Not `(value: unknown) => boolean`. A boolean validator leaves you holding the
`unknown` and needing a cast anyway; a parser *hands back the narrowed value*,
so the type flows out of the check rather than being asserted alongside it.

That is the difference between "parse, don't validate" and the pattern most
codebases actually have. Zod, Valibot, io-ts and `ArkType` are all this type
plus a schema-building DSL.

## Combinators are just higher-order functions

```ts
export function arrayOf<T>(item: Parser<T>): Parser<readonly T[]> {
  return (value, path) => { … item(element, `${path}[${index}]`) … };
}
```

Three of them (`arrayOf`, `withDefault`, `nullable`) plus three leaves cover the
entire API surface of this catalogue, and they nest without any extra work —
`arrayOf(arrayOf(asInteger))` produces `grid[1][1]: expected an integer` for
free, because each layer only knows how to extend the path by one step.

The generic is doing real work here: `arrayOf(parseProduct)` is
`Parser<readonly Product[]>` with no annotation at the call site, which is what
makes `parseProductPage` two lines long.

## `undefined` and `null` are different questions

```ts
withDefault(inner, fallback)  // undefined -> fallback
nullable(inner)               // null      -> null
```

The tests check that `withDefault(asBoolean, false)(null, …)` **throws**. That
is deliberate: "the server did not send this field" and "the server explicitly
sent null" are different facts, and collapsing them loses information you
sometimes need — a PATCH endpoint where `null` means *clear this* and absent
means *leave it alone* is the canonical example.

`exactOptionalPropertyTypes` is the same distinction at the type level (03/03).

## Paths use the wire vocabulary

```ts
name: asString(value["title"], `${path}.title`),
```

The domain name goes on the left; the error path uses `title`, the name that
appears in the actual JSON. Anyone diffing your log line against a `curl` output
needs the wire name — telling them `body.items[0].name` failed when the payload
has no `name` field at all sends them looking in the wrong place.

This function is the only place in the application that knows both vocabularies.
That is what makes the wire format changeable: a rename upstream is one line
here, not a sweep through the codebase.

## Two error types, on purpose

`fetchProducts` catches nothing, and the tests check that an `HttpError` reaches
the caller unwrapped:

| Error | Means | Reasonable response |
|---|---|---|
| `HttpError`, status 0 or 5xx | the request did not work | retry (17/03) |
| `HttpError`, status 4xx | you asked for the wrong thing | fix the call |
| `ValidationError` | the contract is broken | alert someone; retrying will not help |

Flattening those into one `Error` throws away every decision the caller could
make. A retry loop that retries a `ValidationError` will make the same
malformed request five times and then fail anyway.

## Common mistakes

| Mistake | What happens |
|---|---|
| `response.body as ProductPage` | Compiles; the renaming is silently missing |
| `asInteger` accepting `Number.isInteger(Number(value))` | `"5"` passes; the type is a lie |
| Element path `${path}.${index}` | The `tags[1]` test fails |
| `withDefault` also catching `null` | The explicit-null test fails |
| Validating but returning `unknown` | Callers still need a cast; the parser has done half a job |
| Renaming outside `parseProduct` | Two places know the wire format |
| `try/catch` inside `fetchProducts` | Swallows the distinction between transport and contract failures |

## Interview angle

> *"You get JSON back from an API. How do you know it matches your
> TypeScript type?"*

You do not — `JSON.parse` returns `any` and a type annotation on it is an
unchecked assertion. The answer is a runtime parser at the boundary that returns
the narrowed value, so the type is *produced by* the check rather than claimed
alongside it. Name a library (Zod, Valibot, io-ts) but be able to describe the
shape yourself: `(value: unknown) => T`, composable, error paths included.
Mention that the same argument applies to `localStorage`, `process.env`, form
bodies and anything crossing a `postMessage`.

> *"Where should validation live, and what about performance?"*

At the edges, once, on the way in — not scattered through the domain, and not
repeated on every read. The cost is real (it is O(payload)), and the honest
answer is that it is almost always dwarfed by the network call that produced the
payload; if a hot path genuinely cannot afford it, validate the envelope and
lazily parse the parts you use, but say out loud that you are trading safety for
it.
