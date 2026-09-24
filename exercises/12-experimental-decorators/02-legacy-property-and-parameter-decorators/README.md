# 12/02 — Legacy property and parameter decorators

**Tier:** Core · **Time:** ~30 min · **Course section:** 12 — Experimental decorators

---

## Why this exercise exists

```ts
PROPERTY   (target, propertyKey)                  -> void
PARAMETER  (target, propertyKey, parameterIndex)  -> void
```

Both look useless. A property decorator gets no descriptor, so it cannot read
the value, intercept a write, or change the type. A parameter decorator gets an
index and nothing else — not the value, not the argument's type, not even a
name.

All they can do is **record something in a side table** for a method or class
decorator to read back later. That indirection is the entire pattern, and once
you have written it, NestJS's constructor injection and class-validator's
`@IsEmail` stop being magic. TODO 5 is a dependency-injection container in
fifteen lines.

Parameter decorators are also legacy-only: the standard proposal has no such
thing, which is the single biggest reason Angular and NestJS have not moved.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `@label("Email address")` files a label under the property name. |
| 2 | `@required` records the parameter's index for that method. |
| 3 | `@validate` reads that back at call time and throws `"save: argument 0 is required"`. |
| 4 | `@Inject("greeting")` records a token **by index** on the constructor. |
| 5 | `resolve(Class, container)` builds an instance from the recorded tokens. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.
- Keep `experimentalDecorators` in this exercise's `tsconfig.json`.
- `emitDecoratorMetadata` stays **off**. The explanation covers what it would
  add, and why turning it on needs `reflect-metadata` at runtime.

## Done when

```bash
npm run check 12/02
```

<details>
<summary>Hint 1 — a property decorator cannot see the property</summary>

At decoration time the class body has been read but no instance exists, so
`email` has no value anywhere. `target` is the prototype; the property will be
created per instance later. Recording the name is all that is available.

That is why every validation library works in two halves: an annotation that
records, and something later that reads.
</details>

<details>
<summary>Hint 2 — TODO 3 reads late</summary>

```ts
descriptor.value = function (this: unknown, ...args: Args): Return {
  const indices = requiredParams.get(propertyKey) ?? [];
  …
};
```

Look the indices up **inside** the wrapper, at call time, not in the decorator
body. It keeps the two decorators independent of each other's ordering, and it
is what real frameworks do.
</details>

<details>
<summary>Hint 3 — TODO 4 has two traps</summary>

For a **constructor** parameter, `propertyKey` is `undefined` — there is no
member being decorated — and `target` is the class itself. Your signature has to
allow the `undefined`.

Second: parameter decorators are applied **right to left**. `push` gives you
`["name", "greeting"]`. Assign by index instead:

```ts
tokens[parameterIndex] = token;
```
</details>

<details>
<summary>Hint 4 — TODO 5 walks the arity</summary>

Iterate `0 … ctor.length - 1`, not the recorded token array. A trailing
parameter with no `@Inject` leaves no entry, and a container that quietly
constructs with too few arguments is worse than one that refuses.

`Reflect.construct(ctor, args)` is the only way to spread a runtime array into
`new`. It returns `any`, so assign it to a `T`-typed local rather than casting.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
why these decorators cannot change types, what `emitDecoratorMetadata` and
`reflect-metadata` add, and how the annotate-then-read pattern scales.
