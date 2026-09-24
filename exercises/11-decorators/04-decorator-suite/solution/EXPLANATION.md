# 11/04 — A decorator suite

## Composition is function composition

```ts
@audited
@requireOpen
withdraw(amount: number): number { … }
```

is, near enough,

```ts
withdraw = audited(requireOpen(withdraw));
```

The decorator written **closest to the member is applied first**, so it becomes
the innermost wrapper. The one furthest away is applied last and ends up
outermost. Calls therefore travel *down* the list at runtime: `audited` runs,
then `requireOpen`, then the original method.

That is why this exercise's ordering requirement has only one answer.
`requireOpen` throws when the account is closed. For `audited` to see that
throw, `audited` must be on the outside — which means it must be written
**above**. Reverse the two lines and `requireOpen` throws before `audited` is
ever entered, and the refused withdrawal leaves no trace at all.

An audit log that only records successes is worse than no audit log, because it
is trusted. This is a real failure mode, not a puzzle.

## `try`/`catch`, not `finally`

```ts
try {
  const result = target.call(this, ...args);
  recordAudit(this, { method, args, ok: true });
  return result;
} catch (error) {
  recordAudit(this, { method, args, ok: false });
  throw error;
}
```

`finally` would be shorter, but it cannot tell you *whether* the call succeeded
without an extra flag, and a `return` inside `finally` silently discards a
pending exception. Two explicit branches, and `throw error` to rethrow —
never `throw new Error(...)`, which would destroy the original stack and type.

Note also that the audit is written **after** the call, not before. Recording
before would log an attempt that a synchronous throw never actually completed.

## The full ordering

Measured from `makeOrderDemo`, whose every decorator is a `trace`:

```
eval:outerClass          ── all expressions first, top-down, source order
eval:innerClass
eval:field
eval:accessor
eval:outerMethod
eval:innerMethod
eval:getter
eval:staticMethod

apply:staticMethod       ── static members
apply:accessor           ── instance non-field members, source order,
apply:innerMethod            each member's own stack bottom-up
apply:outerMethod
apply:getter
apply:field              ── instance fields
apply:innerClass         ── the class itself, bottom-up
apply:outerClass
```

Four rules are guaranteed by the language and worth memorising:

1. **Every decorator expression is evaluated before any decorator is applied.**
   Factories all run first. If a factory has a side effect, it happens whether
   or not the decorator it returns does anything.
2. **Expressions evaluate top-down**, in the order you wrote them.
3. **Decorators stacked on one member apply bottom-up.**
4. **Class decorators apply last**, after every member.

The interleaving between kinds — statics first, instance fields last — is the
part nobody recites from memory. The reason fields come last is that a field
decorator does not install anything on the class; it contributes an initializer
that runs per instance, so it has nothing to do with the class's shape and is
handled after the members that do.

Then, later still, `addInitializer` callbacks run: instance ones at construction
(before field initializers — see 11/02), class ones once the class is complete.

## One decorator, every kind

```ts
function (value: unknown, context: DecoratorContext): void
```

`DecoratorContext` is the union of all seven context types, discriminated by the
literal `kind` field. Two facts make a universal decorator possible:

- a parameter typed as the union accepts any specific context (parameters are
  checked contravariantly, so a wider parameter type is always acceptable);
- `void` is a valid return for every decorator kind.

The moment you want to *do* something kind-specific you have to narrow, and the
compiler forces you to:

```ts
if (context.kind === "class") { … }    // `name` is string | undefined here
else { String(context.name) }          // string | symbol everywhere else
```

A class expression need not be named, which is why `ClassDecoratorContext.name`
is optional and the union cannot be read through without narrowing. This is
discriminated-union narrowing (04/02) applied to a built-in type — a good
reminder that the standard library is designed to be narrowed, not cast.

## Getters are not accessors

| Declaration | Context type | Receives | Returns |
|---|---|---|---|
| `get x() {}` | `ClassGetterDecoratorContext` | the getter function | a replacement function |
| `accessor x = 1` | `ClassAccessorDecoratorContext` | `{ get, set }` | `{ get?, set?, init? }` |

`@rounded` is a getter decorator, so it wraps a function exactly like a method
decorator does. Mixing the two up is easy — they both sound like "accessor" in
English — and the compiler catches it, which is why the test asserts it does.

## Constraining `This`

```ts
function requireOpen<This extends { readonly isOpen: boolean }, …>
```

`This` is inferred from the class the decorator is applied to, so the constraint
is a **requirement on the decorated class**, checked at the point of use. This is
how a decorator says "I only make sense on something with this shape" — a class
without `isOpen` fails to compile with a clear message, rather than throwing at
runtime somewhere unrelated.

Frameworks lean on this heavily: it is how a `@Column` decorator can insist on
being used inside something entity-shaped.

## Common mistakes

| Mistake | What happens |
|---|---|
| `@requireOpen` above `@audited` | The refusal is never audited |
| `finally` instead of `catch` | Cannot distinguish success from failure without an extra flag |
| `throw new Error(…)` when rethrowing | Original stack and error type are lost |
| Recording the audit before the call | A throwing call is logged as if it completed |
| A shared `AuditEntry[]` instead of a per-instance trail | Instances contaminate each other |
| Reading `context.name` without narrowing `kind` | Does not compile — class contexts have an optional name |
| Typing `trace`'s context as one specific kind | It stops fitting the other five |
| Using an accessor decorator on `get x()` | Wrong context type; the compiler rejects it |

## Interview angle

> *"Two decorators on one method — which runs first?"*

Separate the two questions. The decorator *expressions* are evaluated top-down
before anything is applied; the decorators themselves are *applied* bottom-up,
so the lowest is the innermost wrapper. At call time that reverses again: the
outermost wrapper — the topmost decorator — runs first. Then give the concrete
consequence: an error-handling decorator has to sit above the decorator whose
errors it means to see.

> *"You have `@Transactional` and `@Retry` on the same repository method. Does
> the order matter?"*

Enormously, and it is the same question in production clothing. `@Retry` outside
`@Transactional` retries the whole transaction — each attempt gets a fresh one.
`@Transactional` outside `@Retry` retries inside a single transaction that has
very likely already been marked rollback-only, so every retry fails. Being able
to reason about which wrapper is outer, from the source order, is the actual
skill this section is teaching.
