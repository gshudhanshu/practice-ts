# 06/02 — static members, getters & setters

## `static` belongs to the class

```ts
Temperature.ABSOLUTE_ZERO_CELSIUS   // on the class
temperature.celsius                 // on the instance
```

Static members live on the constructor function itself. There is exactly one
copy, shared by everything. Inside static methods, `this` refers to the class —
though writing `Temperature.#instanceCount` explicitly is clearer, and avoids a
subtlety: with `this`, a subclass calling the inherited static would get **its
own** copy of static fields, because static inheritance is via the prototype
chain.

### `static readonly` infers a literal type

```ts
static readonly ABSOLUTE_ZERO_CELSIUS = -273.15;   // type: -273.15
static ABSOLUTE_ZERO_CELSIUS = -273.15;            // type: number
```

`readonly` means it can never be reassigned, so TypeScript keeps the narrow
literal type — the same reasoning as `const` in 02/01. Useful when the constant
feeds a union or a lookup key.

## Private constructor + static factories

```ts
private constructor(private celsiusValue: number) {}

static fromCelsius(celsius: number): Temperature { … }
static fromFahrenheit(fahrenheit: number): Temperature { … }
```

Three things this buys you:

**Named construction.** `new Temperature(0)` is ambiguous — 0 what? The factory
names put the unit in the call site. A constructor can only be spelled one way,
which is the fundamental limitation this pattern works around.

**Validation before existence.** The object is never briefly invalid. There is
no window in which a half-built instance could escape via an event handler or a
logging hook.

**Control over instantiation.** Counting (as here), caching, object pooling, or
returning a cached singleton all become possible. `Object.freeze`, `Map`, and
`Promise.resolve` are all built-in examples of the same idea.

The cost: it does not compose with subclassing (a subclass cannot call a private
constructor — use `protected` if you need that), and you lose `new` as a
recognisable signal at call sites.

## Delegate, don't duplicate

```ts
static fromFahrenheit(fahrenheit: number): Temperature {
  return Temperature.fromCelsius((fahrenheit - 32) * (5 / 9));
}
```

Convert, then hand off. Validation and counting exist in exactly one place, so
they cannot drift apart. Duplicating the checks in both factories is the most
common way this exercise ends up subtly wrong — usually by forgetting to
increment in one of them.

## Getters and setters

A getter with **no** setter is a read-only public view of private state:

```ts
get celsius(): number { return this.celsiusValue; }
// t.celsius = 10  ->  compile error
```

A setter is the place to enforce an invariant on write:

```ts
set fahrenheit(value: number) {
  const celsius = (value - 32) * (5 / 9);
  Temperature.#assertAboveAbsoluteZero(celsius);   // reject before mutating
  this.celsiusValue = celsius;
}
```

Note the ordering: validate, *then* assign. Assigning first and validating after
leaves the object corrupted when the throw happens.

### When a setter is the wrong tool

Property assignment *looks* free. Readers assume `t.fahrenheit = 100` cannot
throw, cannot do I/O, and cannot take milliseconds. Keep setters to cheap,
synchronous validation and conversion; if it does real work, make it a method
(`t.setFahrenheit(100)`) so the call site shows something is happening.

A getter that throws is worse still — debuggers and loggers evaluate getters
while inspecting an object, so a throwing getter can break your tooling.

## Validate → count → construct

```ts
Temperature.#assertAboveAbsoluteZero(celsius);   // 1
Temperature.#instanceCount += 1;                 // 2
return new Temperature(celsius);                 // 3
```

Any other order and a rejected value still bumps the counter. Small thing, but
it is the exact shape of a real bug class: a metric that counts attempts when it
claims to count successes.

## Common mistakes

| Mistake | What happens |
|---|---|
| `static ABSOLUTE_ZERO_CELSIUS` without `readonly` | The `@ts-expect-error` on assignment stops erroring |
| Public constructor | The `new Temperature(20)` expectation fails |
| Duplicating validation in both factories | Works until one of them drifts — and the counter usually does first |
| Counting before validating | The "does not count failures" test fails |
| Adding a `celsius` setter | `t.celsius = 10` compiles; the assertion fails |
| `public static instanceCount` | Writable from outside; the counter assertion fails |
| Assigning in the setter before validating | The object is left corrupted when it throws |

## Interview angle

> *"When would you use a static factory instead of a constructor?"*

Name the three reasons — named construction, validation before existence, and
control over instantiation — then ground it in a real example: `Promise.resolve`,
`Array.from`, `Object.freeze`, or `Temperature.fromFahrenheit` here. Add the
cost (subclassing gets awkward) to show it is a trade, not a rule.

> *"Getter or method?"*

Getter when it is cheap, synchronous, side-effect free, and reads like data.
Method when it does work, can throw, or is async. The reason is that callers
assume property access is free — and debuggers evaluate getters while inspecting
objects, so an expensive or throwing getter breaks your tooling too.
