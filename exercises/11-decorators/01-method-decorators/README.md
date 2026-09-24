# 11/01 — Method decorators

**Tier:** Drill → Core · **Time:** ~20 min · **Course section:** 11 — Decorators (standard)

---

## Why this exercise exists

A standard decorator is a plain function the runtime hands two arguments while
the class is being defined:

```ts
(target, context) => replacement | void
```

That is the whole API. Once the shape is muscle memory, every other decorator
kind is a variation on it — and the `(target, context)` signature is the first
thing an interviewer asks about, because it is what changed between the legacy
flavour (section 12) and the standard one.

Two behaviours catch people out, and both are tested here:

- The replacement function is built **once per class**, not once per instance.
  Anything you close over is shared by every instance.
- You must forward `this` explicitly. An arrow function silently loses the
  receiver.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `StandardMethodDecorator<This, Args, Return>` — the shape, named once. |
| 2 | `@logged` records `{ kind: "call", method, args }` and returns the original result. |
| 3 | `@timed` records `{ kind: "timing", method, ms }` with a non-negative `ms`. |
| 4 | `@memoized` caches per argument **and per instance**. |
| 5 | `@retried` re-runs the method once on a throw — and is applied in `makeFlaky`. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.
- Do **not** add `experimentalDecorators` to `tsconfig.json`. This section is
  the standard flavour, which needs no flag at `target: ES2022`.
- Every decorator must return the original result unchanged. They observe; they
  do not alter behaviour (except `@memoized` and `@retried`, which alter *how
  often the body runs*, not what it returns).

## Done when

```bash
npm run check 11/01
```

<details>
<summary>Hint 1 — the shape, spelled out</summary>

```ts
function dec<This, Args extends unknown[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<
    This,
    (this: This, ...args: Args) => Return
  >,
): (this: This, ...args: Args) => Return {
  return function (this: This, ...args: Args): Return {
    return target.call(this, ...args);
  };
}
```

That inner `function` must not become an arrow: the replacement is installed on
the prototype and picks `this` up from the call site.

Note the method's type appears twice — once as `target`, once as the context's
second type argument. `ClassMethodDecoratorContext<This, Value>` uses `Value` to
type `context.access.get`.
</details>

<details>
<summary>Hint 2 — where to put work</summary>

The decorator body runs **once**, when the class is defined. The function you
return runs on **every call**. So:

```ts
const method = String(context.name);      // once
return function (...) {
  log.push({ kind: "call", method, args }); // every call
};
```

Computing `String(context.name)` inside the returned function is not wrong, just
wasteful — and it hides the fact that there are two very different lifetimes in
play, which is the thing to internalise.
</details>

<details>
<summary>Hint 3 — TODO 4 is the trap</summary>

```ts
export function memoized(target, context) {
  const cache = new Map();          // ← shared by EVERY instance
  return function (arg) { … };
}
```

The decorator ran once, so there is one `cache` for the whole class. Two
different `Squarer` instances would share results — the test catches it.

Key the cache on the receiver instead:

```ts
const caches = new WeakMap<This, Map<Arg, { value: Return }>>();
```

`WeakMap` rather than `Map` so a discarded instance is still collectable.

The `{ value }` wrapper matters too: `Map.get` returns `Return | undefined`, and
`!` is banned. Wrapping also keeps a legitimately-`undefined` result
distinguishable from a cache miss.
</details>

<details>
<summary>Hint 4 — TODO 5 has two halves</summary>

Implement `retried`, then go down to `makeFlaky` and actually put `@retried` on
`fetch`. The tests check both: one asserts the retry record, another builds its
own always-failing class to prove the second error escapes.
</details>

<details>
<summary>Hint 5 — why the classes live inside factories</summary>

A decorator runs while its class is being *defined*. If the classes sat at
module scope, the starter's `throw new Error("TODO 2: …")` would fire during
`import`, killing test collection and hiding every other failure — CONVENTIONS
rule 2. A factory defers that to the moment a test asks for a class, and hands
each test a fresh one.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
the two lifetimes, why `this` typing is a type parameter rather than `any`, and
what `context.access` and `context.addInitializer` are for.
