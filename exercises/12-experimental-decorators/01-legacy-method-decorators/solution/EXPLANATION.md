# 12/01 — Legacy method decorators

## The signature, and what each argument really is

```ts
(target, propertyKey, descriptor) => void | PropertyDescriptor
```

| Argument | Instance member | Static member |
|---|---|---|
| `target` | `Class.prototype` | `Class` |
| `propertyKey` | `"add"` | `"of"` |
| `descriptor` | the not-yet-installed `PropertyDescriptor` | same |

`target` is never an instance. It cannot be — decorators run once, while the
class is being defined, and no instance exists yet. Every "why is `this`
undefined in my decorator?" question comes from expecting otherwise.

That `target` switches between the prototype and the constructor is the design's
main wart. There is no flag saying which, so the only test available is
`typeof target === "function"` — a constructor is callable, a prototype object
is not. Section 11 replaced this with `context.static`.

## Two mechanisms, one decorator

```ts
descriptor.value = wrapper;                    // mutate
return { ...descriptor, enumerable: true };    // replace
```

Both work. Mutating is what almost all real code does; returning is the
documented alternative and is useful when you want to build a descriptor from
scratch. If you return one, it replaces the original **entirely** — spread the
old one in or you lose `value` and the method vanishes.

Mutating the descriptor is not monkey-patching, even though it looks like it.
The descriptor object has not been installed on the prototype yet; the emitted
helper does that afterwards, with whatever you left in it.

## What the compiler emits

```js
__decorate([logged], Calculator.prototype, "add", null);
```

and `__decorate` is, in essence:

```js
function __decorate(decorators, target, key, desc) {
  let r = Object.getOwnPropertyDescriptor(target, key);
  for (let i = decorators.length - 1; i >= 0; i--) {
    r = decorators[i](target, key, r) || r;
  }
  return Object.defineProperty(target, key, r);
}
```

Three things fall out of reading it:

- **`|| r`** is why returning nothing keeps your mutations — the old descriptor
  is reused when the decorator returns `undefined`.
- **The loop counts down**, so stacked decorators apply bottom-up. Identical to
  the standard flavour.
- **`Object.defineProperty` at the end** is why `writable: false` sticks.

## What legacy can do that standard cannot

| Capability | Legacy | Standard |
|---|---|---|
| Change `writable` / `enumerable` / `configurable` | yes | no |
| See the member's `PropertyDescriptor` | yes | no |
| Decorate a constructor **parameter** | yes | no |
| Emit design-time type metadata (`emitDecoratorMetadata`) | yes | no |
| Distinguish static from instance without a heuristic | no | yes (`context.static`) |
| Per-instance initialization hook | no | yes (`addInitializer`) |
| Decorate `#private` members | no | yes |
| Standardised, on by default, no flag | no | yes |

`@readonlyMethod` is the clearest illustration: it needs no wrapper at all, and
it simply cannot be written with standard decorators, because a standard method
decorator receives the function and never the descriptor.

That is the honest trade-off. Legacy gives you the whole property; standard
gives you a defined protocol, real static/instance information, and a
per-instance hook — and, unlike legacy, it will still be there when JavaScript
ships decorators natively.

## Typing without `any`

The lazy legacy decorator is untyped:

```ts
function logged(target: any, key: string, descriptor: any) { … }
```

`TypedPropertyDescriptor<T>` avoids it:

```ts
function logged<Args extends unknown[], Return>(
  _target: object,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<(...args: Args) => Return>,
): void
```

Two payoffs. The compiler now checks the replacement against the method it
replaces, and — because `strictBindCallApply` is on — `original.call(this, …)`
returns `Return` rather than `any`. `.apply` would still give you `any`, which is
one reason `call` is the better habit.

`descriptor.value` is `T | undefined`, so narrow it. That is not pedantry: a
descriptor really can describe an accessor pair with no `value`, and a decorator
written for methods will be handed one the moment someone puts it on a getter.

## Common mistakes

| Mistake | What happens |
|---|---|
| Expecting `target` to be the instance | It is the prototype (or the constructor); no instance exists yet |
| Returning `{ enumerable: true }` without spreading | The method is deleted |
| An arrow function as the replacement | `this` is the decoration-time scope |
| `original.apply(this, args)` | Compiles, but the result degrades to `any` |
| `descriptor.value!` | Banned here, and wrong when the descriptor is an accessor |
| Assuming `target` says whether the member is static | It does not; infer from `typeof target` |
| Adding `experimentalDecorators` to a project that uses standard decorators | Both flavours change meaning; they cannot coexist |

## Interview angle

> *"What are the arguments to a TypeScript method decorator?"*

Ask which flavour, and say why the question is ambiguous — that alone is a good
signal. Legacy: `(target, propertyKey, descriptor)`, where `target` is the
prototype for instance members and the constructor for statics, and you change
behaviour by mutating or returning the descriptor. Standard:
`(method, context)`, and you return a replacement function.

> *"Can you make a method non-writable with a decorator?"*

With legacy, yes — `descriptor.writable = false`, one line, no wrapper. With
standard, no: the descriptor is never exposed, so the closest you can get is
`addInitializer` plus a manual `Object.defineProperty` on the instance. It is a
concrete example of the standard proposal deliberately narrowing what decorators
may touch.
