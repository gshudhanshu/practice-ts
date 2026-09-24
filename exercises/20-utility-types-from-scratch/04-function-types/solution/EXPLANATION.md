# 20/04 — Function types

## The three easy ones

```ts
type MyReturnType<T extends AnyFunction>   = T extends (...args: never[]) => infer R ? R : never;
type MyParameters<T extends AnyFunction>   = T extends (...args: infer P) => unknown ? P : never;
type MyInstanceType<T extends AnyConstructor> =
  T extends abstract new (...args: never[]) => infer R ? R : never;
```

One `infer`, one pattern. Two details are worth more than the syntax.

### `never[]` instead of `any`

The standard library writes `(...args: any) => any`. That is not laziness so
much as history — `ReturnType` predates a lot of the alternatives — but it does
leak: `any` in a constraint means an `any`-typed value satisfies it, and
`ReturnType<any>` is `any`.

`(...args: never[]) => unknown` is the honest version and works because
parameters are checked **contravariantly**: to be assignable to a function
accepting `never[]`, your function's parameters only need to accept `never`, and
every type does. So the constraint admits any function while promising nothing.

Use the same shape whenever you constrain a generic to "some function" (08/02).

### `abstract new`

`typeof SomeClass` is the *constructor*, not the instance (10/01), and an
abstract class's constructor type is not assignable to `new (…) => …`. Writing
`abstract new` in the pattern accepts both kinds. Miss it and
`InstanceType<typeof Job>` fails with a message that never mentions the word
`abstract`.

### Overloads resolve to the last signature

```ts
type Overloaded = { (input: string): string; (input: number): number };
MyReturnType<Overloaded>   // number
```

Inference against an overloaded type picks the **last** overload, and the
built-in behaves identically. This is a real limitation, not a quirk of your
implementation: there is no way to say "the return type for the `string`
overload" with these utilities. It is also why overload-heavy APIs are painful
to wrap generically (07/03).

## `Awaited` — the one that is not a one-liner

The obvious version is wrong:

```ts
type Naive<T> = T extends Promise<infer U> ? Naive<U> : T;
Naive<Thenable<string>>   // Thenable<string>   ← but `await` gives you `string`
```

`await` does not look for a `Promise`. It looks for an object with a callable
`then` — the *thenable* protocol — which is how jQuery deferreds, `Bluebird`,
`PromiseLike` values from other realms, and any hand-rolled promise all work
with `await`. The type has to match the language:

```ts
type MyAwaited<T> = T extends null | undefined
  ? T
  : T extends object & { then(onfulfilled: infer F, ...args: never[]): unknown }
    ? F extends (value: infer V, ...args: never[]) => unknown
      ? MyAwaited<V>
      : never
    : T;
```

Line by line:

| Line | Why it exists |
|---|---|
| `null \| undefined ? T` | Unreachable under `strictNullChecks` — neither is an `object`. Kept so the type still behaves with the flag off. |
| `object & { then(…) }` | The thenable test. `object &` stops a primitive with a `then`-shaped apparent type from matching. |
| `infer F` | Captures the `then` callback so the next line can dissect it. |
| `F extends (value: infer V, …)` | Pulls out the resolved value. |
| `: never` | A `then` whose first argument is not callable can never deliver a value — `BrokenThenable` in the tests. |
| `MyAwaited<V>` | Recursion: flattens `Promise<Promise<T>>`, and unwraps a thenable that resolves to a promise. |

It also distributes, so `MyAwaited<Promise<string> | number>` is
`string | number` — `await` on a union does the same thing at runtime.

Our version differs from `lib.es5.d.ts` in exactly one place: the real one uses
`...args: infer _` and `=> any` where we use `...args: never[]` and `=> unknown`,
to keep `any` out of this repo. The behaviour on every test here is identical.

## The generic-wrapper trap

TODO 5 is deliberately concrete:

```ts
export function callDescribe(args: MyParameters<typeof describeUser>): MyReturnType<typeof describeUser> {
  return describeUser(...args);
}
```

`typeof describeUser` is a resolved type, so both conditionals evaluate and the
spread checks against the real signature. Now make it generic:

```ts
function wrap<F extends AnyFunction>(fn: F): (...args: MyParameters<F>) => MyReturnType<F> {
  return (...args) => fn(...args);
  //                  ^ Type 'unknown' is not assignable to type 'MyReturnType<F>'
}
```

Inside the function `F` is unresolved, so both utilities are **deferred
conditionals** and the compiler cannot check anything against them (10/04,
10/06). The fix is not a cast — it is to stop asking for a conditional at all,
and infer the pieces directly:

```ts
function wrap<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R {
  return (...args) => fn(...args);          // compiles, no cast
}
```

Same call-site ergonomics, and now the parameter list and return type are plain
type parameters the compiler can reason about. **When you are writing the
generic function yourself, infer the parts; reach for `Parameters` and
`ReturnType` when the function type is handed to you from outside.**

## Where these show up for real

- `Parameters<typeof handler>` to type a middleware wrapper or a test double.
- `ReturnType<typeof createStore>` — the Redux/Zustand idiom for a store type
  nobody ever declared by hand.
- `InstanceType<typeof SomeClass>` to name an instance type a package exports
  only as a constructor (10/02).
- `Awaited<ReturnType<typeof fetchUser>>` — the single most useful composition
  in an async codebase: the type of the thing your API function resolves to.

## Common mistakes

| Mistake | What happens |
|---|---|
| `infer` per parameter | Only works for a fixed arity; the rest-position `infer` is the general form |
| `new (…) => infer R` without `abstract` | Abstract classes stop matching |
| `T extends Promise<infer U>` for `Awaited` | Thenables come back unwrapped-not-unwrapped |
| Forgetting the recursive call | `Promise<Promise<T>>` stays nested |
| `(...args: any) => any` in your own constraints | Drags `any` into inference; use `never[]`/`unknown` |
| `Parameters<F>` inside a generic wrapper | Deferred conditional — infer `A`/`R` instead |

## Interview angle

> *"Implement `ReturnType<T>`."*

Write it, then add the constraint conversation unprompted: *"the stdlib
constrains with `(...args: any) => any`; I'd write `(...args: never[]) => unknown`
because parameters are contravariant, so `never[]` accepts any function without
letting `any` in."* That is a two-sentence answer that demonstrates variance,
which is usually the thing they were fishing for.

> *"Why is `Awaited` more than one line?"*

Because `await` unwraps thenables, not just promises, so the type has to match
on the `then` shape and dig the resolved value out of the callback's first
parameter. Then mention the recursion (`Promise<Promise<T>>`) and the `never`
case for a non-callable `then`. If you can also say *why* it distributes over
unions, you have covered every line of the real definition.
