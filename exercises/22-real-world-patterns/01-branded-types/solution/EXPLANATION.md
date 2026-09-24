# 22/01 — Branded types

## Structural vs nominal, in one example

```ts
type UserId = string;
type OrderId = string;
refund(orderId, userId); // ✔ compiles
```

TypeScript compares **shapes**, not names. `type X = string` creates an alias,
not a new type, so every alias of `string` is interchangeable with every other
one. That is usually what you want — it is why a function taking
`{ name: string }` accepts any object with a name — and it is catastrophic for
identifiers, quantities and units.

A brand is the smallest possible lie that restores nominality:

```ts
type UserId = string & { readonly __brand: "UserId" };
```

The intersection is with a type that **no runtime value ever satisfies**. That
is deliberate: it makes the type unforgeable by accident, and unconstructable
without going through your constructor.

## The asymmetry is the whole pattern

| Assignment | Allowed? | Why |
|---|---|---|
| `UserId` → `string` | ✔ | `UserId` really is a string; it has more, not less |
| `string` → `UserId` | ✘ | a plain string lacks `__brand` |
| `UserId` → `OrderId` | ✘ | `"UserId"` and `"OrderId"` are different literal types |

The tests assert all three with `Extends` and `ExpectFalse`, because "it
compiled" is not evidence that a brand is working — an alias compiles too.

Branding restricts only what flows **in**. Everything a `string` can do, a
`UserId` can still do: `.toUpperCase()`, `.length`, template interpolation,
`JSON.stringify`. That is what makes the pattern cheap enough to adopt.

## The cost: one cast, contained

```ts
function brand<T, B extends string>(value: T): Brand<T, B> {
  return value as Brand<T, B>;
}
```

There is no way around this. The compiler cannot verify that a string has a
property that nothing at runtime will ever have — the claim is the point. What
you *can* control is how many places make it.

Two rules turn one cast into a safe pattern:

1. **It is not exported.** Anything that can call `brand` can brand anything,
   which would make every downstream `UserId` meaningless.
2. **Every branded value comes from a smart constructor** that validates first.

That is the deal branded types offer: accept one unverifiable line in exchange
for a guarantee that holds everywhere else. An exercise that "solved" this with
`as UserId` scattered at ten call sites would have the same types and none of
the guarantee.

`unique symbol` is the stricter variant:

```ts
declare const brandKey: unique symbol;
type UserId = string & { readonly [brandKey]: "UserId" };
```

Now nobody can even write the brand property by hand. It costs a declaration
per module and is harder to read in tooltips; teams split roughly evenly on it.

## Three shapes of constructor, on purpose

| Constructor | Returns | Use when |
|---|---|---|
| `toUserId` | `UserId`, throws | the value came from your own code; being wrong is a bug |
| `isOrderId` | `value is OrderId` | you want to branch, not construct |
| `toOrderId` | `OrderId \| null` | the value came from outside; being wrong is normal |

The predicate deserves attention:

```ts
export function isOrderId(value: string): value is OrderId {
  return ORDER_ID.test(value);
}
export const toOrderId = (raw: string): OrderId | null =>
  isOrderId(raw) ? raw : null;
```

**A type predicate brands without a cast.** Inside the `true` branch, `raw` has
already been narrowed from `string` to `OrderId`, so `return raw` is legal. It
is still an unchecked claim — the compiler trusts your `return` expression — but
it is a claim tied to a runtime check, sitting in a function whose signature
announces it.

The missing fourth shape is `Result<OrderId, string>`, which carries the
*reason* it failed. That is [22/02](../../02-result-type/), and 22/05 combines
it with branding.

## Arithmetic strips the brand

```ts
export function addCents(a: Cents, b: Cents): Cents {
  return toCents(a + b);
}
```

`a + b` is a plain `number`: the result of an arithmetic operator is a new
value, not one of the operands, so it carries no brand. Every operation on a
branded number needs re-branding.

This is the honest cost, and it is worth naming in an interview rather than
pretending the pattern is free. The mitigation is that a branded *quantity*
usually wants a small module of operations anyway — `addCents`, `multiplyCents`,
`splitCents` — at which point re-branding happens in five places you were going
to write regardless, and each one re-checks the invariant.

The classic argument for branded numbers is unit safety: `Metres` and `Feet`,
`Seconds` and `Milliseconds`. The Mars Climate Orbiter was lost to exactly that
confusion, and it is the example everyone remembers.

## Where this actually pays off

- **Ids.** `UserId`, `OrderId`, `TenantId` — the case in this exercise.
- **Validated strings.** `Email`, `Url`, `NonEmptyString` — the type then means
  "someone has checked this", which is a claim `string` cannot make.
- **Units and quantities.** `Cents` vs `Pounds`, `Millis` vs `Seconds`.
- **Trust levels.** `SanitisedHtml` vs `string` is a genuinely effective XSS
  defence, because a raw string cannot reach the render function.

## Common mistakes

| Mistake | What happens |
|---|---|
| `type UserId = string` with a comment | Compiles; enforces nothing; the `Extends` assertions fail |
| Exporting `brand` | Any caller can brand anything unvalidated |
| `as UserId` at each call site | Same types, no guarantee, ten places to get wrong |
| Branding without validating | The type says "checked" and nobody checked |
| `addCents` returning `a + b` | Type error — arithmetic strips the brand |
| Trying to unwrap before using a string method | Unnecessary; a branded string *is* a string |

## Interview angle

> *"TypeScript is structurally typed. How would you get nominal typing when you
> need it?"*

Intersect with a phantom property: `string & { readonly __brand: "UserId" }`.
Explain the asymmetry — a `UserId` is usable as a `string`, a `string` is not
usable as a `UserId` — then get to the cost immediately, because that is what
separates having read a blog post from having used it: you need a smart
constructor containing one cast, arithmetic strips the brand, and the whole
thing is erased at runtime so it protects nothing at a network boundary. Pair it
with 17/02's parsers and the combination is genuinely strong.

> *"Where have you seen this pay for itself?"*

Ids that get passed through several layers, validated strings (`Email`,
`SanitisedHtml`), and units. The strongest version of the answer names the
failure mode branding does **not** fix: `JSON.parse` will happily hand you an
object whose `userId` field is typed `UserId` and is in fact an order id,
because the brand does not exist at runtime. Branding is for internal
correctness; parsing is for the boundary.
