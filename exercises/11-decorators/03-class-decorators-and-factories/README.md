# 11/03 — Class decorators and decorator factories

**Tier:** Core · **Time:** ~30 min · **Course section:** 11 — Decorators (standard)

---

## Why this exercise exists

A class decorator is the same `(target, context)` function as everything else,
with the constructor as `target`. Return a constructor to replace the class,
return nothing to decorate for effect.

The second idea is the one that unlocks every real library. A decorator takes
fixed arguments, so to parameterise one you write a **factory** — a function
that returns a decorator:

```ts
@registerAs("connection")
class Connection {}
```

`registerAs("connection")` is *called*, and the decorator it returns is
*applied*. Those are two different moments, and they happen in opposite orders
when decorators are stacked. "What is the order?" is a stock interview question
and TODO 5 makes you derive the answer rather than memorise it.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `StandardClassDecorator<Class>` — note the `\| void`. |
| 2 | `@sealed` seals the constructor and prototype, but not instances. |
| 3 | `@registerAs("connection")` — a factory that files the class in `registry`. |
| 4 | `@singleton` replaces the class so `new` always yields the same instance. |
| 5 | `@trace(label)` records `eval:` / `apply:` / `ready:` — the exact order is asserted. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.
- No `experimentalDecorators` — this section is the standard flavour.
- `@singleton` must keep `instanceof` working.

## Done when

```bash
npm run check 11/03
```

<details>
<summary>Hint 1 — what a factory actually is</summary>

```ts
export function registerAs(id: string) {
  // ── evaluation: runs when `@registerAs("x")` is read ──
  return function <Class extends AnyClass>(
    target: Class,
    context: ClassDecoratorContext<Class>,
  ): void {
    // ── application: runs when the decorator is used ──
  };
}
```

Two nested functions, two lifetimes. Keeping the inner one generic is what lets
one factory serve every class.
</details>

<details>
<summary>Hint 2 — TODO 2 touches two objects</summary>

A class is two objects: the constructor (statics) and `Constructor.prototype`
(methods). Sealing one does not seal the other, and neither seals instances
already created — the tests check all three.
</details>

<details>
<summary>Hint 3 — TODO 4 without a cast</summary>

The obvious move is to return a subclass:

```ts
return class extends target { … };   // TS2545
```

TypeScript refuses: *"A mixin class must have a constructor with a single rest
parameter of type `any[]`"* — and `any` is banned here. That is a real
constraint, not a puzzle; the explanation covers why the rule exists.

A `Proxy` sidesteps it entirely, because `new Proxy(target, handler)` is typed
`<T extends object>(target: T, …) => T`:

```ts
return new Proxy(target, {
  construct(inner, args, newTarget) { … },
});
```

Return the cached instance from the `construct` trap, or build one with
`Reflect.construct(inner, args, newTarget)` the first time. Passing `newTarget`
through is what keeps `instanceof` honest.
</details>

<details>
<summary>Hint 4 — TODO 5, reason it out</summary>

The class has:

```ts
@trace("outer")
@trace("inner")
class Service {}
```

Ask three questions in order.

1. When is `trace("outer")` *called*? It is an expression in the class header —
   the runtime has to evaluate it before it can use it. Expressions are
   evaluated in source order.
2. When is the decorator it returned *applied*? After all the expressions have
   been evaluated. Decorators compose like function calls:
   `outer(inner(Service))` — so the innermost runs first.
3. When does `addInitializer` fire? After every decorator on the class is done,
   with `this` bound to the finished class.

Six entries, and the test spells out the expected array. If yours disagrees,
read the array — it is the answer to the interview question.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
the mixin `any[]` rule, why a replacement class cannot widen the class's type,
and the ordering rules in full.
