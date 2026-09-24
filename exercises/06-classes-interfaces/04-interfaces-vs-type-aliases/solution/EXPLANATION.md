# 06/04 — Interfaces vs type aliases

## The comparison table

| | `interface` | `type` |
|---|---|---|
| Object shapes | yes | yes |
| Unions (`A \| B`) | **no** | yes |
| Primitives, tuples, functions | no | yes |
| Mapped / conditional types | no | yes |
| Declaration merging | **yes** | no |
| Combine with | `extends` | `&` |
| Extend multiple parents | yes | yes (`A & B`) |
| A class can `implements` it | yes | yes (if it is an object type) |
| Computed property names | no | yes |
| Recursive self-reference | yes | yes |

Only two rows force the decision, and this exercise contains both: **unions**
require a type alias, **declaration merging** requires an interface.

## Declaration merging

```ts
interface AppConfig { apiUrl: string }
interface AppConfig { debug: boolean }
// -> AppConfig is { apiUrl: string; debug: boolean }
```

Same name, same scope, merged into one type. Two `type` aliases with the same
name is a hard error.

This is not a curiosity — it is the mechanism behind almost all library
augmentation:

```ts
declare global {
  interface Window { myAnalytics: Analytics }
}

declare module "express" {
  interface Request { user?: AuthUser }
}
```

That last one is how you add `req.user` to Express in a typed middleware — a
pattern you will meet in section 19.

The flip side is the reason some teams avoid interfaces for internal types:
anyone can silently widen your interface from anywhere in the program. A type
alias cannot be reopened, which for a closed internal model is a feature.

## `extends` vs `&`

```ts
interface Entity extends Identified, Timestamped { name: string }
type Entity = Identified & Timestamped & { name: string };
```

Structurally equivalent here. Three practical differences:

**Error messages.** `extends` checks compatibility at the *declaration*, so a
conflict is reported there, once. An intersection defers the problem to every
use site, where it shows up as a much longer error.

**Conflict handling.** If two parents declare the same property with
incompatible types, `extends` is an error. An intersection silently produces
`never` for that property — technically valid, deeply confusing when you meet it
three files away.

**Performance.** Interfaces get a cached, named type reference. Large
intersections are re-resolved more often, which is measurable in very large
codebases. Not a reason to choose for a small project; a real one at scale.

## `implements` is a check, not inheritance

```ts
class InMemoryRepository implements Repository { … }
```

Nothing is inherited. `implements` asks the compiler to verify the class has
every member, and produces a nice error at the class if not. Remove the keyword
and the class still *structurally* satisfies `Repository` — TypeScript is
structurally typed, so it would still be assignable to a `Repository` variable.

So why write it? Because the error moves to the right place. Without
`implements`, forgetting a method produces an error at some distant call site;
with it, the error is on the class, naming exactly what is missing.

One gotcha worth knowing: `implements` does **not** contribute types. Method
parameters are not inferred from the interface — leave them unannotated and they
are implicitly `any` (or an error under `noImplicitAny`).

## `readonly` in a contract, getter in the class

```ts
interface Repository { readonly size: number }

class InMemoryRepository implements Repository {
  get size(): number { return this.#entities.size; }
}
```

A getter satisfies a `readonly` property. The interface says "consumers can read
this and must not write it"; the class chooses how to back it — stored field,
computed getter, or anything else. That freedom is the point of programming to a
contract.

## Common mistakes

| Mistake | What happens |
|---|---|
| `interface Id = string \| number` | Syntax error — interfaces are object shapes only |
| Editing the first `AppConfig` instead of adding a second | Works, but skips the merging lesson the test checks |
| `type AppConfig` twice | "Duplicate identifier" — merging is interface-only |
| `interface Entity extends Identified extends Timestamped` | Syntax error — use a comma |
| Omitting `implements` | Compiles, but errors surface far from the class |
| `size` as a public field | The `@ts-expect-error` on assignment stops erroring |
| Unannotated method parameters in the class | Implicitly `any` — `implements` does not infer them |

## Interview angle

> *"Interface or type alias?"*

Do not answer with a preference. Answer with the two forcing cases: unions need
a `type`, declaration merging needs an `interface`. Then give your default —
interfaces for public/extensible object shapes, types for everything else — and
note that consistency within a codebase matters more than the choice.

> *"What is declaration merging good for, and what is the risk?"*

Good for: augmenting types you do not own (`Window`, `express.Request`, module
augmentation). Risk: any file can widen your interface invisibly, so for closed
internal models a type alias is the safer default. Naming both sides is what
separates a memorised answer from an experienced one.
