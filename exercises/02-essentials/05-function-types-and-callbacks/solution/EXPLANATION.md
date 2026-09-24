# 02/05 — Function types, callbacks, `void` and `never`

## Why each answer is what it is

### Function type expressions

```ts
type Transformer = (value: number) => number;
```

Parameter names in a function *type* are documentation only — `(value: number)
=> number` and `(n: number) => number` are the same type, which is why the
`Equal` assertion passes either way.

Two ways to write the same thing:

```ts
type A = (value: number) => number;          // type expression — prefer this
interface B { (value: number): number }      // call signature
```

Reach for the interface form only when the function also needs properties
(`fn.cache`) or overloads.

### Contextual typing — the payoff

```ts
const double: Transformer = (value) => value * 2;
//                           ^ inferred as number, no annotation needed
```

Because the variable is annotated, TypeScript pushes the type *inward* onto the
parameters. This is why callbacks in `.map()` never need annotations. Naming the
function type once and annotating the variable is almost always better than
annotating each parameter.

### Rest parameters

`...transformers: Transformer[]` collects the remaining arguments. Always an
array type, always last. The body is a fold-inside-a-map: `map` walks the
values, `reduce` walks the transformers.

```ts
values.map((value) =>
  transformers.reduce((acc, transform) => transform(acc), value),
);
```

With zero transformers, `reduce` returns the seed unchanged — which is exactly
the "no transformers" test case, for free.

### Default parameters beat `| undefined`

```ts
function slugify(text: string, separator: string = "-")      // do this
function slugify(text: string, separator?: string) { … }     // not this
```

A default makes the parameter optional to *callers* while the body sees a plain
`string` — no branch, no narrowing, no `?? "-"`. (In `Parameters<>` it still
shows as optional, so callers are unaffected.)

### The `void` return rule — the surprising one

A callback parameter declared `=> void` will accept a function that returns
*anything*:

```ts
forEachIndexed(items, (_item, i) => collected.push(i));  // push returns number
```

That looks unsound, and it is deliberate. `void` on a parameter position means
**"I will ignore whatever you return"**, not "you must return nothing". Without
this rule, `array.forEach(x => list.push(x))` — one of the most common lines in
JavaScript — would not compile.

The rule applies only to *assigning a function to a void-returning type*. A
function whose own declared return type is `void` still cannot return a value:

```ts
const f: () => void = () => 42;        // OK — assignment
function g(): void { return 42; }      // Error — declaration
```

### `void` vs `never`

| | Meaning | Reachable after the call? |
|---|---|---|
| `void` | returns, but with no useful value | yes |
| `never` | does not return at all — throws or loops forever | **no** |

Typing `fail` as `never` is what makes `getOrFail` work:

```ts
if (value === null) {
  fail("…");        // compiler: this branch cannot fall through
}
return value;       // therefore value is string here
```

Control-flow analysis treats a call to a `never`-returning function as a
terminator, exactly like `throw`. Type it `void` and the compiler assumes the
branch continues, so `value` stays `string | null` and the return fails.

Two conditions for this to work: the function needs an **explicit** `never`
annotation (inference gives `void` for a plain `throw` body when the return type
is omitted), and it must be called as a plain function — a call through a
possibly-undefined method does not narrow.

`never` is also the empty type: no value is assignable to it, but it is
assignable to everything. That is what makes the exhaustiveness pattern in
exercise 02/06 work.

## Common mistakes

| Mistake | What happens |
|---|---|
| `type Transformer = Function` | Accepts anything; `_transformer` fails |
| Rest parameter not last | Syntax error |
| `separator?: string` with no default | `separator` is `string \| undefined` inside; `.join` errors |
| Callback typed `=> string` | The `push` callback in the test stops compiling |
| `fail(): void` | `getOrFail` cannot narrow; `return value` errors |
| `return value!` in `getOrFail` | Compiles, but sidesteps the entire lesson |
| Building the slug with `.replace` and then trimming ends | Works, but is fiddly with a custom separator — split/filter/join is cleaner |

## Interview angle

> *"Why does TypeScript let me pass a value-returning function where a `void`
> callback is expected? Isn't that unsound?"*

Technically yes, and it is a documented, deliberate exception. `void` in a
parameter position means the return value is discarded, so passing a function
that happens to return something is harmless. The alternative would break
`forEach`, `addEventListener` and most of the DOM API. Knowing *why* the hole
exists is a much stronger answer than knowing that it does.

> *"When have you actually used `never`?"*

Three honest answers: functions that always throw (`fail`, `assertNever`),
exhaustiveness checks over discriminated unions, and filtering in conditional
types — `Exclude<T, U>` is built on `never` collapsing out of a union.
