# 12/03 — Migrating from legacy to standard

## The comparison table

| | Legacy (`experimentalDecorators`) | Standard (TC39 Stage 3) |
|---|---|---|
| Enabled by | `"experimentalDecorators": true` | nothing — on by default |
| Method decorator signature | `(target, propertyKey, descriptor)` | `(method, context)` |
| How you change behaviour | mutate `descriptor.value`, or return a descriptor | return a replacement function |
| What `target` is | prototype for instance members, constructor for statics | the decorated value itself |
| Static vs instance | infer from `typeof target === "function"` | `context.static` |
| Member name | `propertyKey` argument | `context.name` |
| Descriptor flags (`writable`, `enumerable`) | fully available | not exposed at all |
| Per-instance hook | none — use a self-overwriting getter | `context.addInitializer` |
| Field decorators | `(target, propertyKey)`; cannot see the value | initializer transform `(initial) => value` |
| `accessor` keyword | not supported | supported |
| **Parameter decorators** | **yes** | **no — none at all** |
| `#private` members | cannot be decorated | can be decorated |
| Design-time type metadata | `emitDecoratorMetadata` + `reflect-metadata` | none; `context.metadata` is empty unless you fill it |
| Shared metadata channel | `Reflect.metadata` (polyfill) | `context.metadata` / `Symbol.metadata` |
| Application order | bottom-up | bottom-up (same) |
| Evaluation order | top-down (same) | top-down (same) |
| Class decorator can replace the class | yes | yes |
| Class decorator can change the class's *type* | no | no |
| Standardised, shipping in JS engines | no, never will | yes, on track |
| Used by Angular / NestJS / TypeORM | yes | no |

Two rows carry all the weight: **parameter decorators** and
**`emitDecoratorMetadata`**. Together they are constructor injection, which is
the spine of Angular and NestJS. Neither has a standard equivalent, and no
amount of cleverness works around their absence — a standard decorator simply
never sees a constructor parameter. That is why those frameworks have not moved,
and why `experimentalDecorators` will be with us for years.

## Why they cannot be mixed

`experimentalDecorators` is a **compilation-wide** flag, not a per-file or
per-declaration one. It changes what the `@` token means everywhere in the
program: which arguments the compiler passes, what return value it honours, what
it emits. There is no syntax to say "this `@` is the other kind", no pragma, no
directive.

So a project is entirely one or entirely the other. In practice that means:

- You cannot adopt standard decorators incrementally in an Angular or NestJS
  app. It is all or nothing, and the framework decides.
- A library shipping decorators must pick a flavour, and consumers on the other
  one cannot use it. Decorator libraries that support both do it by shipping two
  entry points with different implementations behind the same name.
- If you own the project and have no such dependency, use standard decorators.
  They are the ones JavaScript is getting, and TypeScript's legacy
  implementation was always explicitly labelled experimental.

The one thing that *is* portable is the plain function underneath. Both flavours
call a function; only the calling convention differs. A decorator whose real work
is factored into a helper can be exposed twice, with two thin adapters — which is
exactly what this exercise's `legacyLogged` and `standardLogged` are, and why
their wrapper bodies are identical.

## The mini-runtime, versus what the compiler emits

Your TODO 3 and the compiler's `__esDecorate` do the same four things:

```js
// what tsc emits, condensed
__esDecorate(this, null, _greet_decorators, {
  kind: "method",
  name: "greet",
  static: false,
  private: false,
  access: { has: obj => "greet" in obj, get: obj => obj.greet },
  metadata: _metadata,
}, null, _instanceExtraInitializers);
```

Build the context, call the decorator, install anything it returned, collect
initializers for later. The real helper additionally loops the decorator array
backwards (bottom-up application), handles the other six kinds, and threads a
shared `metadata` object through all of them.

Two details worth having written yourself:

- **`addInitializer` throws after decoration finishes.** Set your `finished`
  flag *after* calling the decorator, not before, or the decorator cannot
  register anything. The real runtime raises
  `TypeError: Cannot add initializers after decoration has completed` — an error
  people meet when they stash the `context` and use it later.
- **Install with `Object.defineProperty`, not assignment.** Class methods are
  non-enumerable. `prototype[name] = replacement` creates an enumerable
  property, so your decorated method starts showing up in `Object.keys` and
  `for…in` when nobody else's does.

## Two `@bound`s, two mechanisms

Standard has a per-instance hook, so it uses it:

```ts
context.addInitializer(function (this: This) {
  Object.defineProperty(this, name, { value: target.bind(this), … });
});
```

Legacy has none, so it uses a **self-overwriting getter** on the prototype:

```ts
return {
  configurable: true,
  enumerable: false,
  get(this: unknown) {
    const bound = original.bind(this);
    Object.defineProperty(this, propertyKey, { value: bound, … });
    return bound;
  },
};
```

The first read from an instance binds, caches the bound copy as an own property
of *that* instance, and returns it. Every later read finds the own property and
never reaches the getter — which is why `counter.inc === counter.inc` holds, and
why the cost is paid once.

Observable differences between the two:

| | Standard | Legacy |
|---|---|---|
| When binding happens | at construction | at first read |
| Before that | already an own property | still only on the prototype |
| Cost for an instance that never uses the method | one `defineProperty` | none |
| `Object.hasOwn(instance, "inc")` on a fresh instance | `true` | `false` |

The legacy version is lazier and, for that one reason, marginally better. It is
also far more obscure, which is a fair summary of the whole comparison.

## Common mistakes

| Mistake | What happens |
|---|---|
| Setting `finished = true` before calling the decorator | `addInitializer` throws during decoration |
| `prototype[name] = replacement` | The method becomes enumerable |
| `initializer(instance)` instead of `initializer.call(instance)` | `this` is undefined inside the initializer |
| Mutating the descriptor in `legacyBound` instead of returning a new one | `value` and `get` cannot coexist on one descriptor |
| Forgetting `configurable: true` on the getter | The instance cannot overwrite it, so caching fails |
| Expecting `@` to mean standard here | The flag is compilation-wide; `@` is legacy in this whole directory |
| Assuming a codebase can migrate one file at a time | It cannot |

## Interview angle

> *"TypeScript has two decorator implementations. What is the difference, and
> which should I use?"*

Signature and capability. Legacy is `(target, propertyKey, descriptor)` and hands
you the property descriptor, so it can change `writable`/`enumerable` and it
supports parameter decorators. Standard is `(value, context)`, hands you the
value itself, and adds `context.static`, `context.access` and
`context.addInitializer` — but has no parameter decorators and no
`emitDecoratorMetadata`. Use standard unless a framework forces otherwise, and
note that the flag is compilation-wide, so it is not a per-file decision.

> *"Could you migrate a NestJS app to standard decorators?"*

Not today, and the reason is specific rather than a matter of effort. NestJS's
constructor injection depends on parameter decorators and on
`design:paramtypes` from `emitDecoratorMetadata`. Standard decorators have
neither — a standard decorator cannot be attached to a parameter at all. So the
migration is blocked on the framework redesigning how it wires dependencies, not
on the application code. Being able to name the blocker rather than saying "it's
hard" is the answer they are listening for.
