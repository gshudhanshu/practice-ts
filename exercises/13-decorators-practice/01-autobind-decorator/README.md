# 13/01 — The autobind decorator

**Tier:** Core · **Time:** ~25 min · **Course section:** 13 — Decorators practice

---

## Where this fits

Part 1 of the section-13 project. Everything here uses **standard (TC39)
decorators** — the ones TypeScript compiles when `experimentalDecorators` is
off and the target is ES2022 or newer. That is the default in this repo, and it
is the flavour that will survive, because it is the one browsers and Node are
implementing.

A method decorator is a function of two arguments:

```ts
(target, context) => replacementMethod | void
```

`target` is the method. `context` tells you where it landed —
`context.name`, `context.kind`, `context.static`, `context.private` — and gives
you `context.addInitializer(fn)`, a hook that runs when an instance is built.

[05/03](../../05-modernjs/03-arrow-functions-and-this/README.md) already solved
"a detached method loses `this`" with an arrow-function class field. This
exercise solves the same problem a second way, so you can compare the two. That
comparison is the point — `this` itself is not re-taught here.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `logCalls` — records `context.name` on every call, then delegates. |
| 2 | `autobind` — the method survives being detached. Via `addInitializer`, **not** a replacement. |
| 3 | `once` — memoise the first result, **per instance**. |
| 4 | `deprecate(reason)` — a decorator **factory**; warns once per method, ever. |
| 5 | Wire all four onto `Toolbar`, in the right order. |

### The ordering trap in TODO 5

Decorators are applied **bottom-up**. The one nearest the method runs first, and
its result is what the decorator above it receives. So one of these logs when
the detached copy is called and the other silently does not:

```ts
@autobind      @logCalls
@logCalls  vs  @autobind
save() {}      save() {}
```

One test checks exactly this.

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.
- Do not set `experimentalDecorators`. These are the standard decorators.
- `autobind` must not return a replacement method.

### One thing that differs from every other exercise

A decorator runs when the **class is defined**, which is when the module loads.
A starter body that threw would kill the whole test file before a single test
ran, so the starters here are harmless no-ops instead. They compile and they
load; they just do not do anything yet.

## Done when

```bash
npm run check 13/01
```

<details>
<summary>Hint 1 — the shape of a replacement method</summary>

Return a `function` expression, never an arrow. An arrow captures the `this` of
the decorator body, which is not an instance. A `function` gets `this` from the
caller, which is what makes it still a method.

```ts
return function (this: This, ...args: Args): Return {
  callLog.push(String(context.name));
  return target.call(this, ...args);
};
```
</details>

<details>
<summary>Hint 2 — why autobind cannot be a replacement</summary>

A replacement method still lives on the **prototype**. `toolbar.save` reads it
from there and hands you a naked function, exactly as before — you have wrapped
the problem, not fixed it.

Binding needs an instance, and an instance only exists during construction.
That is what `context.addInitializer` gives you:

```ts
context.addInitializer(function (this: This) {
  Object.defineProperty(this, context.name, { … });
});
```

Inside that callback `this` is the new instance, so `target.bind(this)` is a
copy that can never lose it. Install it as an **own** property and it shadows
the prototype method. Keep it non-enumerable, like a real method.
</details>

<details>
<summary>Hint 3 — per-instance state without a cast</summary>

The decorator body runs once per decorated method, so anything you declare
there is private state for that method:

```ts
const cache = new WeakMap<This, { value: Return }>();
```

`WeakMap` so a discarded instance takes its entry with it, and the `{ value }`
wrapper so a cached `undefined` is distinguishable from a miss. Both halves are
already correctly typed — reach for `as` here and you have gone wrong.
</details>

<details>
<summary>Hint 4 — a factory returns a generic function</summary>

`@autobind` is a reference; `@deprecate("…")` is a **call**. So `deprecate`
returns the decorator, and that returned function has to stay generic, because
it will be applied to methods with different signatures:

```ts
export function deprecate(reason: string): <This, Args extends unknown[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>,
) => (this: This, ...args: Args) => Return {
  return function (target, context) { … };
}
```

The `warned` flag goes in the returned decorator's body, not in the wrapper —
that is what makes it one warning per method rather than one per call.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it sets
the decorator against the arrow-field approach from 05/03 and says when each
one wins — then move on to
[13/02](../02-validation-decorators/README.md).
