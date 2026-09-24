# 14/02 — `import type` and `verbatimModuleSyntax`

## The bug this prevents

Before `import type` existed, TypeScript **elided** imports it judged to be
types: if none of an import's bindings survived type erasure, the whole
statement was deleted. That is a sensible optimisation and a subtle correctness
hole, because deleting the statement also deletes the module's evaluation.

```ts
// looks like a type import
import { ApiClient } from "./api-client";

let client: ApiClient;    // …only ever used in type position
```

If `./api-client.ts` registers an interceptor, installs a polyfill, or calls
`configure()` at the top level, that no longer happens. Nothing errors. The
build succeeds. A request goes out unauthenticated in production, and the diff
that caused it deleted *no code at all* — someone just stopped using
`ApiClient` as a value somewhere else in the file.

That is the failure `./telemetry.ts` reproduces in miniature: without `type`, it
loads and "telemetry" appears in `loaded`; with it, the statement is erased and
the module is never fetched.

## Three flags, three different jobs

| Flag | What it does |
|---|---|
| `isolatedModules` | Rejects code that cannot be transpiled one file at a time |
| `importsNotUsedAsValues` (old) | Chooses whether to keep or drop a type-only import |
| `verbatimModuleSyntax` | Emits imports and exports **exactly as written**, minus `type` |

`isolatedModules` is the one this repo runs everywhere. It catches
`export { SomeType }` — because a single-file transpiler cannot look inside the
other module to find out that `SomeType` is a type — but it does **not** catch
`import { SomeType }`, because the transpiler can see that binding go unused
locally and drop it. So `isolatedModules` alone leaves the elision hole open.

`verbatimModuleSyntax` closes it by removing the judgement call: what you wrote
is what gets emitted. The cost is that you have to be explicit, and the benefit
is that the output is predictable — which matters most when `tsc` is *not* the
thing producing your JavaScript.

`importsNotUsedAsValues` and `preserveValueImports` were earlier attempts at the
same problem and are deprecated; `verbatimModuleSyntax` replaces both.

## Why "a bundler and `tsc` disagreeing" is the real motivation

In a modern setup, `tsc` typechecks and something else — esbuild, SWC, Oxc,
Babel — actually emits the JavaScript. Those tools transpile one file at a time
and have no type information at all, so they guess elision from syntax.

Once the emitter guesses, the only safe contract is "no guessing required".
`verbatimModuleSyntax` is that contract: mark what is a type, and every tool
agrees without needing to resolve a single import.

You can watch it happen in this repo. Vite's transform elides an unmarked
type-only import when the flag is off, and keeps it when the flag is on — same
source, different runtime behaviour, decided entirely by a compiler option the
bundler read out of `tsconfig.json`.

## The four forms

```ts
import type { TelemetryEvent } from "./telemetry";  // erased whole
import "./audit";                                   // run it, bind nothing
import { formatEvent, type Format } from "./formatter";
import { Codec } from "./codec";                    // type AND value
```

**Statement-level `import type`** erases everything, including the module
specifier. Use it when the module contributes types only.

**A bare import** is the only form that says "evaluate this, I want nothing from
it". Polyfills, CSS, registration side effects, `reflect-metadata`. It is also
the honest fix when you *do* want a module's side effect but only its types —
`import type { T } from "./m"; import "./m";` says both things out loud.

**The inline `type` modifier** marks individual specifiers, so one statement can
carry both. Prefer it over splitting into two statements: two statements are two
places to update, and only one of them will get updated.

**A class import must be a value import.** A class is a type and a value under
one name, and `import type` keeps only the type half:

```ts
import type { Codec } from "./codec";
const c: Codec = new Codec("|");
//                   ^ 'Codec' cannot be used as a value because it was
//                     imported using 'import type'.
```

The annotation compiles. The construction does not. Same for enums, and for
anything used with `instanceof`.

## `verbatimModuleSyntax` makes it an error, not a warning

```ts
import { TelemetryEvent } from "./telemetry";
// TS1484: 'TelemetryEvent' is a type and must be imported using a type-only
//         import when 'verbatimModuleSyntax' is enabled.
```

Which is the flag earning its keep: the emitted statement would ask the runtime
for an export named `TelemetryEvent` that does not exist. In a real ES module
that is a link-time failure; in a dev-server transform it is silently
`undefined`. Neither is something you want to discover at runtime, so the
compiler refuses up front.

The same reasoning applies on the export side, which is what makes TODO 5 worth
doing: `export { TelemetryEvent } from "./telemetry"` is an error for the
identical reason, and an unmarked *export* loading a module is a bug that is
considerably harder to spot than an unmarked import.

## Common mistakes

| Mistake | What happens |
|---|---|
| `import { TelemetryEvent }` without `type` | TS1484 — and, unchecked, `./telemetry` runs |
| Splitting TODO 3 into two statements | Works, but the value import and type import drift apart |
| `import type { Codec }` | Annotation fine, `new Codec(…)` fails |
| Expecting `import type { T }; ` to keep a side effect | It erases the module specifier too — add a bare `import "./m"` |
| `export { SomeType } from …` | `isolatedModules` catches it; under the flag it would also load the module |
| Leaving the placeholder types in place | Duplicate identifier once the import lands |
| Assuming the bundler agrees with `tsc` | It has no types; it guesses from syntax unless you mark things |

## Interview angle

> *"What does `import type` do, and why would you bother?"*

It marks the import as erasable, so the statement disappears at compile time and
the module is never evaluated. The reason to bother is the inverse: without it,
TypeScript decides *for* you, and an import whose bindings happen to be
type-only gets deleted along with the module's side effects. Nothing errors, so
the failure shows up as a missing interceptor or an uninstalled polyfill in
production.

> *"Why does a codebase turn on `verbatimModuleSyntax`?"*

Because `tsc` usually is not the thing emitting the JavaScript. Bundlers
transpile file by file with no type information, so they can only guess which
imports are types. `verbatimModuleSyntax` removes the guess: what you wrote is
what gets emitted, minus `type`. The price is explicitness — every type import
has to say so, and the compiler errors if it does not — and the payoff is that
`tsc`, esbuild, SWC and your bundler all produce the same module graph.
