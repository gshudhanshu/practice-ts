# 16/02 — Augmenting library types

## Declaration merging, in one table

| Declared twice | Result |
|---|---|
| `interface` | **Merges** — members combine |
| `namespace` | **Merges** — members combine |
| `type` alias | Duplicate identifier |
| `class` | Duplicate identifier |

Interfaces are open on purpose, and that is not an accident of the language: it
is the extension point libraries rely on. `Window`, `ProcessEnv`,
`IncomingMessage`, Express's `Request`, Vue's `ComponentCustomProperties` are all
interfaces so that *you* can add to them.

A member declared twice must have the **identical** type; the second declaration
adds members, it cannot change existing ones. A class can merge with an
interface or a namespace, but never with another class.

## The two forms of `declare module`

Same syntax, completely different meaning depending on the file:

```ts
// A file with NO top-level import/export — an ambient declaration.
declare module "untyped-package" {      // creates types for a module that had none
  export function thing(): void;
}
```

```ts
// A file that IS a module — an augmentation.
import type { X } from "some-package";

declare module "some-package" {          // merges into the existing module
  interface X { extra?: number }
}
```

If the specifier does not resolve, the augmentation fails with *"Invalid module
name in augmentation"*. That error usually means one of two things: the module
is not installed, or you targeted a name the package does not actually declare.

**Which specifier?** The one whose declaration file declares the interface — the
same string you would `import` from. Open the package's `.d.ts` and look. Some
libraries re-export their types from an internal package (Express historically
declared `Request` in `express-serve-static-core`), and the folklore about which
name to target changes between major versions, so check rather than remember.

Inside the block, do not write `export` in front of the interface. Members
declared there already belong to that module.

## The cost: augmentation is program-wide

There is no such thing as a local augmentation. Once the block exists, **every**
file that touches an `IncomingMessage` sees `context`, including code paths where
your middleware never ran.

So the honest declaration is optional:

```ts
interface IncomingMessage {
  context?: RequestContext;
}
```

and every read has to cope with its absence — hence `contextOf` returning `null`
and `requireContext` throwing. People routinely declare it non-optional to avoid
that friction, and buy themselves a runtime crash in whatever handler runs
before the middleware. That is 16/01's lesson again: a declaration is a promise,
and `declare`-ing away an inconvenient `undefined` does not remove it.

When the reach is wrong for you, the alternatives are:

**A local intersection** — one signature, no global effect:

```ts
function handler(req: IncomingMessage & { context: RequestContext }): void
```

**A wrapper type** you construct yourself:

```ts
type HandledRequest = { readonly raw: IncomingMessage; readonly context: RequestContext };
```

More typing, and the compiler now proves the context exists at exactly the
points it does. This is why Express ships `res.locals` and why newer frameworks
(Koa, Hono, Fastify) pass a *context object* to the handler rather than inviting
you to bolt fields onto the request: a typed parameter beats an optional
property that everyone must remember to check.

## Augmenting a `type` alias — you cannot

If the library exported

```ts
export type Options = { retries: number };
```

there is no merging available: a second `type Options` is a duplicate
identifier, and `type Options = Options & { … }` is circular. Your options are
to wrap it (`type MyOptions = Options & { extra: string }`) or to fork the
declarations wholesale. That asymmetry is a real argument for libraries
publishing interfaces rather than aliases for anything a consumer might extend.

## Common mistakes

| Mistake | What happens |
|---|---|
| Augmenting in a file with no import/export | It becomes an *ambient* declaration for a module that already exists |
| `declare module "http-ish-name-that-does-not-resolve"` | "Invalid module name in augmentation" |
| `export interface` inside the block | Changes the meaning of the declaration |
| Declaring `context` as required | Every un-middlewared request lies about having one |
| Declaring your own `ContextualRequest` interface instead of augmenting | Runtime tests pass; `Pick<IncomingMessage, "context">` does not compile |
| `header[0]` when the header is repeated | Inventing data — Node gave you two values because there were two |

## Interview angle

> *"How do you add a property to a request object from a library?"*

Module augmentation: `declare module "<the module that declares the interface>"`
inside a file that is already a module, adding an **optional** property to the
interface. Then the part that separates the candidates: the augmentation is
global to the program, so every reader has to handle its absence — and if that
is not acceptable, use a wrapper type or a context parameter instead, which is
what modern frameworks do.

> *"What is declaration merging and when have you used it?"*

Two declarations of the same interface or namespace combine. Libraries rely on
it as their extension point — typed `window` properties, `process.env`, plugin
options. Then name the limit: type aliases and classes do not merge, so a
library that exports its options as a `type` cannot be extended this way, only
wrapped.
