# Section 22 — Real-world patterns

The interview-grade bonus block, and the last section in the repo.

Everything here is a pattern you will not find in the course and will find in
every senior TypeScript codebase. None of it is exotic type-level gymnastics —
these are five techniques that show up in production repositories, in interview
questions, and in the gap between "finished a course" and "would be trusted with
the domain model".

The section builds: 01, 02 and 03 are one pattern each, 04 applies the generics
you already have to HTTP, and 05 combines the first three into a single domain
module. Everything a later exercise needs is given, so they stand alone.

| # | Exercise | Tier | Time | Covers |
|---|---|---|---|---|
| 01 | [Branded types](01-branded-types/) | Core | 25 min | Nominal typing by intersection, smart constructors, brand erasure |
| 02 | [`Result<T, E>`](02-result-type/) | Core | 30 min | Errors as values, `map`/`flatMap`/`unwrapOr`, error unions |
| 03 | [State machines](03-state-machines/) | Core → Challenge | 35 min | Illegal transitions as compile errors, derived transition tables, `assertNever` |
| 04 | [Typed API client](04-typed-api-client/) | **Challenge** | 40 min | Endpoint maps, template-literal path parsing, `K extends keyof TMap` over HTTP |
| 05 | [Domain layer](05-domain-layer/) | **Challenge** | 45 min | All three combined: branded ids + `Result` + exhaustive transitions |

**Run one:** `npm run check 22/03` · **Run the section:** `npm run check 22`

## What to take away

- **TypeScript is structural, and sometimes you need nominal.** A phantom brand
  property is the whole trick: a `UserId` is usable as a `string`, a `string` is
  not usable as a `UserId`. The cost is a smart constructor holding one cast,
  and arithmetic that strips the brand.
- **A thrown error is invisible to the type system.** No `throws` clause, and
  `catch` gives you `unknown`. Putting the failure in the return type is what
  lets the compiler insist you handle it.
- **Expected failures are returned; bugs throw.** That single line is the
  answer to most "exceptions or error values?" questions, and it is the same
  line 06/01 drew.
- **`flatMap` unions the error types.** A pipeline's type then lists everything
  that can go wrong in it — derived, never written down twice.
- **Make illegal states unrepresentable, then make illegal transitions
  uncompilable.** A union where each state carries only what it knows removes
  the guards; a transition signature computed from the state's own discriminant
  removes the wrong calls.
- **Types are erased, so a runtime check is still needed.** The moment a state
  comes from a database its static type is the whole union. The compile-time
  check protects your code; the runtime table protects your data.
- **Derive, don't duplicate.** One `as const satisfies` table drives both the
  legal-event types and the runtime check, so they cannot disagree.
- **Let the map be the source of truth.** `api.get<User>(path)` is an assertion;
  `api.request("GET /users/:userId", { userId })` is a derivation.
- **A type is a promise, not a proof.** Every one of these patterns is erased at
  runtime, which is why a domain layer belongs *behind* a validation boundary
  (section 17), never instead of one.

## Interview questions this section prepares you for

- TypeScript is structurally typed — how would you get nominal typing?
- What is a branded type, and what does it cost?
- Would you throw, or return an error value? Where do you draw the line?
- How does `Result` compose? What does `flatMap` do to the error type?
- How would you model something with a lifecycle — an order, a subscription?
- What does "make illegal states unrepresentable" mean in practice?
- Doesn't a compile-time state check make the runtime check unnecessary?
- How would you make an API client type-safe end to end?
- Walk me through how you would model a domain in TypeScript.
- When is all this ceremony *not* worth it?
