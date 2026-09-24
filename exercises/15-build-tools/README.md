# Section 15 — Build tools & Vite

Maps to the Vite/build-tooling part of the course.

Build tooling cannot be unit-tested, so this section follows the
[03/04](../03-tsconfig/04-configure-a-project/) model instead: the **knowledge**
is what gets graded. Symptoms map to causes, options map to reasons, and one
exercise makes you write code that a single-file transpiler can actually handle.

One idea runs through all three:

> **tsc type-checks. The bundler compiles.** Everything else follows from the
> fact that esbuild sees one file at a time and never builds a type graph.

| # | Exercise | Tier | Time | Covers |
|---|---|---|---|---|
| 01 | [isolatedModules](01-isolated-modules/) | Core | 25 min | Type-only imports/exports, `const enum`, what the flag cannot catch |
| 02 | [Module resolution](02-module-resolution/) | Core | 30 min | `bundler` vs `nodenext` vs `node10`, `package.json` `exports` |
| 03 | [Configure for a bundler](03-configure-for-a-bundler/) | **Challenge** | 40 min | The emit/resolution half of a tsconfig, app vs published library |

**Run one:** `npm run check 15/02` · **Run the section:** `npm run check 15`

> Each exercise here excludes `solution/` from its own `tsconfig.json` so that
> the reference solution's declarations cannot leak into the file you are
> editing. `npm run verify:solutions` still type-checks every solution.

## What to take away

- **A bundler transpiles one file at a time.** Anything whose correct emit needs
  another file — a type re-export without `export type`, an ambient `const
  enum`, a namespace merged across files — is either an error or a landmine.
- **`import { type T } from "m"` still loads the module.** Only `import type`
  erases the statement. Under `verbatimModuleSyntax` you write what you mean.
- **Stop using `enum`.** An `as const` object with a derived union gives you
  readable values, one runtime object and no cross-file inlining problem.
- **`moduleResolution` must describe whatever actually loads your code.**
  `bundler` for a bundled app, `nodenext` for anything Node runs or imports.
  Getting this wrong produces a green build and a broken deployment.
- **`exports` makes a package's surface finite** and its condition order is a
  priority order: `types` first, `default` last.
- **`types: []`** stops every `@types` package in `node_modules` from entering
  global scope. Most projects never set it and quietly pay for it.
- **`tsc --noEmit` belongs in CI even when Vite does the compiling** — Vite will
  bundle code that does not type-check, because it never looked.

## Interview questions this section prepares you for

- Why does `isolatedModules` exist, and what does it forbid?
- What is the difference between `import type { T }` and `import { type T }`?
- Should we use `enum`?
- We get `ERR_MODULE_NOT_FOUND` in production but the build is green. Why?
- What does the `exports` field in `package.json` do?
- Vite compiles your TypeScript. What is `tsc` still for?
- One monorepo, an app and a published package. Do they share a tsconfig?
