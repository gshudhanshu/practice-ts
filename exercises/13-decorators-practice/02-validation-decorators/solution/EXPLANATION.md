# 13/02 — Validation decorators

## Field decorators are not method decorators

```ts
function fieldDecorator(target: undefined, context: ClassFieldDecoratorContext<This, Value>)
```

`target` is `undefined`, and that is not an oversight. A method exists on the
prototype the moment the class is defined, so a method decorator can be handed
the function. A field does not exist until an instance is built, and every
instance gets its own — so there is nothing to hand over.

That leaves a field decorator two powers:

1. **Return an initialiser** — `(initialValue: Value) => Value` — which runs per
   instance and can transform the starting value. A `@trim` or `@clamp` on a
   plain field is written this way.
2. **`context.addInitializer(fn)`** — run arbitrary per-instance setup, with
   `this` bound to the object, just after that field is initialised.

This exercise uses the second, because registering a rule is a side effect, not
a transformation of the value.

## `context.access` is the escape hatch that is not a cast

```ts
check: () => context.access.get(this).trim() === "" ? "is required" : null
```

The obvious alternative is to store the field name and index into the object
later — and that is where people reach for `as`:

```ts
// what NOT to do
const value = (subject as Record<string, unknown>)[field];
```

`context.access` exists precisely so you do not have to. It is typed
`{ has(object: This): boolean; get(object: This): Value; set(object: This, value: Value): void }`,
so `get` returns `Value` — `string` for a `FieldDecorator<string>` — with no
assertion anywhere. It also works for `#private` fields, which bracket access
cannot reach at all.

**Read inside `check`, not outside it.** Reading at registration time freezes
the value the object had at construction, and validation stops tracking reality.
One test mutates `name` after construction for exactly this reason.

## Why `FieldDecorator<Value>` rejects the wrong field

```ts
export type FieldDecorator<Value> = <This extends object>(
  target: undefined,
  context: ClassFieldDecoratorContext<This, Value>,
) => void;
```

`ClassFieldDecoratorContext<This, Value>` mentions `Value` in both a return
position (`access.get`) and a parameter position (`access.set`), which makes it
**invariant** in `Value`. A `ClassFieldDecoratorContext<Form, number>` is
therefore not assignable to `ClassFieldDecoratorContext<Form, string>` in either
direction, so `@minLength(2)` on a `number` field is a compile error rather than
a runtime `undefined.trim is not a function`.

Invariance is usually the thing that gets in your way. Here it is the whole
feature.

## Ordering: bottom-up, and why the class reads "backwards"

```ts
@minLength(2)
@required()
name: string;
```

Decorators are applied bottom-up, and initialisers run in the order they were
registered, so `required()` registers first and therefore reports first. Written
the other way round — `@required()` on top, which looks more natural — the
errors come out as "must be at least 2 characters" before "is required", which
is the wrong order for a user-facing form.

Across fields the order is declaration order, and `super()` runs before a
subclass's own fields, so a `TeamRegistration` reports base-class fields first
without anyone arranging it.

## Per-instance registry, and what it buys

```ts
const RULES = new WeakMap<object, FieldRule[]>();
```

The alternative is a per-**class** registry keyed by the constructor. It is what
most published libraries do, and it costs them something: a subclass's rules and
its base class's live under two different keys, so validation has to walk the
prototype chain and merge, and the merge order becomes a bug farm.

Keying by instance sidesteps all of it. Both classes' initialisers run against
the same object, so the list is already complete and already in the right order.

The trade-off is honest: per-instance means one rule array per object rather
than one per class, which costs memory in proportion to live objects. For form
models that is nothing. For a hot path allocating millions of instances, the
per-class registry is the right call — and then you write the prototype walk.

`WeakMap` rather than `Map` because the keys are objects you do not own: a
strong map would keep every validated object alive for the life of the process.

## Why not `context.metadata`?

Standard decorators define a `context.metadata` object, shared by every
decorator on a class and exposed at `SomeClass[Symbol.metadata]`. It looks
purpose-built for this.

It is not usable yet. `Symbol.metadata` is a separate, later-stage proposal, and
no shipping JavaScript engine defines it — including the Node that runs these
tests. TypeScript's emit checks for it and falls back to `undefined`, so
`context.metadata` is `undefined` at runtime while its *type* says it is an
object. Code that trusts the type crashes.

Using it means shipping a polyfill (`Symbol.metadata ??= Symbol("metadata")`)
before any decorated class is defined. That is a real, common workaround — but
it is a decision to make deliberately, not something to stumble into because the
types looked fine.

## Decorators vs the 09/02 approach

| | 09/02 closures | 13/02 decorators |
|---|---|---|
| Where rules are declared | in a list, away from the model | at the field |
| Discoverable from the model | no | yes |
| Works without a build step | yes | no — needs decorator support |
| Rules composable at runtime | yes, they are values | no, they are fixed at class definition |
| Typed against the field | via curried generics | via context invariance |
| Testable in isolation | trivially | needs a decorated class |

Decorators win on **declaration-site clarity**: the constraint is visible where
the field is. Closures win on **flexibility**: rules are ordinary values, so you
can build them from configuration, vary them per tenant, or pass a different set
in a test.

The reason validation libraries pick decorators anyway is that models are read
far more often than validation is reconfigured.

## Common mistakes

| Mistake | What happens |
|---|---|
| Registering the rule in the decorator body | Runs once, at class definition — there is no instance to attach to |
| Reading `access.get` outside `check` | Validation sees construction-time values; the mutation test fails |
| `(subject as Record<string, unknown>)[field]` | Banned cast, and it cannot read `#private` fields |
| An arrow function passed to `addInitializer` | `this` is the decorator body's, not the instance's |
| A per-class registry, keyed by `constructor` | Subclass rules split across two keys; base rules go missing |
| `Map` instead of `WeakMap` | Every validated object is retained forever |
| `@required()` above `@minLength(2)` | Errors come out in the wrong order |
| Trusting `context.metadata` | `undefined` at runtime — the type lies without a polyfill |
| `guarded` validating its arguments | It validates `this`; the arguments were never registered |

## Interview angle

> *"How does something like class-validator actually work?"*

Decorators do not validate. They **register**: each one records a rule against
the field it was applied to, using `addInitializer` to hook construction and
`context.access` to read the value later. A separate function walks the
registered rules and collects failures. Then the honest caveat — the registry
has to live somewhere, and the choice between per-class metadata and
per-instance storage decides how inheritance behaves.

> *"Where would you keep the metadata a decorator collects?"*

Three options, and the trade-off is the answer. A `WeakMap` keyed by instance is
simplest and makes inheritance work for free, at the cost of per-object storage.
A `WeakMap` keyed by constructor is cheaper but needs an explicit prototype walk.
`context.metadata` is what the proposal intends, but `Symbol.metadata` is not
implemented in any shipping engine, so it needs a polyfill today — and its type
claims it is present regardless, which is a trap worth naming.
