# 12/03 — Migrating from legacy to standard

**Tier:** Challenge · **Time:** ~40 min · **Course section:** 12 — Experimental decorators

---

## Why this exercise exists

Two behaviours — logging a call, and binding a method to its instance — written
twice, once in each flavour. Doing them side by side is the fastest way to see
which differences are cosmetic (the wrapper body is identical) and which are
structural (`@bound` uses a completely different mechanism in each).

There is a catch, and it is the lesson. **`experimentalDecorators` is a
per-compilation switch.** It changes what `@` means for every file in the
program, so the two flavours cannot coexist — you cannot have a legacy `@` in
one file and a standard `@` in another. This directory has the flag on, so `@`
here is always legacy.

The standard decorators are therefore written as ordinary functions with the
correct standard signature and applied by a mini-runtime you write in TODO 3.
That runtime is, in miniature, the `__esDecorate` helper TypeScript emits.
Writing it once is the fastest route from "decorators are magic" to "decorators
are a protocol".

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `@legacyLogged` — three arguments, mutate `descriptor.value`. |
| 2 | `standardLogged` — two arguments, return the replacement. |
| 3 | `applyStandardMethodDecorator` — build the context, apply, install, collect initializers. |
| 4 | `standardBound` — `context.addInitializer`, returns nothing. |
| 5 | `@legacyBound` — return a descriptor with a **getter** that binds and caches. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.
- Keep `experimentalDecorators` in this exercise's `tsconfig.json`. Removing it
  breaks TODOs 1 and 5; there is no configuration in which both `@`s work.
- `standardLogged` and `standardBound` must never be applied with `@`.

## Done when

```bash
npm run check 12/03
```

<details>
<summary>Hint 1 — the context object, field by field</summary>

```ts
const context: ClassMethodDecoratorContext<This, Method> = {
  kind: "method",
  name,
  static: false,
  private: false,
  access: {
    has: (object) => name in object,
    get: (object) => object[name],
  },
  addInitializer(initializer) { … },
  metadata: {},
};
```

Compare it with what the compiler emits for a real decorator — the shape is the
same, and `access.get` really is a property read.

`This extends Record<Key, …>` in the signature is what makes `object[name]`
typed: with a plain `name: string`, the read is untyped and the whole runtime
needs a cast. Same trick as 08/02's `sortByKey`.
</details>

<details>
<summary>Hint 2 — the order of operations in TODO 3</summary>

1. collect initializers in an array, with a `finished` flag beside it;
2. call `decorator(method, context)`;
3. set `finished = true` — *after* the call, so `addInitializer` works during
   decoration and throws afterwards;
4. if a replacement came back, `Object.defineProperty` it onto the prototype
   with `enumerable: false` (methods are not enumerable; a plain assignment
   would make yours the exception);
5. return a function that calls each initializer with `initializer.call(instance)`.
</details>

<details>
<summary>Hint 3 — TODO 5 is the interesting half of the comparison</summary>

Legacy has no per-instance hook, so `@bound` cannot be done the way TODO 4 does
it. Return a descriptor with a **getter** instead of a value:

```ts
get(this: unknown) {
  const bound = original.bind(this);
  Object.defineProperty(this, propertyKey, { value: bound, … });
  return bound;
}
```

The first read from an instance binds, caches the result as an own property of
that instance, and returns it. Every later read finds the own property and never
reaches the getter. Self-overwriting getters are a standard JavaScript idiom;
this is one of the places they earn their keep.
</details>

<details>
<summary>Hint 4 — where `initialize` gets called</summary>

`makeStandardCounter` calls the returned initializer from its constructor,
through a `let` assigned just after the class. That looks odd because it is
plumbing the compiler normally writes for you — a `__runInitializers(this, …)`
call injected into the constructor. Leave it as it is; TODO 4 only has to
register the initializer.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it has the
full comparison table, and explains exactly why Angular and NestJS cannot move
and why the flavours cannot be mixed.
