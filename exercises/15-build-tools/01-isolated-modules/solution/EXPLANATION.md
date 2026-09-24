# 15/01 — isolatedModules

## The one constraint

`tsc` builds a **program**: it reads every file, resolves every import, and
therefore knows that `Shape` is a type and `area` is a function. Vite, esbuild,
swc and Babel build **nothing of the sort**. Each file is handed to the
transpiler on its own, types are stripped by pattern, and the result is written
out. No cross-file knowledge exists at any point.

That is worth an order of magnitude in build speed, and it costs you a handful
of TypeScript features. `isolatedModules: true` is how you buy in: the compiler
starts rejecting constructs whose correct emit would need information from
another file.

## Why `export { Shape }` cannot work

```ts
export { Shape } from "./shapes";   // TS1205
```

The transpiler has never opened `./shapes`. It sees a name being re-exported and
must choose:

- **keep it** — and if `Shape` is a type, the emitted `export { Shape }` refers
  to a binding that does not exist. Modern ESM link errors are eager, so the
  whole bundle fails with *"does not provide an export named 'Shape'"*.
- **drop it** — and if `Shape` was a value, you have silently deleted an export.

There is no third option, so the compiler makes you say which you meant:

```ts
export type { Shape } from "./shapes";   // erased
export { area } from "./shapes";         // kept
```

The same reasoning gives TS1484 on the import side under `verbatimModuleSyntax`.

## The five import forms, and what they actually emit

Compiled with `verbatimModuleSyntax: true`, `module: ESNext` — this is the real
output, not a paraphrase:

| You write | Emitted JavaScript |
|---|---|
| `import type { T } from "m"` | *(nothing)* |
| `import { type T } from "m"` | `import {} from "m";` |
| `import { value } from "m"` | `import { value } from "m";` |
| `import "m"` | `import "m";` |
| `import type * as NS from "m"` | *(nothing)* |

Line two is the one that catches people. **`import { type T } from "m"` still
loads the module.** The `type` modifier erases the *name*; only the `import
type` form erases the *statement*. That difference is:

- a bug when you thought you had removed the dependency — the module is still
  fetched, and its side effects still run;
- a *feature* when the module has an initialisation side effect you actually
  want to keep while importing only types from it.

`verbatimModuleSyntax` exists precisely so that this is decided by what you
wrote, not by whether some other file happened to use the name as a value. The
old flags it replaces (`importsNotUsedAsValues`, `preserveValueImports`) tried
to guess and are deprecated.

## `const enum`: the feature to stop using

```ts
export const enum Level { Low = 1, High = 2 }
```

The promise is that `Level.High` is replaced by `2` at every call site, so
nothing ships. Delivering on it requires the compiler to see the declaration
*and* the use — cross-file inlining, exactly what a single-file transpiler
cannot do.

So the outcomes are:

| Where it lives | What happens |
|---|---|
| Local `const enum`, used in the same file | A per-file transpiler can inline it — fine |
| Local `const enum`, imported by another module | No inlining. An enum object is emitted after all, and you have gained nothing |
| Ambient `const enum` (in a `.d.ts`) | **TS2748** under `isolatedModules`: the value does not exist in any emitted file, so the read cannot be compiled |

The replacement is the one in TODO 2:

```ts
export const DIRECTION = { up: "up", down: "down" } as const;
export type Direction = (typeof DIRECTION)[keyof typeof DIRECTION];
```

Better than an enum in every dimension that matters: the values are plain
strings (readable in a log, comparable to JSON), the type is derived so it
cannot drift, and there is exactly one runtime object — which tree-shakes if
unused. This is why `enum` is on the "do not add" list in most modern style
guides, and why the TypeScript team added `erasableSyntaxOnly` to let a project
ban enums and namespaces outright.

## What `isolatedModules` does **not** catch

The flag only rejects what is visible in one file. Two failures survive it:

**A local `const enum` imported elsewhere.** Compiles. Emits an object. You
simply do not get the optimisation you asked for, and nothing tells you.

**A namespace merged across files.**

```ts
// a.ts
export namespace Feature { export const NAME = "a"; }
// b.ts
export namespace Feature { export function run() { return NAME; } }
```

`tsc` merges the two declarations into one. A per-file transpiler emits two
unrelated objects, and half the members disappear. Declaration merging is a
whole-program feature; a per-file build is the wrong place for it. Use modules,
which is what namespaces were a pre-ESM stand-in for.

`import fs = require("fs")` / `export = fs` are rejected too, but by
`module: "ESNext"` (TS1202/TS1203), not by `isolatedModules`. Worth knowing
which flag says what: in an interview, "the compiler rejects it" is fine right
up until they ask *which* setting.

## Common mistakes

| Mistake | What happens |
|---|---|
| `import { Shape, area }` left as-is | TS1484 — the type must be marked |
| `export { Shape } from "./shapes"` | TS1205 — the re-export must be `export type` |
| Re-declaring `Shape` by hand instead of re-exporting | `Equal<Shape, ShapeSource>` fails: it is a copy that will drift |
| `DIRECTION` without `as const` | Values widen to `string`; `Direction` becomes `string` |
| Hand-writing `type Direction = "up" \| "down" \| …` | Passes the equality test, fails the point — two sources of truth |
| Assuming `import { type T }` removes the import | It emits `import {} from "m"` and still loads the module |

## Interview angle

> *"What does `isolatedModules` do, and why would you turn it on?"*

It makes the compiler reject anything that cannot be transpiled one file at a
time, which is exactly what esbuild/swc/Babel do. Turn it on the moment a
non-`tsc` tool is anywhere in your build, so that the constructs that would break
the bundle fail in CI instead. Then name the three: type re-exports without
`export type`, ambient `const enum` reads, and cross-file declaration merging.

> *"Should we use `enum`?"*

Prefer `as const` objects with a derived union. `const enum` cannot be inlined
across files by any modern bundler, and a plain `enum` gives you a runtime object
with nominal-ish typing that is easy to get wrong at API boundaries — a string
union is comparable to JSON, readable in logs and erased entirely. Mention
`erasableSyntaxOnly` if you want to show you have kept up: it is the flag that
bans enums and namespaces so a project can be type-stripped by Node directly.
