# 07/05 — Assertion functions

## Predicate vs assertion

```ts
function isFoo(v: unknown): v is Foo               // returns boolean
function assertFoo(v: unknown): asserts v is Foo   // returns nothing, throws
```

| | Type predicate | Assertion function |
|---|---|---|
| Returns | `boolean` | nothing (`void`) |
| Narrows | inside the `if` branch | for the **rest of the scope** |
| On failure | you handle it | it throws |
| Use when | failure is an expected outcome | failure is a bug / unrecoverable |

The scope difference is the whole point. Predicates give you a pyramid:

```ts
if (isRecord(v)) {
  if (isString(v["id"])) {
    if (isNumber(v["total"])) {
      // finally
    }
  }
}
```

Assertions give you a flat list:

```ts
assertIsRecord(value);
const { id, totalCents, items } = value;
assertIsString(id, "id");
// …
```

Same safety, a quarter of the indentation. This is exactly the shape of
`node:assert`, and of Zod's `.parse()` (throws) versus `.safeParse()` (returns a
result).

## The declaration rule that catches everyone

An assertion function must be declared in a way TypeScript can see *statically*:

```ts
function assertFoo(v: unknown): asserts v is Foo { … }   // works

const assertFoo = (v: unknown): asserts v is Foo => { … };
// Error: Assertions require every name in the call target to be declared with
// an explicit type annotation.
```

For the arrow form you must annotate the **variable**, not just the function:

```ts
const assertFoo: (v: unknown) => asserts v is Foo = (v) => { … };
```

The reason is circularity: the compiler needs the assertion signature before it
can check the body, and inference cannot produce one. Function declarations
sidestep it — which is why they are the normal choice here.

The same rule applies to *calls*: `obj.assert(x)` narrows only if `obj` has a
declared type; a dynamically-resolved call does not narrow.

## `Number.isInteger` does not narrow

```ts
Number.isInteger(value)   // (number: unknown) => boolean
```

It returns a plain boolean, so `value` stays `unknown`. Order the checks so the
`typeof` guard comes first:

```ts
if (
  typeof totalCents !== "number" ||   // narrows for the operands to its right
  !Number.isInteger(totalCents) ||
  totalCents < 0
) throw new TypeError("…");
```

`||` narrows left to right — by the third operand the compiler knows it is a
number. Reorder these and it stops compiling, which is a nice demonstration that
narrowing is positional.

Contrast `Array.isArray`, which **is** declared as a predicate
(`arg is any[]`) and therefore does narrow.

## Validation order is part of the contract

The tests pin the message for each failure, which forces a fixed order:
object → id → totalCents → items. That is not busywork — an API whose error
message depends on object key ordering is genuinely hard to write clients for.

The rule generalises: **validate outside-in**, and check the container before
its contents. `assertIsOrder("nope")` must report `"expected an object"`, not
crash trying to read `.id` off a string.

## Stable error messages

```ts
try {
  parsed = JSON.parse(raw);
} catch {
  throw new TypeError("malformed JSON");
}
```

`JSON.parse` throws a `SyntaxError` whose text varies by engine and version
(`"Unexpected token b in JSON at position 1"` vs V8's newer wording). Anything
asserting on that message is a test that breaks on a Node upgrade. Catching and
re-throwing your own message makes the contract yours.

Note the bare `catch {}` with no binding — legal since ES2019, and the right
choice when you do not use the error.

## `catch` gives you `unknown`

```ts
catch (error) {
  const message = error instanceof Error ? error.message : String(error);
}
```

`useUnknownInCatchVariables` is one of the eight `strict` flags. It is correct:
JavaScript lets you `throw` anything — a string, a number, `undefined` — so
assuming an `Error` is unsound. The `instanceof` check plus a `String()` fallback
is the standard shape.

## Where schema libraries take over

Hand-written assertions are fine for a handful of shapes. Past that, the failure
mode is drift: someone adds a field to `Order` and forgets `assertIsOrder`.

Zod, Valibot and ArkType invert the dependency — you declare the schema and
*derive* the type from it:

```ts
const OrderSchema = z.object({ id: z.string(), totalCents: z.number().int().min(0) });
type Order = z.infer<typeof OrderSchema>;
```

Now the validator and the type cannot disagree, because there is only one
source. Knowing *why* those libraries exist — and that it is the same
single-source-of-truth idea as `as const` + `[number]` from 02/03 — is worth
more than knowing their API.

## Common mistakes

| Mistake | What happens |
|---|---|
| `: boolean` instead of `: asserts value is T` | Nothing narrows; `parseOrder` needs a cast |
| Arrow function without an annotated variable | "Assertions require every name in the call target…" |
| `Number.isInteger` before the `typeof` check | `totalCents < 0` will not compile |
| Checking fields before the object | `assertIsOrder("nope")` reports the wrong error |
| Letting `SyntaxError` escape from `parseOrder` | The engine's message is asserted on, and breaks on upgrade |
| `error.message` in the catch | Compile error — `error` is `unknown` |
| `return parsed as Order` | Compiles, but defeats the entire exercise |

## Interview angle

> *"What's the difference between a type guard and an assertion function?"*

Scope of narrowing, and what happens on failure. A predicate returns a boolean
and narrows inside the branch — right when failure is an expected outcome. An
assertion throws and narrows for the rest of the scope — right when failure is a
bug. Then the practical note: assertions flatten validation code, which is why
`node:assert` is shaped that way.

> *"How do you validate data coming off the network?"*

Parse at the boundary into a real type, never trust `any`, and keep the runtime
check and the compile-time type tied together. Hand-rolled assertions for a
couple of shapes; a schema library beyond that, specifically because it derives
the type from the schema and removes the drift.
