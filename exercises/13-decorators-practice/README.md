# Section 13 — Decorators practice

One small project across three exercises: a class that binds its own methods,
validates its own fields, and announces its own changes. Everything is built
from **standard (TC39) decorators** — the flavour TypeScript compiles when
`experimentalDecorators` is off and the target is ES2022 or newer, which is the
default here.

Standard decorators are a JavaScript feature that TypeScript merely
type-checks, not a TypeScript feature. That is the whole reason to learn this
flavour rather than the legacy one: it is the version that survives a change of
build tool.

| # | Exercise | Tier | Time | Covers |
|---|---|---|---|---|
| 01 | [The autobind decorator](01-autobind-decorator/) | Core | 25 min | Method decorators, `addInitializer`, factories, order |
| 02 | [Validation decorators](02-validation-decorators/) | Core | 30 min | Field decorators, `context.access`, per-instance registries |
| 03 | [Observable model](03-observable-model/) | **Challenge** | 40 min | `accessor` decorators, `init`, batching and change merging |

**Run one:** `npm run check 13/02` · **Run the section:** `npm run check 13`

## The one thing that differs from every other section

A decorator runs when the **class is defined**, which is when the module loads.
A starter body that threw would kill the whole test file before a single test
ran, so the decorator starters here are harmless no-ops instead. They compile
and they load; they just do nothing yet. Plain functions (`validate`,
`subscribe`, `snapshot`, `batch`) still `throw` as usual.

## What to take away

- **`(target, context) => replacement | void`.** One signature for every kind of
  decorator. What `target` *is* — and whether returning something helps — is the
  only thing that varies.
- **`addInitializer` is where per-instance work goes.** The decorator itself
  runs once, at class definition. Anything needing an instance has to wait for
  construction.
- **Field decorators cannot see values; accessor decorators can.** A field is a
  slot, so there is nothing to intercept. `accessor` generates a getter/setter
  pair over private storage, which is what makes reactivity possible.
- **`context.access` beats indexing the object.** It is typed, it reaches
  `#private` storage, and it removes the last reason to reach for `as`.
- **Order is bottom-up.** The decorator nearest the member is applied first and
  its result is handed upwards. Get it wrong and everything still compiles while
  one path silently stops working.
- **Describe what was stored, not what was passed.** As soon as decorators
  compose, the value going in is not necessarily the value that lands.
- **Decorators register; ordinary functions run.** Every library in this space —
  class-validator, MobX, Lit — draws the line in the same place, and it is what
  keeps the decorated class testable.

## How this section relates to earlier ones

- [05/03](../05-modernjs/03-arrow-functions-and-this/README.md) fixed detached
  `this` with an arrow class field. 13/01 fixes it with a decorator, and the
  EXPLANATION sets the two side by side.
- [09/02](../09-classes-generics-practice/02-composable-validators/README.md)
  built composable validation out of closures. 13/02 is the same feature with
  the wiring moved to the declaration site — and a different set of trade-offs.

## Interview questions this section prepares you for

- What changed between TypeScript's legacy decorators and the standard ones?
- How would you stop a method losing `this` when it is passed as a callback —
  and what are the alternatives to a decorator?
- How does something like class-validator actually work?
- Where should the metadata a decorator collects live?
- Implement a small observable model. How do you avoid notifying on a no-op
  write, and how do you coalesce a burst of writes?
- Why did the decorators proposal need to add `accessor`?

## A note on tooling

Standard decorators are still ahead of most runtimes: V8 does not implement
them, and Vite's Oxc transform only handles the legacy flavour. This repo's
`vitest.config.ts` therefore hands decorator-using files to `tsc` before they
run. Worth knowing, because it is the same reason your own project may need a
build-step change before `@decorator` works at all.
