# Section 14 — Modules & namespaces

The module system is the part of TypeScript that is mostly *not* TypeScript. ES
modules are a JavaScript feature with runtime semantics of their own, and almost
every problem in this section comes from the gap between what the type system
can see and what the loader actually does.

Every exercise here ships **real neighbouring modules** — the verifier copies
the whole directory, so the imports you write are imports that run.

| # | Exercise | Tier | Time | Covers |
|---|---|---|---|---|
| 01 | [Import & export forms](01-import-export-forms/) | Drill → Core | 20 min | Named/default/namespace, re-exports, `export *`, barrels |
| 02 | [`import type` & verbatim](02-import-type-and-verbatim/) | Core | 25 min | Type-only imports, side-effect elision, `verbatimModuleSyntax` |
| 03 | [Merging & augmentation](03-declaration-merging-and-augmentation/) | Core | 25 min | `declare module`, `declare global`, function/class + namespace |
| 04 | [Barrels & cycles](04-barrels-and-cycles/) | **Challenge** | 35 min | A cycle that returns `undefined`, and two ways out |

**Run one:** `npm run check 14/02` · **Run the section:** `npm run check 14`

## A note on the compiler options

Each exercise here sets `verbatimModuleSyntax: true` in its own
`tsconfig.json`, on top of the repo's `isolatedModules`. It changes how imports
are emitted, and 14/02 is built around the difference — so if you copy one of
these exercises into a project of your own, copy the tsconfig too or the runtime
behaviour will not match.

## What to take away

- **An import does two things**: it binds a name, and it makes a module *run*.
  The second half is invisible in the source and is where the bugs are.
- **`import type` is a promise you can keep.** It erases the whole statement,
  side effects included — which is the point, and the trap.
- **`verbatimModuleSyntax` removes the compiler's judgement call.** What you
  wrote is emitted, minus `type`. Worth it because `tsc` is usually not the tool
  producing your JavaScript, and bundlers have no types to reason with.
- **`export *` forwards named exports and never a default**, and drops names
  that would collide. Both are easy to miss because the code looks complete.
- **Interfaces merge; type aliases do not.** That is why a public API meant to
  be extended is declared with interfaces, and why `@types` packages are written
  almost entirely in them.
- **Augmentation is global and unconditional.** `declare module` and `declare
  global` are the right tool for objects a framework hands you, and the wrong
  one when a local intersection type would do.
- **Cycles do not corrupt bindings; they make them late.** Import bindings are
  live views, so the same read that gives `undefined` at module-init time gives
  the right answer from inside a function.
- **A barrel is a consumer-facing file.** The moment a module inside the barrel
  imports the barrel, you have a cycle — and the type system will not tell you.

## How this section relates to earlier ones

- [06/04](../06-classes-interfaces/04-interfaces-vs-type-aliases/README.md)
  introduced declaration merging. 14/03 applies it to modules and the global
  scope rather than re-explaining it.
- [10/01](../10-deriving-types/01-keyof-and-typeof/README.md)'s `keyof typeof`
  is what turns a namespace import into a typed lookup table in 14/01.
- [03](../03-tsconfig/README.md) covered compiler flags in the abstract. 14/02
  is a flag you can watch change the runtime behaviour of the same source.

## Interview questions this section prepares you for

- Named exports or default exports, and why?
- What does `import type` do, and why would a codebase turn on
  `verbatimModuleSyntax`?
- How would you add a property to `Request` in an Express app?
- Why can interfaces merge when type aliases cannot?
- You get `undefined` for something you definitely exported. What is going on?
- Are barrel files a good idea?
