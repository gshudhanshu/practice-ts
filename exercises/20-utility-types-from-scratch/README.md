# Section 20 — Utility types from scratch

The first of the job-prep bonus sections. No new syntax: section 10 taught
mapped types, conditional types, `infer` and template literals — this section
**applies** them, by rebuilding the standard library's utility types by hand.

> *"Implement `Partial<T>` yourself"* is the most-asked TypeScript interview
> question there is. Rebuilding all of them is how the type system stops feeling
> like a list of magic words.

Anything that would shadow a global is prefixed `My…` (`MyPartial`, `MyPick`,
`MyAwaited`), and every exercise compares your version against the real one. Where they differ — and
several do — the explanation says why, because that is where the interesting
material lives: the standard library's constraints are looser than you would
choose, `NonNullable` is not a conditional any more, and `DeepPartial` is
absent for a reason.

These are almost entirely **type-level** exercises, so the `Expect<Equal<…>>`
assertions are the specification. Each one also has a small runtime function, to
keep the two halves of each idea attached to each other.

| # | Exercise | Tier | Time | Covers |
|---|---|---|---|---|
| 01 | [Object modifiers](01-object-modifiers/) | Drill → Core | 20 min | `Partial`, `Required`, `Readonly`, `Mutable`; **homomorphism** |
| 02 | [Key selection](02-key-selection/) | Core | 25 min | `Pick`, `Omit`, `Record`, `Prettify`; mapping over `K` vs `keyof T` |
| 03 | [Union filters](03-union-filters/) | Core | 25 min | `Exclude`, `Extract`, `NonNullable`; **distribution**, `never` as the empty union |
| 04 | [Function types](04-function-types/) | Core → Challenge | 30 min | `ReturnType`, `Parameters`, `InstanceType`, `Awaited`; `infer`, thenables |
| 05 | [Stricter versions](05-stricter-versions/) | **Challenge** | 35 min | `StrictOmit`, `StrictExtract`, `DistributiveOmit`; where the built-ins are loose |
| 06 | [Deep variants](06-deep-variants/) | **Challenge** | 40 min | `DeepPartial`, `DeepReadonly`, `DeepMutable`; recursion, leaf sets, depth limits |

**Run one:** `npm run check 20/03` · **Run the section:** `npm run check 20`

## What to take away

- **A mapped type over `keyof T` is homomorphic** and preserves `readonly` and
  `?`; over a computed key union it silently drops both. It also maps arrays to
  arrays and tuples to tuples, which is why `DeepReadonly` needs no array case.
- **`Pick` maps over `K`, not `keyof T`** — and is still homomorphic, because
  `K extends keyof T` counts. The constraint is half the behaviour of a utility
  type, not decoration.
- **`Exclude` and `Extract` are filters only because conditionals distribute**,
  and because `never` is the empty union, so a member mapped to `never`
  disappears. `[T] extends [never]` is how you turn that off.
- **Prefer a form the compiler can evaluate eagerly** — an intersection or an
  indexed access — over a conditional, wherever a utility will be used inside
  generic code. That is exactly why the stdlib's `NonNullable<T>` is now
  `T & {}` and not a conditional.
- **The built-ins are deliberately loose.** `Omit` accepts keys that do not
  exist and collapses discriminated unions. Know the strict versions, and know
  when the loose behaviour is the right one.
- **Deep variants are a policy decision, not an algorithm.** The leaf set —
  `Date`, `RegExp`, functions, `Map`, `Set` — is the design; the recursion is
  three lines.
- **`readonly` is a compile-time promise, `Object.freeze` is the runtime one.**
  Neither is sufficient alone.

## Interview questions this section prepares you for

- Implement `Partial<T>` / `Pick<T, K>` / `Omit<T, K>` / `ReturnType<T>`.
- What does *homomorphic* mean, and why does it matter?
- What is a distributive conditional type, and how do you switch it off?
- Why doesn't `T extends never ? true : false` detect `never`?
- Why is `Awaited<T>` more than one line?
- Is there anything wrong with the standard `Omit`? *(Two things — 20/05.)*
- Why did my discriminated union collapse after an `Omit`?
- **Write `DeepPartial<T>`, then tell me everything it gets wrong.** *(20/06 is
  the full answer.)*
