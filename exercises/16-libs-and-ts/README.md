# Section 16 — Third-party libraries & declaration files

Maps to the "using third-party libraries" part of the course.

Everything here is about **code you did not write and cannot change**: a
JavaScript package with no types, a library type that is missing the property
your middleware needs, an API that still calls you back, an SDK whose every
signature is `any`.

One idea runs through all four:

> A type you write about someone else's code is a **promise, not a check**.
> Nothing verifies it — so make it match reality, and put it in one place where
> reality can be checked.

| # | Exercise | Tier | Time | Covers |
|---|---|---|---|---|
| 01 | [Declaration files](01-declaration-files/) | Core | 30 min | `.d.ts`, `declare module`, `declare global`, why `declare` emits nothing |
| 02 | [Augmenting library types](02-augmenting-library-types/) | Core | 25 min | Module augmentation, declaration merging, and its program-wide cost |
| 03 | [Typing callback APIs](03-typing-callback-apis/) | Core | 30 min | Error-first callbacks, generic promisify, overloads, `Result` |
| 04 | [The typed facade](04-typed-facade/) | **Challenge** | 40 min | Containing `any` at one boundary, validation, wire vs domain types |

**Run one:** `npm run check 16/03` · **Run the section:** `npm run check 16`

> Each exercise here excludes `solution/` from its own `tsconfig.json`: a
> reference solution containing a global declaration or a module augmentation
> would otherwise leak into the file you are editing and make the starter
> compile. `npm run verify:solutions` still type-checks every solution.
>
> 16/02 also sets `"types": ["node"]` so that `node:http` resolves — 15/03
> explains what that field does.

## What to take away

- **A `.d.ts` emits nothing and checks nothing.** `declare` is a promise about
  code the compiler cannot see, so declaring away an inconvenient `undefined`
  does not remove it — it just guarantees the crash is a surprise.
- **Three places types come from**: bundled with the package, `@types/*` on
  DefinitelyTyped, or your own `declare module`. They are looked up in that
  order, which is why a stale `@types` package can drift from what is installed.
- **`declare global` needs `var`**, and needs a file that is already a module.
  `const` there declares a name that `globalThis.x` cannot see.
- **Interfaces and namespaces merge; type aliases and classes do not.** That is
  the whole reason libraries expose extension points as interfaces.
- **An augmentation is program-wide.** Make the property optional, or use a
  wrapper type / context parameter when that reach is wrong.
- **`(error, value?)` cannot express its own contract.** Wrap the API once and
  hand everything above a `Promise<T>` or a discriminated `Result`.
- **`any` is contagious, `unknown` is not.** Contain untyped dependencies behind
  one function that returns `unknown`, validate there, and translate the wire
  shape into a domain type so the vendor's naming stops at the boundary.

## Interview questions this section prepares you for

- You need a JavaScript library with no types. What do you do?
- What is the difference between `declare module` and module augmentation?
- How do you add a property to a request object from a library?
- What is declaration merging, and when have you used it?
- How would you wrap a callback-based API?
- Promise rejection or a `Result` type?
- A dependency has no types, or terrible ones. How do you use it safely?
- What is the difference between `any` and `unknown`?
