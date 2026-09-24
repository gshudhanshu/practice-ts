# 11/02 — Field, accessor and initializer decorators

## Three kinds, three signatures

| Declaration | `context.kind` | Decorator receives | Decorator returns |
|---|---|---|---|
| `x = 1` | `"field"` | `undefined`, context | `(this, initial) => value` |
| `accessor x = 1` | `"accessor"` | `{ get, set }`, context | `{ get?, set?, init? }` |
| `get x() {}` | `"getter"` | the getter function | a replacement getter |
| `m() {}` | `"method"` | the method function | a replacement method |

The tests include a `@ts-expect-error` for every mismatch, because the failure
mode is subtle: a decorator typed loosely enough to accept two kinds compiles
happily and then does the wrong thing at runtime.

## Why a field decorator gets `undefined`

There is nothing to hand over. A field is not a function on the prototype; it is
an initializer expression evaluated per instance. So the only thing a field
decorator can influence is the value that expression produced:

```ts
return function (this: This, initial: number): number {
  return initial * 2;
};
```

That function runs **once per instance**, during construction, with `this` set
to the instance being built — so it can read other already-initialized fields
if it needs to.

What a field decorator cannot do:

- **Intercept reads or writes.** No hook exists. `@doubled` sees `3` once and
  never hears from the field again.
- **Change the field's type.** `retries` is declared `number`, so `number` it
  stays. A decorator that returned a `string` would be a compile error, and even
  if it were not, the declared type is what every call site sees. This is the
  single most common misconception about decorators and it is worth being able
  to say plainly: **decorators cannot change types.** They are values operating
  at runtime; the type is fixed at declaration.
- **Add a field.** A decorator on `x` cannot introduce `y`.

## What `accessor` actually compiles to

```ts
class Thermostat {
  accessor label = "kitchen";
}
```

becomes, in effect:

```ts
class Thermostat {
  #label = "kitchen";
  get label() { return this.#label; }
  set label(v) { this.#label = v; }
}
```

That is the whole feature. It exists so that decorators have a getter/setter
pair to wrap while the *call site* still reads and writes a plain property.
`thermostat.label = "hall"` looks like a field assignment and goes through your
`set`.

The decorator receives the original pair as `target` and returns replacements:

```ts
{
  get(this)        { return target.get.call(this); }
  set(this, value) { target.set.call(this, value); }
  init(this, initial) { return initial; }
}
```

All three are optional — omit one and the original is kept. `positive` omits
`get` for exactly that reason. Note the `.call(this, …)`: the original pair
needs a receiver, same as a method.

`init` is the piece people forget. Without it, `@positive accessor target = -5`
would happily store `-5` and only complain on the next assignment. The test
constructs a class with an illegal initial value specifically to catch that.

## `addInitializer` and when it runs

```ts
context.addInitializer(function (this: This): void { … });
```

Every context kind has it. The callback runs while an instance is being
constructed (or, for `static` members, while the class is being set up), with
`this` bound to the instance.

Measured order for a class with a decorated method and decorated fields:

```
addInitializer callbacks  →  field initializers, in declaration order  →  constructor body
```

So a method decorator's initializer runs **before** any field exists. `@bound`
does not care — it only needs `this` — but a decorator that reads a field from
an initializer would read `undefined`, and that is a real bug people hit.

## Why `@bound` cannot be done by returning a replacement

```ts
@bound
inc(): void { this.count += 1; }
```

Returning a replacement function would still install it on the *prototype*, and
a prototype method has no receiver of its own — detaching it breaks exactly as
before. Binding is inherently per instance, so it needs a per-instance hook:

```ts
context.addInitializer(function (this: This) {
  Object.defineProperty(this, name, {
    value: target.bind(this),
    configurable: true,
    writable: true,
    enumerable: false,
  });
});
```

The own property shadows the prototype method for that instance only.
`enumerable: false` keeps it out of `Object.keys(instance)` and `{...instance}`,
matching how a real method behaves; plain assignment would make it enumerable.

The alternative most people reach for is an arrow-function class field:

```ts
inc = (): void => { this.count += 1; };
```

That also binds, and needs no decorator — but it puts a fresh closure on every
instance, it is not on the prototype so it cannot be overridden or spied on
usefully, and it cannot be applied selectively by a framework. `@bound` is the
version a library ships.

## Common mistakes

| Mistake | What happens |
|---|---|
| Expecting `target` to be the field's value | It is always `undefined` for a field |
| Expecting a field decorator to see writes | It never does; use `accessor` |
| Omitting `init` from an accessor result | The initial value bypasses your validation |
| `target.set(value)` instead of `target.set.call(this, value)` | The original setter has no receiver |
| An arrow in `addInitializer` | `this` is the decoration-time scope, not the instance |
| Returning a replacement from `@bound` | Still on the prototype, still unbound |
| Assuming a decorator can widen or change a member's type | It cannot; the declaration wins |

## Interview angle

> *"What is the `accessor` keyword for?"*

It declares a getter/setter pair backed by a private slot, so that a decorator
has something to wrap — a plain field gives a decorator nothing but its initial
value. Then the useful follow-up: the call site is unaffected, it still reads and
writes what looks like a property, which is why it is a drop-in replacement when
you decide a field needs interception.

> *"Can a decorator add a property to a class, or change a property's type?"*

No, and this is worth being crisp about. Decorators run at runtime; types are
fixed by the declaration. A class decorator may return a subclass that adds
members at runtime, but the *declared* type of the class does not grow, so the
new members are invisible to callers. Frameworks that appear to do this
(Angular, NestJS) rely on the declared shape being written out by hand or
generated, not on the decorator widening it.
