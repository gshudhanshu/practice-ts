# 14/04 — Barrels & cycles

## What actually happens

```
exercise.ts  →  index-barrel.ts
                  ├─ export * from "./catalogue"
                  │     catalogue.ts  →  index-barrel.ts   ← already in progress
                  │     …so TIERS is read here, before pricing has run
                  └─ export * from "./pricing"
                        pricing.ts  →  (nothing)
```

A module registers itself in the loader's cache *before* it is evaluated —
otherwise a cycle would loop forever. So when `catalogue` asks for
`index-barrel`, the loader hands back the barrel that is currently halfway
through its own evaluation, with only some of its exports attached.

`catalogue`'s top-level `TIERS?.[0]` reads a binding that has no value yet, and
gets `undefined`.

Two things follow, and they are the whole exercise:

- **The cycle did not corrupt anything.** `lazyDefaultTier()` reads the *same*
  binding and gets `"free"`. Import bindings are live views, not copies taken at
  import time.
- **Nothing is wrong with the type.** `TIERS[0]` really is `"free"`. The type
  system models what a module exports, not when it has finished exporting it,
  and it has no vocabulary for "not yet".

That last point is why this bug survives review: every type is correct, and the
program is still broken.

## The same cycle in three module systems

The failure looks different depending on what is actually running your code, and
knowing which you are in saves an afternoon.

| Runtime | What the early read does |
|---|---|
| CommonJS (`require`) | `undefined` — a partially-filled `module.exports` object |
| Native ESM (Node, browsers) | usually **throws** `ReferenceError: Cannot access 'TIERS' before initialization` — the binding is linked but in its temporal dead zone |
| Dev-server / SSR transforms (Vite, Jest, this repo) | `undefined` — imports become property reads on a namespace object, so there is no TDZ to trip |

Same import graph, three symptoms. The `ReferenceError` is the kindest of them:
it points at the line. The `undefined` cases are the ones that reach production,
because the value flows somewhere else before anyone notices.

Under this repo's runner you get `undefined`, which is why the test asserts it —
and why `catalogue.ts` uses `TIERS?.[0]` rather than `TIERS[0]`, so the module
finishes loading instead of dying and taking every other test with it.

## Fix 1: import the leaf, not the barrel

```ts
import { TIERS } from "./pricing";
export const workingDefaultTier: Tier = TIERS[0];
```

`pricing.ts` imports nothing that could point back, so there is no cycle to be
caught halfway through. This is the structural fix and the one to reach for
first: **depend on the module that owns the thing, not on a barrel that happens
to forward it.**

The rule that prevents the whole class of bug is a layering rule, not a lint
rule: a module may import from its dependencies, never from an index that
re-exports it. A barrel is a *consumer-facing* file. The moment a module inside
the barrel imports the barrel, you have a cycle — and it is usually added by
someone following the local convention of "import from the index".

## Fix 2: keep the barrel, move the read

```ts
export function lazyDefaultTier(): Tier {
  return BARREL_TIERS[0];
}
```

Because bindings are live, deferring the read until after evaluation completes
is enough. The same shape appears as a getter, a lazy `const` behind a function,
or an initialisation step that runs after the module graph is loaded.

It is the pragmatic fix when the import graph is not yours to change — a
framework's file conventions, a generated barrel, a dependency you do not
control. It has a real cost: it hides the coupling. The cycle is still there,
and the next person who adds a top-level read will rediscover it.

Fix 1 removes the problem; fix 2 tolerates it. Prefer fix 1.

## What is safe inside a cycle, and what is not

| At module-init time | Safe? |
|---|---|
| Reading an imported **value** | **No** — this exercise |
| Extending an imported **class** (`class A extends B`) | **No** — the `extends` clause is evaluated immediately |
| Calling an imported function | **No** |
| Using an imported **type** | Yes — erased entirely |
| Referencing an imported binding **inside a function body** | Yes — the body runs later |
| A hoisted `function` declaration in the other module | Yes — hoisted before evaluation |

The pattern behind the table: **anything that runs while the module is being
evaluated is unsafe; anything deferred to later is fine.** Which is also why
`import type` is immune — nothing runs at all.

## How to keep barrels without buying cycles

- **One direction only.** Files inside a folder import each other by relative
  path; only code *outside* the folder imports the barrel. Enforceable —
  `eslint-plugin-import`'s `no-cycle`, or `dependency-cruiser`, or `madge`.
- **Barrels at package boundaries, not per directory.** The narrower the barrel's
  audience, the more likely one of its own members imports it.
- **Keep leaves genuinely leafy.** `pricing.ts` here imports one thing. A module
  holding constants and pure functions cannot participate in a cycle, and that
  is worth designing for rather than discovering.
- **No side effects at module scope in a barrel's members.** If `catalogue.ts`
  did nothing at init, the cycle would still exist and nothing would break.
  Cycles are only fatal when combined with init-time work.
- **Test the entry points you ship.** This bug is invisible if your tests import
  the leaf modules directly and only production imports the barrel.

## Common mistakes

| Mistake | What happens |
|---|---|
| Dropping the barrel import in TODO 1 | The failure disappears; you have hidden it, not understood it |
| Importing `./catalogue` in `exercise.ts` | Enters the cycle from a different module; the bug stops reproducing |
| Expecting a type error | There is none, and there cannot be — the types are all correct |
| `TIERS[0]` inside `catalogue.ts` (no `?.`) | Under native ESM it throws; the module dies and takes the test file with it |
| Assuming a cycle means double evaluation | Each module still runs exactly once — a test checks it |
| Re-exporting through `./index-barrel` in TODO 5 | Consumers pay for the whole cycle to read one price |
| "Fixing" it by reordering the barrel's `export *` lines | Works today, breaks the next time someone adds a line |

## Interview angle

> *"You get `undefined` for something you definitely exported. What is going
> on?"*

Almost always a circular import: the module you are reading from is still
mid-evaluation, so the binding exists but has no value yet. Say what makes it
hard — no type error, no build error, and the type is genuinely correct, because
the type system describes what a module exports and not when. Then the two
fixes: import the owning module directly rather than a barrel that forwards it,
or defer the read into a function so it happens after evaluation. And name the
symptom difference: native ESM usually throws `ReferenceError`, CommonJS and
most dev-server transforms give you `undefined`.

> *"Are barrel files worth it?"*

At a package boundary, yes — one public surface, freedom to move files behind
it. Per directory, usually not: importing one name evaluates every module the
barrel forwards, which slows tests and drags side effects along, and it is the
most common source of cycles, because a module inside the barrel eventually
imports the barrel. The rule that keeps them safe is directional — inside the
folder, import by relative path; only outside code imports the index — and it is
worth enforcing with `no-cycle` rather than discipline.
