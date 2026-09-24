# 13/02 — Validation decorators

**Tier:** Core · **Time:** ~30 min · **Course section:** 13 — Decorators practice

---

## Where this fits

Part 2 of the section-13 project. 13/01 decorated methods; this one decorates
**fields**, which behave differently in two ways that matter:

1. A field decorator's `target` is `undefined`. There is no value yet — fields
   are initialised per instance, long after the class is defined.
2. `context.access.get(instance)` reads that field's current value, correctly
   typed and without a cast. That is what makes a field decorator useful at all.

This is the machinery behind every annotation-driven validation library —
class-validator, TypeORM column constraints, NestJS pipes. Decorators *register*
rules; one ordinary function *runs* them.

[09/02](../../09-classes-generics-practice/02-composable-validators/README.md)
built the same feature out of closures and an explicit rule list. Same idea,
different wiring: there you assembled the rules by hand, here they attach at the
declaration. Worth comparing the two when you finish.

## Your task

Open `exercise.ts` and resolve all five TODOs. The `Registration` class at the
bottom is already wired up; the decorators it uses are what you are writing.

| # | Requirement |
|---|---|
| 1 | `required(message?)` — blank or whitespace-only fails. Default `"is required"`. |
| 2 | `minLength(n)` — measured **after trimming**. |
| 3 | `range(min, max)` — inclusive, and only valid on `number` fields. |
| 4 | `validate(subject)` — every failing rule, in registration order. |
| 5 | `guarded` — a method decorator that throws `ValidationFailed` first. |

### What the types must enforce

```ts
class Form {
  @minLength(2) label = "";     // ok
  @range(0, 10) score = 0;      // ok
  @minLength(2) count = 0;      // compile error — string rule, number field
  @range(0, 10) name = "";      // compile error — number rule, string field
  @required   label2 = "";      // compile error — required is a factory
}
```

`FieldDecorator<Value>` is already written for you; getting `Value` invariant is
what buys those errors.

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.
- Do not set `experimentalDecorators`.
- `validate` must read values **when it runs**, not when the object was built —
  one test mutates a field and re-validates.
- The rule registry (`addRule` / `rulesFor`) is given. Use it; do not replace it.

## Done when

```bash
npm run check 13/02
```

<details>
<summary>Hint 1 — where does the rule get registered?</summary>

Not in the decorator body — that runs once, when the class is defined, and
there is no instance yet. Use the same hook as 13/01:

```ts
context.addInitializer(function (this: This) {
  addRule(this, { field, check: … });
});
```

For a field decorator, that callback runs once per instance, just after the
field is initialised, with `this` bound to the object.
</details>

<details>
<summary>Hint 2 — reading the value without a cast</summary>

`context.access.get` is typed `(object: This) => Value`, so for a
`FieldDecorator<string>` it hands you a `string`:

```ts
check: () => (context.access.get(this).trim() === "" ? "is required" : null),
```

Put the read **inside** `check`, not outside it. Read it outside and you have
frozen the value the object had at construction time, and the
"reads the value at validation time" test will tell you so.
</details>

<details>
<summary>Hint 3 — why inheritance already works</summary>

Rules are keyed by **instance**, not by class. Constructing a
`TeamRegistration` runs the base class's field initialisers and its own, both
against the same object, so all four rules land in one list — base fields first,
because `super()` runs first.

A per-class registry would have needed explicit prototype-chain walking to
achieve the same thing.
</details>

<details>
<summary>Hint 4 — `guarded` does not need to know about fields</summary>

It validates `this`, and `this` is the very key the rules were filed under:

```ts
const errors = validate(this);
if (errors.length > 0) throw new ValidationFailed(errors);
return target.call(this, ...args);
```

That separation is the whole design: field decorators only ever *register*, and
the method decorator only ever *runs*.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
why `context.metadata` is the wrong place to keep this, and what it costs to
move validation into the type system instead — then move on to
[13/03](../03-observable-model/README.md).
