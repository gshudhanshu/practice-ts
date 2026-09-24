# 20/04 — Function types: `ReturnType`, `Parameters`, `InstanceType`, `Awaited`

**Tier:** Core → Challenge · **Time:** ~30 min · **Course section:** 20 — Utility types from scratch

---

## Why this exercise exists

The object utilities are mapped types. These four are conditional types with
`infer`: you write the shape of a function and put `infer` where you want a
piece handed back.

```ts
type MyReturnType<T extends AnyFunction> =
  T extends (...args: never[]) => infer R ? R : never;
```

Three of them are two-liners. `Awaited` is not, and that is why it is here: it
looks like `T extends Promise<infer U> ? … : T`, and that version is **wrong**,
because `await` unwraps anything with a callable `then`, not just a `Promise`.
The real definition in `lib.es5.d.ts` is nine lines, and every one of them is
there for a reason you can articulate afterwards.

`infer` and recursion are [`10/04`](../../10-deriving-types/04-conditional-types/).
Reaching into a library's types with `typeof SomeClass` is
[`10/01`](../../10-deriving-types/01-keyof-and-typeof/) and
[`10/02`](../../10-deriving-types/02-indexed-access/).

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `MyReturnType<T>` — including the overloaded-function case. |
| 2 | `MyParameters<T>` — the whole list, as a tuple, names intact. |
| 3 | `MyInstanceType<T>` — must accept abstract classes. |
| 4 | `MyAwaited<T>` — promises, nested promises, and any thenable. |
| 5 | `callDescribe(args)` — spread a `MyParameters` tuple into a call. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`. `AnyFunction` is given precisely so you do not need
  `any` in a constraint.
- Do not use the built-in `ReturnType` / `Parameters` / `InstanceType` /
  `Awaited`.

## Done when

```bash
npm run check 20/04
```

<details>
<summary>Hint 1 — where `infer` goes</summary>

Anywhere in the pattern. Return position gives you the result type; rest-
parameter position gives you the whole parameter list as a tuple:

```ts
T extends (...args: never[]) => infer R ? R : never   // ReturnType
T extends (...args: infer P) => unknown ? P : never   // Parameters
```

Note you never write `infer` twice for two parameters — one `infer` in the rest
position captures all of them.
</details>

<details>
<summary>Hint 2 — constructors</summary>

```ts
T extends abstract new (...args: never[]) => infer R ? R : never
```

Drop the `abstract` and `MyInstanceType<typeof Job>` stops matching: a concrete
constructor type is not a supertype of an abstract one. `abstract new` accepts
both.
</details>

<details>
<summary>Hint 3 — `Awaited` needs the thenable shape, not `Promise`</summary>

Match on structure:

```ts
T extends object & { then(onfulfilled: infer F, ...args: never[]): unknown }
```

`F` is now the callback type. A second conditional pulls its first parameter
out — `F extends (value: infer V, ...args: never[]) => unknown` — and `V` is
what you recurse on. If `F` is not callable, nothing can ever come out: `never`.
</details>

<details>
<summary>Hint 4 — the three-way structure of TODO 4</summary>

```text
null | undefined      -> T          (kept for non-strict codebases)
looks like a thenable -> recurse into the callback's first parameter
anything else         -> T
```

Recursion is what flattens `Promise<Promise<T>>` — and it is also what makes a
thenable that resolves to a promise come out fully unwrapped.
</details>

<details>
<summary>Hint 5 — TODO 5 is one line</summary>

`args` is a tuple, so spread it: `describeUser(...args)`. It typechecks because
`typeof describeUser` is a concrete type — nothing is deferred. Try writing the
same wrapper generically over `F` and watch it stop compiling; the explanation
covers why, and what to do instead.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
the `any` in the standard library's constraints, why overloads resolve to the
last signature, and how to write a generic wrapper that actually compiles.
