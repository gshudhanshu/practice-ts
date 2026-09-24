# 14/03 — Declaration merging & augmentation

## One mechanic, five uses

Merging is a single rule — *declarations with the same name in the same
declaration space combine* — applied in five places:

| Combination | Gives you |
|---|---|
| `interface` + `interface` | one type from several declarations |
| `function` + `namespace` | properties on a function, typed |
| `class` + `namespace` | statics added from outside the class body |
| `enum` + `enum` | one enum split across files |
| `declare module "…"` | the same, aimed at a module you do not own |
| `declare global` | the same, aimed at the global scope |

Everything in this exercise is that rule, pointed somewhere different.

## Function + namespace beats `Object.assign`

```ts
export function formatJob(job: Job): string { … }
export namespace formatJob {
  export const UNKNOWN = "unknown job";
}
```

The alternative is `Object.assign(formatJob, { UNKNOWN: "unknown job" })`, which
works at runtime and produces a type TypeScript has to infer through
`Object.assign`'s overloads. The merge declares it instead, so `formatJob.UNKNOWN`
is typed with no inference gymnastics and the declaration order is enforced.

Two details:

- **Only `export`ed namespace members become properties.** An unexported `const`
  is private to the namespace body.
- **The namespace must come second.** It compiles to code that attaches to the
  existing binding, so the function has to exist first.

The class version is the same idea. It is how you add a static whose type is the
class itself — `Money.ZERO: Money` — without the class body referring forward to
its own type.

## Module augmentation: the escape hatch that stays type-safe

```ts
declare module "./http-lite" {
  interface Request {
    user?: SessionUser;
  }
}
```

`Request` now has a `user` everywhere in the program, including inside
`http-lite.ts` itself. That is the point: the alternative is a cast at every
call site, which lies locally and never gets checked.

Three requirements, each of which fails silently if you get it wrong:

1. **The file must be a module.** Inside a script (no imports, no exports),
   `declare module "x"` declares a *new ambient module* rather than augmenting
   an existing one. Same syntax, opposite meaning.
2. **The specifier must resolve to the same module.** `"./http-lite"` from this
   file. A different-but-equivalent path is a different module to the compiler.
3. **No `export` keyword inside.** Members go into what the module already
   exports; `export` there means something else.

Names inside the augmentation body resolve in the **containing file's** scope,
which is why `SessionUser` needs no import inside the block.

This is exactly how `@types/express` lets you write `req.user`, how NestJS adds
to `Request`, and how a plugin adds a method to an `Observable`.

## When augmentation is the wrong answer

It is global. There is no scoping, no opting out, and no way for a second
augmentation to disagree with yours:

- **Two augmentations of the same member conflict.** Two libraries both adding
  `user?: User` with different `User` types is an error you cannot fix from
  either side.
- **The type says a property exists; nothing makes it true.** `request.user` is
  typed as always-possible even in code paths where no middleware ever set it.
  Optional (`user?:`) is doing real work here — declaring it required would be a
  lie the compiler helps you tell.
- **It hides where the field came from.** A reader of `http-lite.ts` sees no
  `user`, and nothing points at the augmentation.

The alternative, when you control the call sites, is composition —
`type AuthedRequest = Request & { user: SessionUser }` — which is local,
explicit, and lets the compiler distinguish "authenticated" from "maybe
authenticated". Reach for augmentation when a framework hands you objects you
did not construct and cannot re-type.

## `declare global` and why `var` matters

```ts
declare global {
  var appBuild: string | undefined;
}
```

`var` is not stylistic here. Only `var` declarations at the top level become
properties of `globalThis`; `let` and `const` create bindings that live in the
script scope and are deliberately *not* exposed. Declare `let appBuild` and
`globalThis.appBuild` stops typechecking.

The trap is the same as with module augmentation, but louder: the declaration
asserts the global exists everywhere, from the moment the program starts. If
nothing has assigned it, the type still says `string | undefined` and only the
`| undefined` saves you. Declare `var appBuild: string` and every read is
statically fine and dynamically `undefined`.

The same applies to augmenting built-ins:

```ts
declare global {
  interface Array<T> {
    last(): T | undefined;
  }
}
```

Now every array in the program advertises `.last()`, including in files that
load before your polyfill, and including in library code that never asked. The
type system will not help you find the gap — which is why "monkey-patching
built-ins" is a code-review conversation rather than a technique.

## Interfaces merge; type aliases do not

```ts
interface Job { id: string }
interface Job { retries: number }   // fine — one Job with both

type Job2 = { id: string };
type Job2 = { retries: number };    // error: duplicate identifier
```

06/04 covered this. The consequence relevant *here* is the design one: a type
you publish for others to extend must be an `interface`, because a type alias
can never be reached from outside. That is why `@types` packages are written
almost entirely in interfaces, and why "interface for public API surface, type
alias for internal shapes" is a defensible rule rather than a stylistic one.

## Namespaces are not modules

`namespace` here is a merging tool, not a module system. The old
`namespace`-as-a-file-organiser pattern (`/// <reference>`, one global
namespace, no imports) predates ES modules and is legacy — TypeScript's own
handbook says to use modules for new code.

What namespaces are still good for:

- merging with a function or a class, as above;
- grouping types inside a `.d.ts` for a library that really does expose a
  global object (`declare namespace MyLib { … }`);
- keeping declaration-file namespaces mirroring a UMD global.

Not for organising application code. `import`/`export` does that job.

## Common mistakes

| Mistake | What happens |
|---|---|
| Editing the first `interface Job` instead of adding a second | Works, but skips the mechanic the exercise is about |
| Namespace declared before the function | Error — there is nothing to merge into yet |
| Forgetting `export` inside the namespace | The member is private; `formatJob.UNKNOWN` does not exist |
| `declare module "./http-lite"` in a non-module file | Declares a brand-new ambient module; the augmentation does nothing |
| `export interface Request` inside the augmentation | Wrong meaning — drop the `export` |
| A slightly different specifier | A different module; no error, no effect |
| `let` instead of `var` in `declare global` | `globalThis.appBuild` does not typecheck |
| `var appBuild: string` (no `undefined`) | Every read is statically safe and dynamically `undefined` |
| `static ZERO = new Money(0)` in the class body | Works, but the class now refers to its own type mid-declaration |

## Interview angle

> *"How would you add a property to `Request` in an Express app?"*

Module augmentation: `declare module "express" { interface Request { user?: User } }`
from a file that is itself a module. Then the part that shows judgement — make
it optional, because nothing guarantees the middleware ran, and prefer a local
intersection type (`Request & { user: User }`) in handlers that genuinely
require it. Augmentation is global and unconditional; the type should not claim
more than the runtime provides.

> *"Why can interfaces merge when type aliases cannot?"*

Because an interface is a named, open declaration that the checker builds up
from every declaration it sees, whereas a type alias is a single binding to one
type expression — a second binding would be a redefinition. The practical
consequence is the interesting half: only interfaces can be extended from
outside, so a public API surface meant to be augmentable has to be declared with
interfaces. That is why `@types` packages are written almost entirely in them.
