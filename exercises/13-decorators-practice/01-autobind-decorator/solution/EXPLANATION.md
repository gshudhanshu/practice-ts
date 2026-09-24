# 13/01 — The autobind decorator

## Standard decorators in one screen

```ts
function d(target, context) { … }
```

| kind | `target` is | returning a value means |
|---|---|---|
| `method` | the function | replace the method |
| `getter` / `setter` | that accessor | replace that accessor |
| `field` | *nothing* (`undefined`) | an initialiser `(value) => newValue` |
| `accessor` | `{ get, set }` | `{ get?, set?, init? }` |
| `class` | the constructor | replace the class |

`context` always carries `name`, `kind`, `static`, `private`, `access` and
`addInitializer`. Two rules follow from the table and cover most confusion:

- **A field decorator does not receive the value.** It receives `undefined` and
  may return a function that transforms the initial value.
- **Returning `undefined` means "leave it alone".** That is not a failure mode;
  `autobind` relies on it.

Decorators run **when the class is defined**, once, not per instance. Anything
you want per instance has to go through `addInitializer` or a `WeakMap`.

## Why `autobind` returns nothing

The tempting version:

```ts
// WRONG
return function (this: This, ...args: Args) {
  return target.call(this, ...args);
};
```

That replaces the prototype method with… another prototype method. `toolbar.save`
still reads it off the prototype and still hands you a naked function. You have
wrapped the problem.

Binding requires an instance, and the only moment an instance exists is during
construction:

```ts
context.addInitializer(function (this: This) {
  Object.defineProperty(this, context.name, {
    value: target.bind(this),
    writable: true,
    configurable: true,
  });
});
```

For an instance method, that callback runs while the object is being built, with
`this` bound to it. The bound copy is installed as an **own** property, which
shadows the prototype method for that instance only.

Three details in the descriptor are deliberate:

- **`writable` and `configurable`** — otherwise a subclass, a spy or a test
  double can never replace the method. Locking it down looks safer and is not.
- **`enumerable` left `false`** — a real method is not enumerable either.
  Making it enumerable would leak `save` into `Object.keys(toolbar)` and into
  `{ ...toolbar }`, which quietly breaks serialisation.
- **`Object.defineProperty` rather than `this[name] = …`** — assignment would be
  enumerable, and would go through any setter the prototype happens to define.

## Decorator order

```ts
@autobind      // applied SECOND — sees the wrapper
@logCalls      // applied FIRST  — sees the raw method
save() { … }
```

Decorators are evaluated top-to-bottom but **applied bottom-up**, like nested
function calls: `autobind(logCalls(save))`. So the bound copy is a bound copy
*of the logging wrapper*.

Flip the two lines and everything still compiles and every direct call still
logs — but the detached copy stops logging, because `autobind` captured the raw
method before `logCalls` ever saw it. It is a silent, order-dependent bug, and
the reason to keep `@autobind` outermost as a habit.

`addInitializer` callbacks then run in the order they were registered, which
means the *innermost* decorator's initialiser runs first.

## Decorator vs arrow field — the actual comparison

05/03 fixed the same problem like this:

```ts
class Toolbar {
  save = (): string => `saved: ${this.title}`;
}
```

Both give you an own, pre-bound property. They differ everywhere else.

| | arrow field | `@autobind` |
|---|---|---|
| Lives on | the instance | prototype + a bound own copy |
| Reusable | no, retyped per class | yes, one decorator for the codebase |
| `super.save()` | impossible — not a method | works, the prototype method is intact |
| Overriding in a subclass | shadowed by field order, fragile | ordinary method override |
| Enumerable | **yes** — shows up in `Object.keys` and spreads | no |
| Cost | one closure per instance per method | one bound function per instance per method |
| Tooling | plain JavaScript, always works | needs decorator support in your toolchain |
| Reads as | "this is a callback" | "this is a method that is safe to pass" |

The arrow field wins when the class is small, when the property is genuinely a
callback rather than a method, and when you do not want a build-time feature in
the way. The decorator wins when several classes need the same behaviour, when
you want `super` and overrides to keep working, and when you want the intent
(`@autobind`) visible at the declaration.

The third option is neither: **bind at the call site** —
`onClick={() => toolbar.save()}`. No class machinery, and the reader can see
what is happening. Frameworks that force you to pass bare method references are
the reason the other two exist.

## Per-method state vs per-instance state

`once` and `deprecate` both keep state, and they keep it in different places.

```ts
const cache = new WeakMap<This, { value: Return }>();  // once:      per instance
let warned = false;                                    // deprecate: per method
```

Both live in the decorator body, which runs once per decorated method. `once`
then keys by instance, so two `Toolbar`s get two caches. `deprecate` does not,
so the whole process warns once — which is what a deprecation notice should do.

The `{ value }` wrapper is not decoration. `cache.get(this)` returns
`Return | undefined`, so without it a method that legitimately returns
`undefined` would be re-run every time.

`WeakMap` rather than `Map` because a `Map` keyed by instance is a memory leak:
it keeps every object you ever memoised alive for the life of the process.

## `context.name` is `string | symbol`

Methods can be keyed by symbol, so `context.name` is not a `string`. Anywhere
you want text, `String(context.name)` — and read it **once in the decorator
body**, not on every call. The decorator runs once; the method runs forever.

For a private method (`#save`), `context.private` is `true`, `context.name` is
`"#save"`, and `Object.defineProperty(this, "#save", …)` would define an
unrelated string-keyed property rather than the private field. Private methods
need `context.access` instead — which is why `autobind` here is documented for
public methods.

## Common mistakes

| Mistake | What happens |
|---|---|
| Returning an arrow from the decorator | `this` is the decorator's, not the caller's; every call breaks |
| `autobind` returning a replacement | Compiles, tests pass for direct calls, detaching still fails |
| `this[context.name] = target.bind(this)` | Enumerable — the method leaks into `Object.keys` and spreads |
| `writable: false` in the descriptor | Nothing can stub or override the method any more |
| `@logCalls` above `@autobind` | Detached calls silently stop logging |
| `Map` instead of `WeakMap` in `once` | Every memoised instance is retained forever |
| `cache.get(this) ?? run()` | A cached `undefined` re-runs the body every time |
| `warned` declared in the outer factory | Every decorated method shares one flag; only the first ever warns |
| Forgetting `deprecate` is a factory | `@deprecate` without `()` is a type error — the test asserts it |

## Interview angle

> *"How would you stop a class method losing `this` when it is passed as a
> callback?"*

Name all three: bind at the call site (`() => obj.m()`), an arrow class field,
or a decorator using `addInitializer` to install a bound own property. Then say
which you would reach for and why — call-site binding for one-offs, the arrow
field for a small class, the decorator when several classes need it and you want
`super` and overrides to keep working. The comparison is the answer; picking one
and stopping is not.

> *"What changed between TypeScript's old decorators and the standard ones?"*

The signature and the timing. Legacy decorators took
`(target, key, descriptor)` and mutated a property descriptor;
standard decorators take `(target, context)` and *return* the replacement, which
makes them composable and lets the engine do the installing. Standard decorators
add `addInitializer` for per-instance work, add `accessor` fields, and drop
parameter decorators and `emitDecoratorMetadata`. The practical consequence: the
standard ones are a JavaScript feature that TypeScript merely type-checks, so
they will keep working when the build step changes.
