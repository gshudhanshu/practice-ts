# 14/01 — Import & export forms

## The forms, and what each one costs

```ts
import { area } from "./shapes";        // named
import formatLength from "./format";    // default
import * as units from "./units";       // namespace
import "./polyfill";                    // side effect only
import type { Shape } from "./shapes";  // erased entirely
```

| Form | Costs you |
|---|---|
| named | nothing much — this is the default choice |
| default | the name is invented at the import site, so it is not greppable and renaming the export changes nothing downstream |
| namespace | the whole module is reachable, so bundlers have a harder time dropping unused parts |
| side effect | invisible to a reader — nothing binds, so nothing shows up in the code below |
| `import type` | erased, so the module may never load at all (14/02) |

The default-export critique is worth taking seriously: `import fmt from "./format"`
and `import formatLength from "./format"` are the same import, and no tool can
tell you the second file is inconsistent. That is why most style guides in large
codebases ban default exports outright, and why `export default` is rare in
modern library source.

## Namespace imports carry their type with them

```ts
import * as units from "./units";
export type UnitName = keyof typeof units;   // "mm" | "cm" | "m" | "km"
```

The namespace object is a value, so `typeof` in type position reads it and
`keyof` takes its keys (10/01). Add a unit to `units.ts` and `UnitName`,
`unitNames()` and `toMetres` all follow with no second edit.

Note what `noUncheckedIndexedAccess` does *not* do here:

```ts
return value * units[unit];   // number, not number | undefined
```

That rule only applies to index *signatures*. `units` has four concrete
properties and `unit` is a union of exactly those four keys, so every access is
known to exist.

## `export { x } from "./m"` is not `import` then `export`

```ts
import { area } from "./shapes";
export { area };                    // `area` is a local binding here
export { area } from "./shapes";    // nothing enters this scope
```

Functionally the same to a consumer; different for everything else. The
forwarding form creates no local binding, so a barrel does not accumulate
"imported but never used" noise, and a bundler can follow the re-export straight
to the source module instead of routing through this one.

It is also the only form that can rename a default:

```ts
export { default as formatLength } from "./format";
```

## Why `export *` skips defaults

Every module has at most one default, so forwarding defaults through wildcards
would mean the last `export *` silently wins — or a collision on every barrel
that re-exported two modules. The spec sidesteps the whole question: `export *`
forwards named exports only.

The consequence is easy to trip over, because the code looks complete:

```ts
export * from "./format";     // PRECISION comes through; the function does not
```

One test asserts `Object.keys(barrel)` has no `default`, for exactly this
reason.

`export *` also drops names that would collide. If two modules both export
`area`, the wildcard forwards neither, and TypeScript reports the ambiguity
rather than picking one. Renaming on re-export —
`export { PRECISION as FORMAT_PRECISION } from "./format"` — is how a barrel
stays collision-free on purpose rather than by luck.

## Barrels: worth it, or not?

A barrel is a module whose only job is to re-export others, so consumers can
write `import { area, formatLength } from "./geometry"` instead of three paths.

**What you get:** one import path, a public surface you control, and freedom to
move files without touching consumers.

**What it costs:**

- **Import cost.** Importing one name from a barrel evaluates every module the
  barrel forwards. In a test that pulls in one helper, that can mean loading
  half the application — including whatever side effects come with it.
- **Cycles.** A barrel is the single most common way to create a circular
  import: a module reaches for a sibling through the barrel, and the barrel
  imports the module back. 14/04 is entirely about that failure.
- **Tree-shaking pressure.** It still works, but it depends on the bundler
  proving every forwarded module is side-effect-free — which `"sideEffects":
  false` in `package.json` is asserting, not demonstrating.

The workable rule: a barrel at a **package boundary**, where the surface is
genuinely public and the cost is paid once, is good. A barrel per directory,
used by that directory's own files, is how codebases end up with import cycles
and slow tests.

## Common mistakes

| Mistake | What happens |
|---|---|
| `export { Circle } from "./shapes"` for a type | Error under `isolatedModules` — it must be `export type` |
| `export * from "./format"` for the default | The function never appears; only `PRECISION` comes through |
| Hand-writing `UnitName` | Compiles, then drifts the moment `units.ts` changes |
| `import units from "./units"` | There is no default export; `units` is `undefined` at runtime |
| Importing a name only to re-export it | Works, but adds a local binding and hides the real source |
| `Object.keys(units)` assumed sorted | Export order is declaration order, not alphabetical — sort it |

## Interview angle

> *"Named exports or default exports?"*

Named, in application code, and the reason is not taste: a default export's name
is chosen at the import site, so the same module gets a different name in every
file and no tool can flag the inconsistency. Renaming a named export is a
refactor the compiler checks; renaming a default is not. Defaults still make
sense for a package whose entire purpose is one thing — a React component file,
a CLI entry — and even there the cost is that `export *` will not forward it.

> *"Are barrel files a good idea?"*

At a package boundary, yes: one public surface, freedom to move files behind it.
Inside a package, usually not. Importing one name from a barrel evaluates every
module it forwards, which slows tests and drags side effects along, and a
directory-level barrel is the most common source of circular imports — a module
reaching for its sibling through the barrel that also imports it back.
