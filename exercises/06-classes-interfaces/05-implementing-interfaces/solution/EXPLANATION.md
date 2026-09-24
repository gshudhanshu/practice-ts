# 06/05 — Implementing interfaces & polymorphism

## The decorator pattern

`RetryingNotifier` **implements** `Notifier` and **consumes** one:

```ts
export class RetryingNotifier implements Notifier {
  constructor(private readonly inner: Notifier, private readonly maxAttempts: number) {}
  get channel(): string { return this.inner.channel; }
  send(message: string): SendResult { /* retry this.inner.send */ }
}
```

Because it satisfies the same contract it consumes, it is **transparent**:
anything that accepts a `Notifier` accepts a wrapped one, and wrappers compose.

```ts
new RetryingNotifier(new LoggingNotifier(new SmsNotifier()), 3);
```

Retry, logging, rate limiting, metrics, caching — each is a separate wrapper,
each independently testable, and none of them requires touching `SmsNotifier`.
Compare with the inheritance approach: `RetryingSmsNotifier extends SmsNotifier`
would need a new subclass for every combination.

This is what "favour composition over inheritance" means in practice, and it is
the same shape as Express middleware, HTTP client interceptors, and React
higher-order components.

## Dependency inversion — why the field is typed as the interface

The one line that makes it all work:

```ts
private readonly inner: Notifier;   // not: private readonly inner: SmsNotifier
```

`RetryingNotifier` depends on the **abstraction**, not on a concrete class. The
test proves it: it defines `FlakyNotifier` in a completely different file, hands
it to your wrapper, and everything works. Your code was written before that
class existed.

The same reasoning applies to `broadcast(notifiers: readonly Notifier[], …)` —
it never learns which implementations exist, so new ones need no change to it.

And the testing payoff: a service typed against an interface can be handed a
fake in a test with no mocking framework, no module interception, and no network.
`FlakyNotifier` **is** that fake.

## Read-only views over private state

```ts
#sent: string[] = [];
get sent(): readonly string[] { return this.#sent; }
```

The class mutates a real `string[]`; the outside world sees `readonly string[]`,
so `email.sent.push(…)` does not compile. No copy is made, so reading stays
O(1) — `readonly` is a compile-time guarantee, not a runtime one.

The honest caveat: a determined caller *can* defeat it (`(email.sent as
string[]).push(…)`). This is protection against mistakes, not against
adversaries. If you need the real thing, return a copy (`[...this.#sent]`) or
freeze it — and pay for it.

## Validate before recording

```ts
if (message.length > SmsNotifier.MAX_LENGTH) {
  return { ok: false, channel: this.channel, reason: "too long" };
}
this.#sent.push(message);
```

Same principle as the factory ordering in 06/02: reject first, mutate second, so
a rejected operation leaves no trace. `sent` means "messages actually
delivered", and it should never contain anything else.

## Returning results instead of throwing

`SendResult` is a discriminated union rather than an exception:

```ts
type SendResult =
  | { ok: true; channel: string }
  | { ok: false; channel: string; reason: string };
```

A failed send is an **expected outcome** (the network is down; the message is
too long), not a bug — the 06/01 distinction again. Returning it means
`broadcast` can report per-channel results without a try/catch around each call,
and the compiler forces callers to check `ok` before reading `reason`.

This is the shape of `Result` / `Either` types, which you build properly in
bonus section 22.

## Resetting `attempts`

```ts
send(message: string): SendResult {
  this.#attempts = 0;   // per send, not cumulative
  …
}
```

Mutable state on a decorator is a small design smell — two concurrent `send`
calls on the same instance would interleave and corrupt the count. Fine here
(everything is synchronous), but in async code you would return the attempt
count in the result instead of storing it. Worth noticing that the exercise's
convenient API is not automatically the right API.

## Common mistakes

| Mistake | What happens |
|---|---|
| `inner: SmsNotifier` | `FlakyNotifier` will not compile as an argument |
| `sent` as a public `string[]` | The `@ts-expect-error` on `push` stops erroring |
| Recording before validating | The "does not record rejected" test fails |
| Not resetting `attempts` | The counter accumulates across sends |
| `channel = "retrying"` | The delegation test fails — the wrapper must be transparent |
| Returning a fresh failure after the loop | Loses the inner notifier's `reason` |
| `for (let i = 0; i <= maxAttempts; i++)` | One attempt too many |

## Interview angle

> *"How would you add retries to an existing service without changing it?"*

Describe this exercise: a wrapper implementing the same interface, holding an
instance of it. Then extend the idea — logging, metrics, caching and rate
limiting are all the same shape, and they compose in any order. Naming the
pattern (decorator) and where the reader has seen it (Express middleware, axios
interceptors) makes the answer concrete.

> *"How do you test a class that sends emails?"*

Depend on an interface, pass a fake implementation in the test. No mocking
library, no network, no module interception — and the fake is ten lines. This
is the practical argument for dependency inversion, and it lands much better
than quoting the SOLID acronym.
