# 10/01 — `keyof` and `typeof`

## The four building blocks

```ts
type A = typeof DEFAULT_CONFIG;          // read a VALUE's type
type B = keyof A;                        // union of its keys
type C = A["port"];                      // indexed access — one property's type
type D = (typeof ROLES)[number];         // union of an array's elements
```

Everything in section 10 composes from these:

```ts
type EventName = keyof typeof EVENT_HANDLERS;        // read, then take keys
type ClickHandler = (typeof EVENT_HANDLERS)["click"];// read, then index
```

Read them right to left: innermost `typeof` first, then the operator around it.

## Two different `typeof`s

```ts
if (typeof value === "string") { … }   // RUNTIME operator — narrowing
type Config = typeof DEFAULT_CONFIG;   // TYPE query — reads an inferred type
```

Same keyword, unrelated jobs. The type query exists only in type position and is
erased entirely. A useful tell: the runtime one is compared against a string;
the type one appears after `type`, `:` or inside a type argument.

## When to derive, and when not to

**Derive** when the value is the source of truth: default configs, route tables,
handler maps, `as const` lists. The payoff is that adding a field to
`DEFAULT_CONFIG` updates `Config`, `ConfigKey`, and everything downstream with
no second edit.

**Write the type by hand** when the *type* is the source of truth: a public API
contract, a domain model, anything where you want the type to constrain the
value rather than follow it. Deriving there is backwards — a typo in the value
silently becomes part of the type.

The middle ground is `satisfies` (07/04): write the constraint, keep the narrow
inference, get both.

```ts
const DEFAULT_CONFIG = { host: "localhost", port: 3000 } satisfies BaseConfig;
```

## Why `Object.keys` returns `string[]`

It looks like a limitation. It is correct.

TypeScript's object types are **not exact** — a value may carry more properties
than its type declares:

```ts
type Point = { x: number; y: number };
const p3 = { x: 1, y: 2, z: 3 };
const p: Point = p3;          // legal — p3 is assignable
Object.keys(p);               // ["x", "y", "z"] at runtime
```

If `Object.keys` returned `(keyof T)[]`, that would be a lie. So it returns
`string[]`, and narrowing it back is *your* job — with a runtime check, not a
cast:

```ts
Object.keys(DEFAULT_CONFIG).filter(isConfigKey);   // ConfigKey[], proven
```

The same reasoning applies to `Object.entries` and `for...in`.

## `Object.hasOwn` vs `in`

```ts
"toString" in DEFAULT_CONFIG          // true — walks the prototype chain
Object.hasOwn(DEFAULT_CONFIG, "toString")  // false — own properties only
```

`in` is right for **narrowing a union** (02/04), where you are asking "does this
shape have that member". It is wrong for **validating a key** against a plain
object, because every object inherits `toString`, `valueOf`, `constructor` and
friends.

`Object.hasOwn` (ES2022) replaces the old
`Object.prototype.hasOwnProperty.call(obj, key)` dance, which existed because
an object could itself have a property named `hasOwnProperty`.

## The literal-widening trap

```ts
const DEFAULT_CONFIG = { port: 3000 };
type Config = typeof DEFAULT_CONFIG;   // { port: number }

const FROZEN = { port: 3000 } as const;
type Frozen = typeof FROZEN;           // { readonly port: 3000 }
```

Object literals widen their property types unless you add `as const`. Here
that is what we want — a config's `port` should be `number`, not the literal
`3000`. For `ROLES` it is the opposite, which is why that one is `as const`.

Knowing which you want is the whole decision.

## Common mistakes

| Mistake | What happens |
|---|---|
| Hand-writing `Config` | Works today, drifts the moment `DEFAULT_CONFIG` changes |
| `keyof DEFAULT_CONFIG` | Error — `keyof` takes a type, not a value. You need `keyof typeof …` |
| `typeof ROLES[number]` | Parses as `typeof (ROLES[number])`. Parenthesise: `(typeof ROLES)[number]` |
| `value in DEFAULT_CONFIG` in TODO 5 | `"toString"` passes; the test catches it |
| `Object.keys(…) as ConfigKey[]` | Compiles, but asserts rather than proves |
| Forgetting `as const` on `ROLES` | `Role` collapses to `string` |

## Interview angle

> *"How do you keep a type and a constant in sync?"*

Derive the type from the value with `typeof`, and the union of its keys with
`keyof typeof`. Then the judgement half: derive when the *value* is the source of
truth, hand-write when the *type* is, and use `satisfies` when you want the
constraint and the narrow inference at once.

> *"Why doesn't `Object.keys` return `keyof T`?"*

Because TypeScript's object types are not exact — a value may have more
properties than its type lists, so `(keyof T)[]` would be unsound. This is a
great question to get, because the correct answer explains a design decision
rather than reciting an API.
