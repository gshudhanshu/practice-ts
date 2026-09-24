# Section 11 — Decorators (standard, TC39 Stage 3)

Maps to `11-decorators` in the course repo.

The course teaches decorators in the **legacy** flavour, because that is what
existed when it was recorded and what Angular and NestJS still require. This
section teaches the **standard** one — the version TypeScript implements by
default, with no compiler flag, and the version JavaScript itself is getting.
Section 12 then covers the legacy flavour properly, because you will meet it.

A decorator is a plain function the runtime calls while a class is being
defined:

```ts
(target, context) => replacement | void
```

That single shape covers classes, methods, getters, setters, fields, accessors
and every framework annotation you have ever seen. Learn the shape, learn where
`this` comes from, learn the order — that is the section.

| # | Exercise | Tier | Time | Covers |
|---|---|---|---|---|
| 01 | [Method decorators](01-method-decorators/) | Drill → Core | 20 min | `(target, context)`, `ClassMethodDecoratorContext`, replacement functions, per-instance state |
| 02 | [Field & accessor decorators](02-field-and-accessor-decorators/) | Core | 30 min | Initializer transforms, the `accessor` keyword, `context.addInitializer` |
| 03 | [Class decorators & factories](03-class-decorators-and-factories/) | Core | 30 min | `ClassDecoratorContext`, factories, evaluation vs application, replacement classes |
| 04 | [A decorator suite](04-decorator-suite/) | **Challenge** | 40 min | Composition order, `DecoratorContext` narrowing, getter decorators, constraining `This` |

**Run one:** `npm run check 11/02` · **Run the section:** `npm run check 11`

No `experimentalDecorators` anywhere in this section — that flag selects the
*other* implementation, and mixing them in one project is not possible. If you
add it here, these exercises stop compiling.

## What to take away

- **A decorator is `(target, context)`.** `target` is the thing being decorated
  (the method, the constructor, the get/set pair, or `undefined` for a field);
  `context` tells you `kind`, `name`, `static`, `private`, and gives you
  `access` and `addInitializer`.
- **There are two lifetimes.** The decorator body runs once, while the class is
  being defined. The function it returns runs on every call. Per-instance state
  therefore has to be keyed on `this` — a `Map` in the decorator body is shared
  by the whole class.
- **Always return a `function`, never an arrow,** and forward `this` with
  `target.call(this, …)`. An arrow silently captures the wrong receiver.
- **Decorators cannot change types.** A field decorator cannot retype a field; a
  class decorator that returns an augmented subclass does not widen the class's
  declared type. Runtime behaviour is all you get.
- **A factory is a function returning a decorator.** It runs at *evaluation*
  time, before any decorator is *applied*.
- **Evaluation is top-down; application is bottom-up.** So the decorator nearest
  the declaration is the innermost wrapper, and at call time the topmost runs
  first. Ordering `@audited` above `@requireOpen` rather than below it is the
  difference between an audit log you can trust and one you cannot.
- **`context.addInitializer` is the only per-instance hook.** It is how `@bound`
  works, and it runs before field initializers.
- **`accessor x = 1`** exists so decorators have a get/set pair to wrap; a plain
  field gives them nothing but its initial value.

## Interview questions this section prepares you for

- What arguments does a decorator receive, and what can it return?
- Two decorators on one method — which runs first? (And why is the answer
  different for evaluation and application?)
- Can a decorator add a property to a class, or change a property's type?
- Where would you put a cache in a method decorator so it is per-instance?
- What is the `accessor` keyword for?
- How would you implement `@bound`, and why can it not be done by returning a
  replacement method?
- **You have `@Transactional` and `@Retry` on the same method. Does the order
  matter?** (11/04 is the full answer.)
- Why does TypeScript have two decorator implementations, and can you mix them?
  (Section 12.)
