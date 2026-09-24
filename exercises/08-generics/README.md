# Section 08 — Generics

Maps to `08-generics` in the course repo.

Generics are where TypeScript stops being "JavaScript with annotations" and
starts being a type *system*. They are also the single most common interview
topic beyond the basics.

| # | Exercise | Tier | Time | Covers |
|---|---|---|---|---|
| 01 | [Generic functions](01-generic-functions/) | Drill → Core | 20 min | Inference, multiple parameters, the "appears once" rule |
| 02 | [Constraints](02-constraints/) | Core | 25 min | `extends`, `K extends keyof T`, constraint vs callback |
| 03 | [Generic classes](03-generic-classes/) | Core | 30 min | Generic classes and interfaces, typed fakes |
| 04 | [Defaults & inference control](04-defaults-and-inference-control/) | Core | 25 min | `T = Default`, `const T`, `NoInfer<T>` |
| 05 | [Typed event emitter](05-typed-event-emitter/) | **Challenge** | 40 min | `TEvents[K]`, contravariance, containing one cast |

**Run one:** `npm run check 08/02` · **Run the section:** `npm run check 08`

## What to take away

- **A generic relates types.** If a type parameter appears only **once**, it
  relates nothing — use a constraint or `unknown` instead. This one rule catches
  most over-engineered generic code.
- **`K extends keyof T` returning `T[K]`** is the everyday pattern. Capturing
  `K` (rather than using `keyof T` directly) is what makes the return type
  follow the specific key.
- **Constrain `T` through a `Record`** when the key is itself a type parameter —
  that is how `sortByKey` rejects a non-comparable property.
- **A constraint is not a default.** One says what is allowed, the other what is
  used when omitted; they compose.
- **`const T`** moves the `as const` decision from the caller to the API author.
  **`NoInfer<T>`** stops a fallback argument from voting on the type.
- **Explicit type arguments are usually a smell** — inference failing is
  information worth understanding.

## Interview questions this section prepares you for

- When would you use a generic — and when is one pointless?
- Write a type-safe `get(object, key)`.
- What's the difference between `<T>(x: T) => T` and `(x: any) => any`?
- When do you put a type parameter on the class versus the method?
- What does `NoInfer` do?
- **Design a type-safe event emitter.** (08/05 is the full answer.)
- How do you test a service that depends on a database?
