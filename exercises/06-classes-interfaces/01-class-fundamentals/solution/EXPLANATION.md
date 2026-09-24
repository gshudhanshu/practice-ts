# 06/01 — Class fundamentals & access modifiers

## Parameter properties

```ts
constructor(public readonly owner: string, private balanceCents: number) {}
```

An access modifier (`public`, `private`, `protected`, `readonly`) on a
constructor parameter declares the field **and** assigns it. Without it you
write each name three times: field declaration, parameter, assignment.

This is TypeScript-only syntax with no JavaScript equivalent, which is why it is
worth knowing the objections:

- It is invisible unless you know the feature — a reader sees a parameter and
  has to know it also creates a field.
- It does not work with `--erasableSyntaxOnly` (TS 5.8+), the mode that lets
  Node run `.ts` files directly by stripping types. Neither does `enum` or
  namespaces.
- Mixing parameter properties with ordinary field declarations makes
  initialisation order hard to follow.

Common team positions: "use them for simple DI-style constructors" or "avoid
them entirely for portability". Both are defensible; having a reason is what
matters.

## `private` vs `#private` — the difference that matters

```ts
class A {
  private a = 1;   // TypeScript: compile-time only
  #b = 2;          // JavaScript: genuinely private at runtime
}
```

| | `private` | `#field` |
|---|---|---|
| Enforced by | the compiler | the runtime |
| Visible via `obj["a"]` | **yes** | no |
| Visible in `JSON.stringify` | **yes** | no |
| Visible in the debugger / `Object.keys` | **yes** | no |
| Accessible from another instance of the same class | yes | yes |
| Works in `.js` files | no | yes |

TypeScript's `private` is erased at compile time — it is a *convention the
compiler checks*, not a security boundary. `(account as any).balanceCents`
reads it happily, and so does anything written in plain JavaScript.

Use `#` when privacy must actually hold at runtime (libraries, anything
security-adjacent). Use `private` when you want compile-time discipline plus
easy testing and debugging. Note that `#` **cannot** be used in a parameter
property, which is precisely why this exercise uses `private`.

## `private` is per-class, not per-instance

```ts
transferTo(other: BankAccount, cents: number) {
  other.balanceCents;   // compiles! same class
}
```

This surprises people coming from languages with per-instance privacy. It is
what makes `equals`, `compareTo` and `merge` methods writable at all.

But the solution routes through the public methods anyway:

```ts
if (!this.withdraw(cents)) return false;
other.deposit(cents);
```

Because the validation and the insufficient-funds rule now live in **one**
place. If someone later adds an overdraft limit to `withdraw`, `transferTo`
inherits it automatically. Reaching into `other.balanceCents` would quietly
bypass it — the classic way a "small optimisation" becomes a production
incident.

## Getters as read-only views

```ts
get balance(): number { return this.balanceCents; }
```

Reads like a property, cannot be assigned (no setter), and lets you keep the
storage private. `BankAccount["balance"]` is `number`, so consumers never learn
that a getter is involved — you can change the implementation freely later.

Getters should be **cheap and side-effect free**. Anything that does real work,
can throw, or is asynchronous should be a method — callers reasonably assume
property access is free.

## Throw or return? Decide deliberately

| Failure | Handled as | Why |
|---|---|---|
| `deposit(-5)` | `throw RangeError` | Programmer bug. Should be loud, and there is no sensible recovery. |
| `withdraw(1001)` on a 1000 balance | `return false` | Expected business outcome. Callers must handle it. |

Get this backwards and you end up with either try/catch around ordinary control
flow, or silently ignored bugs. The rule of thumb: **throw for "this should
never happen", return for "this happens and here is what you do about it".**

`RangeError` specifically (rather than a bare `Error`) is the built-in for "a
value is outside the allowed set" — free specificity for callers who want to
distinguish it.

## Common mistakes

| Mistake | What happens |
|---|---|
| Keeping explicit fields plus `this.x = x` | Works, but TODO 1 asked for parameter properties |
| `cents > 0` without `Number.isInteger` | `2.5` and `Infinity` are accepted |
| Throwing on insufficient funds | `withdraw` returns `boolean`; the tests expect `false` |
| Deducting before checking | Balance goes negative on a failed withdrawal |
| `balance` as a public field | The `@ts-expect-error` on assignment stops erroring |
| `other.balanceCents += cents` in `transferTo` | Compiles, but bypasses validation |

## Interview angle

> *"What's the difference between `private` and `#`?"*

Compile-time versus runtime. `private` is erased and readable via bracket access
or from JavaScript; `#` is enforced by the engine. Then the practical note: `#`
is genuinely private but harder to test and cannot be a parameter property, so
most application code uses `private` and libraries reach for `#`.

> *"When do you throw versus return an error value?"*

The bug/outcome distinction above. A strong follow-up is mentioning `Result`-
style return types (`{ ok: true, value } | { ok: false, error }`) for expected
failures at a boundary — you build exactly that in the bonus sections.
