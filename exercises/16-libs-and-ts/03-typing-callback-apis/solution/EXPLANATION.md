# 16/03 — Typing callback APIs

## The bad type everyone writes

```ts
type NodeCallback<T> = (error: Error | null, value?: T) => void;
```

It is the honest transcription of the convention, and it is still a bad type,
for a reason worth being able to state precisely:

> It can represent four combinations. The API produces two. The type cannot
> express the correlation between its own parameters.

So every caller has to check both, and the compiler cannot tell them which
checks are redundant. `legacy-store.ts` makes the point concrete: `loadRecord`
on an unknown id calls back with `(null, undefined)` — neither an error nor a
value. That is not a contrived case; it is what "not found is not an error"
looks like in a callback API.

Could you type it better? A discriminated callback would work:

```ts
type Result<T> = { ok: true; value: T } | { ok: false; error: Error };
type BetterCallback<T> = (result: Result<T>) => void;
```

but you do not own the library, so you cannot. Which is the actual lesson:
**when you cannot fix a type, contain it.** Wrap the API once, and hand
everything above that line a shape the type system can prove.

## The bridge

```ts
export function promisify1<Arg, Value>(
  operation: (arg: Arg, done: NodeCallback<Value>) => void,
): (arg: Arg) => Promise<Value> {
  return (arg) =>
    new Promise<Value>((resolve, reject) => {
      operation(arg, (error, value) => {
        if (error !== null) return reject(error);
        if (value === undefined) return reject(new TypeError("…"));
        resolve(value);
      });
    });
}
```

Both type parameters are inferred from the argument: `Arg` from the first
parameter, `Value` from the callback's second. That is why the call site can be
`promisify1(searchRecords)` with no type arguments and still get
`(term: string) => Promise<readonly StoredRecord[]>`.

The `value === undefined` branch is the whole point. It converts a case the type
could not express into a rejection, so that `Promise<Value>` genuinely means a
`Value`. Resolve with `undefined` instead and you have moved the problem up one
level and made it harder to see — everything above now gets `Value | undefined`
forever.

## Why `util.promisify` needs special typing

Node's own `promisify` has to handle every arity, so `@types/node` declares a
stack of overloads, plus an escape hatch:

```ts
declare const custom: unique symbol;
function promisify<T>(fn: { [promisify.custom]: T }): T;
```

A library can attach a `util.promisify.custom` property whose *type* says what
the promisified version looks like, and `promisify` returns that instead of
guessing. It is a nice example of types being carried at the value level, and of
why "just make it generic" stops working past a certain arity.

Real projects usually skip all this and write the four wrappers by hand, because
a hand-written facade also gets to fix the API's other sins — like an unknown id
calling back with nothing.

## Dual APIs and overloads

```ts
export function readRecord(id: string): Promise<StoredRecord>;
export function readRecord(id: string, done: NodeCallback<StoredRecord>): void;
export function readRecord(id: string, done?: NodeCallback<StoredRecord>) { … }
```

Three rules that catch people (07/03 has the detail):

- The implementation signature is **not callable**. It only has to be compatible
  with the overloads. `readRecord("r1", undefined)` does not compile even though
  the implementation accepts it.
- Resolution is **first match wins**, so order specific before general.
- The implementation's return type is the union of both — which is exactly why
  the overloads have to exist. A single signature returning
  `Promise<StoredRecord> | void` would force every caller to narrow.

Is a dual API worth it? Node shipped one for a decade because it could not break
its callers. In new code, do not: pick promises, and let anyone who needs a
callback write `.then()`. Two entry points means two paths to test, and the
overloads are the smaller half of the cost.

## Rejecting versus returning a `Result`

`settle` is the other model:

```ts
type Settled<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: string };
```

| | Rejection | `Settled<T>` |
|---|---|---|
| Forgetting to handle it | Unhandled rejection, at run time | Compile error the moment you read `.value` |
| Stack traces | Kept | Lost, unless you keep the `Error` |
| Fits `await` | Yes, with `try`/`catch` | Yes, with `if` |
| Exhaustiveness | None — anything can be thrown | Full, it is a discriminated union |

Rust, Go and Zig chose the second; Effect, neverthrow and fp-ts bring it to
TypeScript. Use rejections for genuinely exceptional failures, and a `Result` for
outcomes the caller is expected to handle — a failed lookup, a validation error.
The mistake is `{ ok: boolean; value?: T; error?: string }`, which narrows
nothing and is the reason the discriminant has to be a literal type.

## Common mistakes

| Mistake | What happens |
|---|---|
| `resolve(value)` without the `undefined` check | `Promise<Value>` resolves with `undefined`; the lie moves upstream |
| `if (error)` instead of `error !== null` | Works here, but treats a falsy error object as success — and the type says `Error \| null` |
| Explicit type arguments at the call site | Hides the fact that inference was never working |
| One signature returning `Promise<T> \| void` | Every caller has to narrow; that is what overloads are for |
| `catch (error) { error.message }` | `error` is `unknown` under `strict` |
| `{ ok: boolean; value?: T }` | Not a discriminated union; nothing narrows |

## Interview angle

> *"How would you wrap a callback-based API?"*

One boundary function that returns a promise, and use it everywhere — never
sprinkle `new Promise` through the call sites. Then the detail that shows you
have actually done it: an error-first callback type cannot express that the value
is present exactly when the error is null, so the wrapper has to decide what a
`(null, undefined)` callback means. Turning it into a rejection is what makes
`Promise<T>` trustworthy for everyone above.

> *"Promise rejection or a `Result` type?"*

Rejections for exceptional failures, `Result` for expected outcomes. The argument
for `Result` is that the compiler forces you to handle it and the union is
exhaustive; the argument against is that it is viral and loses stack traces. Most
codebases end up with rejections at the edges and a `Result` in the domain layer,
which is a defensible answer if you can say why.
