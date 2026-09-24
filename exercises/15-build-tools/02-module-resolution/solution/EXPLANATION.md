# 15/02 — Module resolution

## The three modes, in one paragraph each

**`bundler`** (TS 5.0+). "Resolve the way Vite/esbuild/webpack 5 does": no
extension needed, directory indexes work, and `exports`/`imports` in
`package.json` are honoured. It is the right answer whenever a bundler — not
Node — is the thing that will actually load your modules. It is *only* a
type-checking model: nothing about it makes Node able to run the output.

**`nodenext`** ("what Node does today, and will do tomorrow"). Inside an ESM
file, resolution is **literal**: `./util` is not a file, `./models` is not a
directory index, and you write `./util.js` for a module whose source is
`util.ts`. Inside a CommonJS file in the same project the old rules still apply,
because Node's behaviour depends on the nearest `package.json` `"type"` — and
`nodenext` models that per-file. `node16` is the same algorithm frozen at Node
16's behaviour; `nodenext` tracks the current one, and is what you want.

**`node10`** (called `"node"` before TS 5.0). The pre-2022 CommonJS algorithm:
walk up the `node_modules` chain, probe `.ts`/`.js`/`index.*`, and ignore
`exports` entirely. Correct only for builds that predate `exports` — webpack 4,
old Jest configs. Choosing it today means silently resolving files that the
package author never meant to expose.

## Why `nodenext` makes you write `.js`

Because Node resolves the specifier at **run time**, against the JavaScript that
exists then. There is no resolver in the Node runtime that knows about your
`.ts` files, and no build step that rewrites string literals — TypeScript
deliberately does not rewrite import paths on emit, because doing so would make
the emitted code depend on compiler settings.

So the specifier must already be correct for the output, and TypeScript meets
you halfway: when you write `./util.js` it looks for `util.ts`, `util.tsx`,
`util.d.ts` and finally `util.js`.

`allowImportingTsExtensions` lets you write `./util.ts` instead, but it requires
`noEmit` (or `emitDeclarationOnly`) — precisely because that specifier could not
survive emit. It is for bundler projects, not for Node ones.

## `exports` broke deep imports on purpose

Before `exports`, every file in a published package was public. Renaming
`lib/internal/helpers.js` was a breaking change, because somebody, somewhere,
had imported it.

`exports` inverts that: **nothing is reachable unless it is listed.**

```jsonc
{
  "exports": {
    ".":               { "types": "./dist/index.d.ts", "import": "./dist/index.mjs" },
    "./feature/*":     { "types": "./dist/feature/*.d.ts", "default": "./dist/feature/*.js" },
    "./package.json":  "./package.json",
    "./internal/*":    null
  }
}
```

`import "pkg/lib/util"` now fails with `ERR_PACKAGE_PATH_NOT_EXPORTED` even
though the file is right there — the package author made it private. The fix is
to use the public entry point, or to ask upstream to export the subpath. It is
never to reach past the map: `moduleResolution: "node10"` will let you, and you
will break on the next patch release.

`"./package.json": "./package.json"` appears in nearly every real map because so
many tools read it.

## The `"types"`-first rule

Conditions are matched in **declaration order**, and the first match wins. That
makes this map subtly broken:

```jsonc
{ ".": { "import": "./dist/index.mjs", "types": "./dist/index.d.ts" } }
```

TypeScript's condition list includes both `"types"` and `"import"`, so it walks
the object, matches `"import"` first, resolves to a `.mjs` file, finds no
declarations next to it and reports that the package has no types. Move
`"types"` to the top and it works. The test in this exercise pins exactly that
behaviour, because the bug is invisible when you read the map as a set rather
than as a list.

Same rule, same reason: `"default"` must be **last**, since it matches
everything.

## `node10` and the dual-package hazard

A package that ships both ESM and CJS builds can end up loaded twice in one
process — once through `"import"`, once through `"require"` — giving you two
copies of every class and instance. `instanceof` starts failing, module-level
caches diverge, and singletons are no longer single.

That is the "dual-package hazard", and it is the main argument for shipping ESM
only, or for keeping all state in a small CJS core that both builds re-export.

## Common mistakes

| Mistake | What happens |
|---|---|
| Looking the caller's conditions up in the object | Reverses the priority order; the `"types"`-last test fails |
| Treating a missing key and a `null` target the same | They are both `null` here, but for different reasons — one is "not listed", the other "listed and blocked". `noUncheckedIndexedAccess` makes you handle it |
| Sorting patterns alphabetically | Longest-prefix is the rule, not alphabetical |
| `subpath.startsWith(prefix)` alone | `"./feature/"` would match the pattern `"./feature/*"` with an empty wildcard; the length check rejects it |
| Using `bundler` for a published package | Compiles, then fails in every consumer that runs it on Node |
| Adding `.js` under `bundler` | Harmless, and portable — TS maps it back to `.ts`. It is `nodenext` that *requires* it |

## Interview angle

> *"We get `ERR_MODULE_NOT_FOUND` in production but the build is green. Why?"*

Because `tsc` and Node resolved the specifier differently. `moduleResolution:
"bundler"` (or `node10`) accepts extensionless relative imports; Node's ESM
resolver does not. Either move the project to `nodenext` so the compiler
enforces what Node will do, or keep a bundler in the deployment path. Then the
general point: `moduleResolution` should describe *whatever actually loads your
code*, and if two things load it, the strictest one wins.

> *"What does the `exports` field do?"*

It defines the package's public surface and blocks everything else, replacing
the old "every file is public" model. Conditions (`types`, `import`, `require`,
`node`, `browser`, `default`) are matched **in order**, so `types` goes first and
`default` last. Mention that `moduleResolution: "node10"` ignores the field
entirely — which is why an old build can import a path that no longer exists in
any supported version.
