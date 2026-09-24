# 15/03 — Configure TypeScript for a bundler

## The one idea

**tsc type-checks. The bundler compiles.**

esbuild strips types by pattern, one file at a time, and never builds a type
graph — which is why it is roughly a hundred times faster than `tsc` and why it
cannot tell you that you passed a `string` to a `number`. The two tools are not
competitors; they do different jobs on the same source.

Every line of the app config follows:

| Job | Owner | Why |
|---|---|---|
| Type-checking | tsc | Needs the whole program |
| Catching an import of a name that does not exist | tsc | Same |
| Emitting `.d.ts` | tsc | Types are the input |
| Transpiling TS → JS | bundler | Pattern-level work, per file |
| Tree-shaking | bundler | Needs the module graph, not the type graph |
| Minifying and hashing | bundler | Output concerns |

This is also why `tsc --noEmit` stays in CI and in your `npm run build` script.
Vite will happily bundle code that does not type-check — it never looked.

## Line by line: the app config

### `target: "ES2022"` and `lib: ["ES2022", "DOM", "DOM.Iterable"]`

`target` sets the syntax level of the emit; `lib` declares which runtime APIs
exist. They are usually kept in step, and `lib` is what you change when you need
the other axis — DOM types in a browser app, and *no* DOM in a Node package, so
that `document` is an error rather than a runtime crash.

In a Vite project `target` also matters less than it looks: esbuild does the
downlevelling, driven by Vite's own `build.target`. Keeping them consistent
avoids code that type-checks against one baseline and ships against another.

### `module: "ESNext"`

Leave the `import`/`export` syntax alone so the bundler can see the module
graph. Downlevel it to CommonJS and tree-shaking becomes impossible — `require`
is a function call that can be conditional, so nothing can be proven unused.

### `moduleResolution: "bundler"`

Resolve the way Vite resolves: extensionless relative imports, directory
indexes, and `package.json` `exports` honoured. See [15/02](../../02-module-resolution/)
for what the alternatives do.

### `moduleDetection: "force"`

Without it, a `.ts` file with no top-level `import` or `export` is a *script*:
its top-level declarations are global and can collide across files. `"force"`
makes every file a module. Costs nothing, removes a class of baffling
"Cannot redeclare block-scoped variable" errors.

### `types: []`

By default TypeScript loads **every** `@types/*` package it finds under
`node_modules/@types` into global scope — including transitive ones you never
asked for. That is how a project ends up autocompleting another test runner's
`describe`, or with two conflicting `Buffer` globals.

`types: []` says "none automatically". Anything you genuinely need, you import.
The library config uses `["node"]` because a Node package really does want the
Node globals.

### `noEmit: true`

tsc is a linter here. Without this it writes a `.js` next to every `.ts` and
your editor's file tree doubles in size.

### `isolatedModules: true` and `verbatimModuleSyntax: true`

The pair that makes your source safe for a single-file transpiler:
`isolatedModules` rejects constructs esbuild cannot handle;
`verbatimModuleSyntax` makes import elision explicit instead of inferred.
[15/01](../../01-isolated-modules/) is the whole story.

### `resolveJsonModule: true`

`import config from "./config.json"` gets a real, structural type instead of an
error. Vite supports the import either way; this is what types it.

### `skipLibCheck: true`

Skips type-checking `.d.ts` files, which is nearly all of `node_modules`. Two
honest costs: a genuine conflict between two libraries' types goes unnoticed,
and a dependency can ship declarations that only *look* fine. The benefit is a
large build speedup and immunity to one broken dependency blocking your build.
Almost everyone takes the trade; the point is to know it *is* one.

## What flips for the published library

| Option | App | Library | Why |
|---|---|---|---|
| `module` / `moduleResolution` | `ESNext` / `bundler` | `nodenext` / `nodenext` | Node resolves this package, so model Node |
| `lib` | with DOM | `["ES2022"]` | A Node package must not compile against `document` |
| `types` | `[]` | `["node"]` | It really does use Node globals |
| `noEmit` | `true` | `false` | Here tsc **is** the compiler |
| `declaration` + `declarationMap` | — | `true` | The whole point of publishing; the map makes "go to definition" land in the `.ts` |
| `outDir` / `rootDir` | — | `dist` / `src` | Mirror the source tree into the output |

And what does not flip: `isolatedModules` and `verbatimModuleSyntax` stay on.
Your consumers' bundlers will transpile your `.js` one file at a time, and the
same constructs would break for them.

## `as const` on a config object

```ts
export const OPTIONS = { moduleResolution: "bundler" };            // string
export const OPTIONS = { moduleResolution: "bundler" } as const;   // "bundler"
```

Without `as const` every value widens: `"bundler"` becomes `string`, `true`
becomes `boolean`, and the object is assignable to anything shaped vaguely like
it. Typos stop being caught. In real projects you go one step further and pair it
with `satisfies` against the real option type (07/04) — checked *and* narrow.

## Common mistakes

| Mistake | What happens |
|---|---|
| Omitting `as const` | Every literal widens; the type assertions fail |
| Adding `strict` to these objects | `toEqual` is exact — extras fail. Strictness is 03/04's exercise |
| `lib` in the wrong order | It is asserted as a tuple: `["ES2022", "DOM", "DOM.Iterable"]` |
| Leaving `types` out of the app config | Not the same as `[]` — omitted means "load everything" |
| Setting `outDir` alongside `noEmit: true` | Harmless but incoherent; the test rejects it |
| Assuming Vite type-checks | It does not. `tsc --noEmit` must run in CI |

## Interview angle

> *"Vite compiles your TypeScript. What is `tsc` still for?"*

Type-checking, and emitting declarations. esbuild strips types per file without
ever building a type graph — that is where the speed comes from, and it is why it
cannot report a type error. So `tsc --noEmit` runs in CI and in the build script,
the editor runs the same compiler for live errors, and the bundler produces the
artefact. Then name the two flags that keep the source safe for a per-file
transpiler: `isolatedModules` and `verbatimModuleSyntax`.

> *"Same monorepo, an app and a published package. Do they share a tsconfig?"*

They share the strictness base and differ on emit and resolution: the app is
`noEmit` with `moduleResolution: "bundler"` and DOM libs; the package emits
declarations with `nodenext` resolution, no DOM, and `types: ["node"]`. Use
`extends` for the shared half. The mistake to name is publishing a package built
with `bundler` resolution — it compiles, and then fails in every consumer that
runs it on Node.
