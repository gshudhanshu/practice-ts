# 11/01 — Method decorators (standard)

## The signature, and why it looks like that

```ts
function logged<This, Args extends unknown[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<
    This,
    (this: This, ...args: Args) => Return
  >,
): (this: This, ...args: Args) => Return
```

- **`target`** is the method function itself, before it is installed. The legacy
  flavour gave you a `PropertyDescriptor` and made you dig `descriptor.value`
  out of it; standard decorators hand you the function directly.
- **`context`** carries everything you might have wanted from the old
  `(target, propertyKey)` pair, and more: `kind`, `name`, `static`, `private`,
  `access`, `addInitializer`, `metadata`.
- **The return value** replaces the method. Returning `undefined` leaves it
  alone.

The three type parameters exist so the decorator stays *transparent*. Writing
`(target: Function, context: ClassMethodDecoratorContext)` compiles, but then
the compiler cannot check that your replacement matches the method it replaces,
and `this` inside the wrapper degrades. Capturing `This`, `Args` and `Return`
means a replacement with the wrong arity is a compile error at the point you
write it, not a runtime surprise.

`This` is a genuine type parameter, not a convenience. It is inferred from the
class the decorator lands on, which is why TODO 4 can constrain it
(`This extends object`) to use it as a `WeakMap` key.

## Two lifetimes

This is the mental model to leave with:

```ts
export function logged(target, context) {
  // ── runs ONCE, while the class is being defined ──
  const method = String(context.name);

  return function (this, ...args) {
    // ── runs on EVERY call ──
    log.push({ kind: "call", method, args });
    return target.call(this, ...args);
  };
}
```

Everything constant belongs in the outer body. Everything per-call belongs in
the inner one. Get this wrong and you get the `memoized` bug: a `Map` created in
the outer body is shared by every instance of the class, forever.

```ts
const caches = new WeakMap<This, Map<Arg, { value: Return }>>();
```

One `WeakMap` per class, one `Map` per instance. That is the standard shape for
per-instance state in a decorator, and it is exactly what an interviewer is
probing when they ask "where does the cache live?".

## `function`, never an arrow

```ts
return (…args) => target.call(this, …args);   // ✘ `this` is the decorator's
return function (this: This, …args) { … };    // ✔
```

An arrow captures `this` lexically — at decoration time, where there is no
instance. The replacement is installed on the prototype and must take its
receiver from the call site, so it has to be a `function` expression with an
explicit `this` parameter. TypeScript will not warn you: with an arrow, `this`
is simply the outer scope's, and the method silently reads the wrong object.

`target.call(this, ...args)` rather than `target(...args)` for the same reason.

## Statics decorate identically

```ts
@logged
static of(who: string): Greeter { … }
```

Nothing changes except that `context.static` is `true` and `this` inside the
replacement is the class, not an instance. The test covers it because people
assume there is a separate "static method decorator" — there is not.

## What else is on the context

| Member | What it gives you |
|---|---|
| `kind` | `"method"` — a literal type, so `context.kind` narrows a union of contexts |
| `name` | `string \| symbol`. Stringify before using it as a key |
| `static` | whether the member is on the class or the prototype |
| `private` | whether it is a `#private` member |
| `access` | `{ has(obj), get(obj) }` — read the member off an instance without knowing its name |
| `addInitializer(fn)` | run `fn` with `this` bound to the instance (or class) at construction — 11/02 uses it |
| `metadata` | the shared `Symbol.metadata` object, for decorators that want to communicate |

`access` is the piece that makes generic frameworks possible: a decorator can
hand out a reader for the member it decorated without the consumer knowing the
member's name.

## No flag, no `reflect-metadata`

Standard decorators are on by default. There is no `experimentalDecorators` in
this section's `tsconfig.json`, and there is nothing to install. TypeScript
downlevels the syntax for `target: ES2022` into `__esDecorate` calls in a class
static block — you can read the emit, and it is worth doing once.

## Common mistakes

| Mistake | What happens |
|---|---|
| Returning an arrow function | `this` is the decoration-time scope; the method reads the wrong object |
| `target(...args)` instead of `target.call(this, ...args)` | Same problem, one layer down |
| `const cache = new Map()` in the decorator body | Shared by every instance of the class |
| `cache.get(arg) !== undefined` as the hit test | A cached `undefined` looks like a miss |
| Forgetting to `return` the result | The method returns `undefined`; the type checker catches this one |
| `context.name` used directly as a key | It may be a `symbol`; stringify it |
| Assuming a decorator can change the method's type | It cannot — the declared signature always wins |

## Interview angle

> *"What arguments does a standard method decorator receive, and what can it
> return?"*

`(target, context)` — the method itself and a `ClassMethodDecoratorContext`.
Return a function to replace the method, or nothing to leave it alone. Then add
the part that shows you have written one: the returned function must be a
`function` expression forwarding `this`, and the decorator body runs once per
class while the replacement runs once per call.

> *"How would you add a per-instance cache with a decorator?"*

Say the trap out loud first: the obvious `const cache = new Map()` lives in the
decorator body, which runs once for the whole class, so every instance shares
it. Then give the fix — a `WeakMap` keyed on `this`, holding a `Map` per
instance — and mention that `WeakMap` keeps discarded instances collectable.
That is a two-sentence answer that demonstrates you have actually shipped one.
