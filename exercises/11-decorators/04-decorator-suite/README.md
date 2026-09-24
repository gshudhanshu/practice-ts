# 11/04 — A decorator suite

**Tier:** Challenge · **Time:** ~40 min · **Course section:** 11 — Decorators (standard)

---

## Why this exercise exists

Everything from 11/01–11/03, on one class, at once — which surfaces two things a
single decorator never does.

**Composition.** `@a @b m()` becomes `a(b(m))`, so the decorator written closest
to the member is the innermost wrapper. Swap two lines and the behaviour
changes. Here that is not trivia: only one of the two orderings gives you an
audit log that records refused operations, which is exactly the class of bug
that ships to production and is found during an incident.

**Order across kinds.** A class body has fields, accessors, methods, getters,
statics and the class itself. They are *not* decorated in the order you read
them, and TODO 1 builds the instrument that shows you the real sequence.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `trace(label)` — one factory that fits every decorator kind, narrowing on `context.kind`. |
| 2 | `@requireOpen` — throws `Error("account is closed")`; constrains `This` so a class without `isOpen` will not compile. |
| 3 | `@audited` — per-instance trail via `recordAudit`, recording failures too, then rethrowing. |
| 4 | `@rounded` — a **getter** decorator, rounding to two decimal places. |
| 5 | Decorate `Account` so a refused withdrawal is still audited. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.
- No `experimentalDecorators` — this section is the standard flavour.
- In TODO 5, add decorator lines only. Do not change the method bodies, and do
  not add a `try`/`catch` to `withdraw` — the ordering has to do the work.
- `@audited` must never swallow an error.

## Done when

```bash
npm run check 11/04
```

<details>
<summary>Hint 1 — one decorator, every kind</summary>

```ts
return function (_value: unknown, context: DecoratorContext): void { … };
```

`DecoratorContext` is the union of all seven context types, discriminated by
`kind`. A parameter typed as the union accepts any specific one, and returning
`void` is valid for every kind — that combination is what makes a universal
decorator possible.

You cannot read `context.name` off the union: `ClassDecoratorContext.name` is
`string | undefined` (a class expression need not be named) while every member
context has `string | symbol`. Narrow first:

```ts
if (context.kind === "class") { … return; }
// here `context` is a member context, and `.name` is string | symbol
```
</details>

<details>
<summary>Hint 2 — constraining the receiver</summary>

```ts
export function requireOpen<
  This extends { readonly isOpen: boolean },
  Args extends unknown[],
  Return,
>(…)
```

`This` is inferred from the class the decorator lands on, so the constraint is
checked at the point of application. That is how a decorator states a
requirement about the class it is used on — and the tests include a class
without `isOpen` that must fail to compile.

`readonly` in the constraint is deliberate: the decorator only reads the flag,
and a mutable `isOpen` is still assignable to a readonly one.
</details>

<details>
<summary>Hint 3 — TODO 5 is the exercise</summary>

Both of these compile. Only one satisfies the tests:

```ts
@audited          @requireOpen
@requireOpen      @audited
withdraw(…)       withdraw(…)
```

Work through what each produces. Application is bottom-up, so the lower
decorator wraps the original method and the upper one wraps *that*. Then ask:
which wrapper is on the outside when `requireOpen` throws, and can the other one
see it?
</details>

<details>
<summary>Hint 4 — reading the ordering test</summary>

If `apply:` entries come out in an order you did not expect, that is the lesson,
not a bug. The stable, language-level rules are:

- every decorator **expression** is evaluated before any decorator is applied;
- expressions evaluate top-down, in source order;
- decorators stacked on one member apply bottom-up;
- the class's own decorators apply last.

The interleaving *between* member kinds — statics before instance members,
fields after everything else — is the part nobody memorises. The test spells it
out; the explanation says why it is that way.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
the full ordering table, why an audit decorator must use `try`/`catch` rather
than `finally`, and where this pattern shows up in real frameworks.
