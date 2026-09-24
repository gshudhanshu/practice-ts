# Section 17 — Working with third-party libraries

Maps to `16-17-third-party-libs` in the course repo.

One coherent mini-project, in three parts. The dependency is
`legacy-http.ts` — a small HTTP helper that ships no types, returns `any` from
every function, and rejects with three different kinds of thing depending on how
your day is going. You cannot fix it. You can stop it from reaching the rest of
your code.

That is what the section builds: a **typed boundary** (17/01), a **validation
boundary** (17/02), and the service that puts both behind caching and retries
(17/03). Each part hands you the finished version of the previous one, so they
can be done out of order.

| # | Exercise | Tier | Time | Covers |
|---|---|---|---|---|
| 01 | [Typed client](01-typed-client/) | Core | 30 min | Surface types over an `any` library, `unknown` vs `any`, one error type |
| 02 | [Validation boundary](02-runtime-validation-boundary/) | Core | 30 min | Parser combinators, wire → domain renaming, located errors |
| 03 | [Catalogue service](03-integration/) | **Challenge** | 40 min | Decorating a client, TTL caching, retry policy, injected time |

**Run one:** `npm run check 17/02` · **Run the section:** `npm run check 17`

## What to take away

- **You cannot make a bad dependency safe — you can make it small.** One module
  imports it, exports types you own, and everything else is spared.
- **Declare the surface you use, not the library.** Four lines you can verify
  beat a four-hundred-line `.d.ts` that has silently drifted.
- **Hand back `unknown`, never `any`.** `any` disables checking; `unknown`
  postpones it until someone has actually looked. There is a compile-time
  assertion in 17/01 for exactly this, because it is the one shortcut that
  passes every runtime test and achieves nothing.
- **A type annotation on parsed JSON is an unchecked claim.** Only code that
  looks at the value at runtime can honestly produce a domain type — which is
  why `as` is banned throughout this section.
- **Parse, don't validate.** `(value: unknown) => T` gives you the narrowed
  value; `(value: unknown) => boolean` leaves you needing a cast anyway.
- **Errors need categories, not just messages.** `status === 0`, 4xx, 5xx and a
  `ValidationError` demand four different responses, and a client that flattens
  them into `Error` has thrown that decision away.
- **Decorate, don't modify.** Because `fetchProducts` takes *a* `TypedClient`,
  caching and retries slot underneath it with no change to either side.
- **Inject anything that involves time.** `now` and `sleep` as constructor
  options turn a four-minute test suite into a 500ms one.

## Interview questions this section prepares you for

- How do you use a library that has no type declarations?
- What is the difference between `any` and `unknown`? When would you use each?
- You get JSON back from an API — how do you know it matches your type?
- Where should validation live in an application?
- How would you add caching and retries to an existing API client?
- Which failures are safe to retry, and which are not?
- How do you test code that waits?
