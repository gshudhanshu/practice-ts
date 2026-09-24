# 11/03 — Class decorators and decorator factories

## The shape

```ts
type StandardClassDecorator<Class extends AnyClass> = (
  target: Class,
  context: ClassDecoratorContext<Class>,
) => Class | void;
```

`target` is the constructor. The `| void` is not decoration: side-effect
decorators (`@sealed`, `@registerAs`) return nothing, replacing ones
(`@singleton`) return a constructor, and both have to satisfy the same alias.

A class is **two** objects — the constructor holds statics, `Class.prototype`
holds methods. `@sealed` has to seal both, and sealing neither of them affects
instances that were, or will be, created from the prototype. People expect
sealing a class to freeze its objects; it does not.

## Factories: two functions, two lifetimes

```ts
export function registerAs(id: string) {
  return function <Class extends AnyClass>(target: Class, context) {
    registry.set(id, target);
  };
}
```

The outer function runs when the decorator **expression** is evaluated. The
inner one runs when the decorator is **applied**. Everything a library does with
`@Component({...})`, `@Injectable()`, `@Get("/users")` is this shape.

Two practical consequences:

- The factory runs even if the decorator it returns does nothing. Expensive work
  in a factory runs at import time, once per decorated declaration.
- The factory's arguments are captured in a closure, which is the only way a
  decorator gets configuration — decorator functions themselves have a fixed
  signature.

## Order — the whole answer

For

```ts
@trace("outer")
@trace("inner")
class Service {}
```

the measured trail is

```
eval:outer          ← expressions, top-down, source order
eval:inner
apply:inner         ← decorators, BOTTOM-UP
apply:outer
ready:inner:Service ← addInitializer callbacks, in registration order
ready:outer:Service
```

**Evaluation is top-down; application is bottom-up.** The reason application
runs bottom-up is that decorators compose like nested calls:

```ts
Service = outer(inner(Service));
```

`inner` must produce something for `outer` to receive. So the decorator written
closest to the declaration is the innermost wrapper, and the one written
furthest away sees the result of everything below it.

That has a sharp consequence, worth internalising because it produces real bugs:
**a decorator that replaces the class hides the original from everything written
above it, and everything written below it acted on the original.** Stack
`@sealed` under a class decorator that returns a replacement, and the sealed
object is the class nobody uses any more.

Across a whole class body the order is wider than this exercise shows — the full
sequence is in 11/04.

## Replacing a class without `any`

The natural implementation of `@singleton` is a subclass:

```ts
return class extends target { … };
```

TypeScript rejects it:

> TS2545: A mixin class must have a constructor with a single rest parameter of
> type `any[]`.

This is a deliberate rule. To extend a *type parameter*, the compiler must know
the derived class can forward whatever arguments the base takes, and only
`...args: any[]` expresses "forward anything" in a way that survives
`super(...args)`. `unknown[]` does not satisfy it, so a generic mixin genuinely
requires `any` — which is why every mixin example in the TypeScript handbook
uses `any[]`, and why this repo's no-`any` rule bites here.

A `Proxy` avoids the problem entirely:

```ts
return new Proxy(target, {
  construct(inner, args, newTarget): object {
    const existing = instance;
    if (existing !== undefined) return existing;
    const created: object = Reflect.construct(inner, args, newTarget);
    instance = created;
    return created;
  },
});
```

`new Proxy` is typed `<T extends object>(target: T, handler: ProxyHandler<T>): T`,
so the return type is exactly `Class`. No cast, no mixin rule, and the trap gets
the real `newTarget`, so `Reflect.construct` produces an object with the right
prototype and `instanceof` keeps working.

The `??=` you might reach for does not typecheck: `instance ??= …` has type
`object | undefined`, and the `construct` trap must return `object`. Reading it
into a local first narrows properly and avoids `!`.

## A replacement class cannot widen the public type

```ts
@singleton
class Pool { constructor(readonly size: number) {} }
```

`Pool`'s declared type is unchanged — TypeScript only checks that the
decorator's return type is assignable to the class. If `@singleton` returned a
class with an extra `createdAt` field, callers would still not see it.

This is the ceiling on what standard decorators can express, and it is why
Angular and NestJS pair decorators with hand-written or generated types rather
than expecting the decorator to grow the class. Say that in an interview and you
are ahead of most candidates, who assume decorators are a type-level feature.

## Common mistakes

| Mistake | What happens |
|---|---|
| `Object.seal(target)` only | The prototype is still open |
| Expecting `@sealed` to freeze instances | It does not; prototypes and instances are different objects |
| Registering `new target()` instead of `target` | The registry holds an instance and cannot construct more |
| `return class extends target {}` with a generic base | TS2545 — mixins need `any[]` |
| Dropping `newTarget` in `Reflect.construct` | Wrong prototype; `instanceof` breaks |
| `instance ??= …` in the `construct` trap | Type is `object \| undefined`; the trap must return `object` |
| Assuming top decorator applies first | It applies last — evaluation and application run in opposite directions |
| Expecting a replacement class to add visible members | The declared type never changes |

## Interview angle

> *"In what order do stacked decorators run?"*

Two orders, and they are opposite. The expressions evaluate top-down, in source
order; the decorators apply bottom-up, because they compose like
`outer(inner(x))`. Then land the consequence: the decorator nearest the
declaration is the innermost wrapper, so it sees the original and everything
above it sees the wrapped version.

> *"How would you implement a `@singleton` decorator?"*

Return a replacement constructor whose construction is intercepted. Mention that
a subclass is the obvious route but requires `...args: any[]` because of
TypeScript's mixin rule, and that a `Proxy` with a `construct` trap avoids both
the cast and the rule while preserving `instanceof` — provided you forward
`newTarget`. Then say the honest caveat: a singleton by decorator is invisible
at the call site, which is a design smell in most codebases.
