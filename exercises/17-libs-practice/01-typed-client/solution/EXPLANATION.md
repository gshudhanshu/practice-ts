# 17/01 — A typed client over an untyped library

## The one idea

> You cannot make a bad dependency safe. You can make it **small**.

Everything in this exercise follows from that. `legacy-http` is `any` from top
to bottom, so it gets exactly one module allowed to import it, and that module
exports nothing the library invented — no `statusCode`, no `payload`, no
rejected string. Past `connect`, the compiler is back in charge.

This is the same dependency-inversion move as 06/05, applied to a package
instead of a class: the rest of the app depends on `TypedClient`, an interface
*you* own, and the adapter is the only thing that knows the library exists.

## `unknown`, not `any`

```ts
request(method: string, path: string, options?: LegacyRequestOptions): Promise<unknown>;
```

The library really returns `any`. Declaring `unknown` is legal — `any` is
assignable to everything — and it is the entire point:

| | What it means | What the next layer must do |
|---|---|---|
| `any` | "I gave up" | nothing; it compiles either way |
| `unknown` | "nobody has checked this yet" | narrow it before use |

There is a compile-time assertion on `HttpResponse["body"]` for precisely this,
because a solution that types the body as `any` passes every runtime test and
has achieved nothing. That assertion is the exercise.

## Declare the surface, not the library

`LegacyClient` is four lines. A full `.d.ts` for the package would be hundreds,
would be wrong within a month, and nobody would notice it had drifted.

A hand-written surface type has three properties worth having:

- It is **as small as your usage**, so it is cheap to check against the real
  docs when you upgrade.
- It is **a lie you control**. If the library adds a fifth rejection shape, one
  file changes.
- It **fails loudly at the seam**. `legacy.reqeust(...)` is a compile error the
  moment the declaration exists.

## Narrowing `unknown` with `in`, and no casts

```ts
if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return malformed();
if (!("statusCode" in raw)) return malformed();
const status: unknown = raw.statusCode;
```

Three details:

- `typeof null === "object"` — a JavaScript wart that has caused more bugs than
  any other single line of the spec.
- Arrays are objects, and `{ 0: …, length: 2 }` is not an envelope.
- Since TypeScript 4.9, `"k" in obj` narrows an `object` to one *having* that
  key, and the property reads as `unknown`. Before that you needed a cast; now
  you do not, and the repo's no-`as` rule is satisfiable.

## One error type, four rejection shapes

```ts
if (isHttpError(reason)) return reason;
if (typeof reason === "string") return new HttpError(0, path, reason);
if (reason instanceof Error) return new HttpError(0, path, reason.message);
if (typeof reason === "object" && reason !== null && "statusCode" in reason) { … }
return new HttpError(0, path, "unknown transport failure");
```

The order is load-bearing. An `HttpError` *is* an `Error`, so the passthrough
must come first or a retry-worthy 503 would be flattened into a status-0 error
and stop being retryable (17/03 depends on that distinction).

`catch (reason)` gives you `unknown`, because JavaScript can throw anything —
`throw 0`, `throw null`, a rejected promise of a symbol. The final fallback is
not defensive paranoia; it is the only honest branch.

**Status 0 means "no answer".** It is the convention `XMLHttpRequest` uses, and
it gives 17/03 a clean retry predicate: `status === 0 || status >= 500`.

## Throwing, and the alternative

This module throws. That is a deliberate choice and it has a cost — the
signature `get(path): Promise<HttpResponse>` does not mention failure at all, so
nothing forces a caller to handle a 404.

The alternative is `Promise<Result<HttpResponse, HttpError>>`, built properly in
[22/02](../../22-real-world-patterns/02-result-type/). The trade-off, in one
line each:

- **Throwing** matches the ecosystem (every HTTP library rejects), and keeps the
  happy path free of noise.
- **Returning a `Result`** puts the failure in the type, so the compiler can
  insist you deal with it.

Both are defensible. Being able to say *why* you picked one is the interview
answer; picking one silently is not.

## Common mistakes

| Mistake | What happens |
|---|---|
| `body: any` | Every runtime test passes; `Expect<Equal<HttpResponse["body"], unknown>>` fails |
| Returning the library's envelope unchanged | `statusCode`/`payload` leak past the boundary |
| Checking `instanceof Error` before `isHttpError` | 4xx/5xx statuses collapse to 0 |
| `{ query }` passed unconditionally | `exactOptionalPropertyTypes` rejects `query: undefined` |
| `raw as Record<string, unknown>` | Works, but the `in` operator makes it unnecessary |
| Forgetting `this.name = "HttpError"` | Every log line says `Error` |
| Importing `createClient` in more than one function | The boundary now has two doors |

## Interview angle

> *"How do you use a library that has no types?"*

Three options, in increasing order of cost: `@types/x` if it exists and is
current; a hand-written **ambient declaration** of just the surface you use; or
— the answer that shows judgement — an **adapter module** that wraps the
library behind an interface you own, returning `unknown` for anything you have
not validated. Mention that the adapter is also what makes the dependency
swappable and the calling code testable, since a fake `LegacyClient` is a
one-line object literal.

> *"What is the difference between `any` and `unknown`, and when would you use
> each?"*

`any` disables checking; `unknown` postpones it. Every operation on `unknown`
is an error until you narrow it, which is why it is the correct return type at
a trust boundary: parsed JSON, `catch` bindings, and untyped libraries.
Real answer to "when would you use `any`": almost never in application code —
occasionally in a declaration file where the shape is genuinely unconstrained,
and it should be `unknown` there too if callers can cope.
