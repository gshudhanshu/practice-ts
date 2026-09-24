# 11/02 — Field, accessor and initializer decorators

**Tier:** Core · **Time:** ~30 min · **Course section:** 11 — Decorators (standard)

---

## Why this exercise exists

Methods are the easy case. A field has no function to wrap — it is a value
produced by an initializer expression — so the standard proposal gives field
decorators a different job:

```ts
(target: undefined, context) => (this, initialValue) => newValue
```

`target` is *always* `undefined`. You cannot intercept reads or writes, and you
cannot change the field's type. That limitation is the reason the `accessor`
keyword exists: `accessor x = 1` compiles to a real getter/setter pair over a
private slot, giving an accessor decorator something to wrap.

The third piece, `context.addInitializer`, is available on every decorator kind
and is the only hook that runs **per instance**. It is how `@bound` is built,
and how DI frameworks attach per-instance wiring.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `FieldDecorator<This, Value>` — `undefined` in, an initializer transform out. |
| 2 | `@doubled` doubles a numeric field's initial value, per instance. |
| 3 | `@tracked` records the initial value and every later assignment to an `accessor`. |
| 4 | `@positive` throws `RangeError("<name> must not be negative")` on init and on set. |
| 5 | `@bound` binds a method to its instance via `context.addInitializer`. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.
- No `experimentalDecorators` — this section is the standard flavour.
- `@positive` must leave the stored value untouched when a write is rejected.

## Done when

```bash
npm run check 11/02
```

<details>
<summary>Hint 1 — the field decorator shape</summary>

```ts
export function doubled<This>(
  _target: undefined,
  _context: ClassFieldDecoratorContext<This, number>,
): (this: This, initial: number) => number {
  return function (this: This, initial: number): number {
    return initial * 2;
  };
}
```

The outer body runs once per decorated field, per class. The function it returns
runs once per instance, during construction, with `this` set to that instance.
</details>

<details>
<summary>Hint 2 — the accessor triple</summary>

```ts
target   // { get(this): Value, set(this, value): void }  — the original pair
result   // { get?, set?, init? }                          — all optional
```

Anything you omit from the result keeps the original behaviour. `init` runs at
construction and returns what the backing slot starts with; `set` runs for every
later assignment. Delegate with `target.set.call(this, value)` — the original
pair needs a receiver just like a method does.

`@positive` needs `init` **and** `set`: the test constructs a class whose
initial value is already illegal.
</details>

<details>
<summary>Hint 3 — TODO 5 returns nothing</summary>

```ts
context.addInitializer(function (this: This): void {
  // runs during construction, `this` is the instance
});
```

Binding cannot be done by returning a replacement: a replacement still lives on
the prototype and still needs a receiver. Install a bound copy as an **own**
property of the instance instead, so it shadows the prototype method:

```ts
Object.defineProperty(this, name, { value: target.bind(this), … });
```

`Object.defineProperty` rather than plain assignment, so you control
`enumerable` — a bound method appearing in `Object.keys(instance)` surprises
people.
</details>

<details>
<summary>Hint 4 — `accessor` is not the same as `get`/`set`</summary>

```ts
accessor label = "kitchen";   // ClassAccessorDecoratorContext, kind "accessor"
get label() { … }             // ClassGetterDecoratorContext,   kind "getter"
label = "kitchen";            // ClassFieldDecoratorContext,     kind "field"
```

Three different context types, three different decorator signatures. The tests
include `@ts-expect-error` cases for each mismatch — if one of them starts
compiling, your signature is too loose.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
what `accessor` actually compiles to, why a field decorator cannot change the
field's type, and when `addInitializer` runs relative to field initializers.
