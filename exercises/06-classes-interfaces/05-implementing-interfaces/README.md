# 06/05 — Implementing interfaces & polymorphism

**Tier:** Core → Challenge · **Time:** ~30 min · **Course section:** 06 — Classes & interfaces

---

## Why this exercise exists

One contract, three implementations — and the third one **implements the same
interface it consumes**. That is the decorator pattern, and it is the concrete
payoff of coding against an interface rather than a class: you can wrap
behaviour without any implementation knowing it has been wrapped.

The test file defines its **own** `Notifier` implementation and hands it to your
`RetryingNotifier`. If your wrapper is typed against the interface, that just
works. If it is typed against a concrete class, it will not compile.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `Notifier` — `readonly channel: string`, `send(message: string): SendResult`. |
| 2 | `EmailNotifier` — always succeeds; records messages in a **read-only** `sent` view. |
| 3 | `SmsNotifier` — rejects over `MAX_LENGTH` (160) with `reason: "too long"`, and does **not** record rejected messages. |
| 4 | `RetryingNotifier` — wraps any `Notifier`, retries up to `maxAttempts`, exposes `attempts` for the last send and the inner `channel`. |
| 5 | `broadcast` — send through every notifier, results in order. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.
- `RetryingNotifier` must accept **any** `Notifier`, not just the two concrete
  classes in this file.
- `sent` must not be mutable from outside — `email.sent.push(…)` must not
  compile.

## Done when

```bash
npm run check 06/05
```

<details>
<summary>Hint 1 — a read-only view over private state</summary>

Keep the real array `#private`, and expose it through a getter typed
`readonly string[]`:

```ts
#sent: string[] = [];
get sent(): readonly string[] { return this.#sent; }
```

No copying needed — `readonly` is a compile-time guarantee, so this stays O(1).
</details>

<details>
<summary>Hint 2 — the decorator</summary>

Store the wrapped notifier as `private readonly inner: Notifier` — the
**interface** type. Then `channel` delegates (`return this.inner.channel`) and
`send` calls `this.inner.send(...)` in a loop.

Because the field is typed as the interface, the wrapper works with anything
that satisfies it — including implementations that do not exist yet.
</details>

<details>
<summary>Hint 3 — <code>attempts</code> counts the LAST send</summary>

Reset the counter at the start of each `send`. A test calls `send` on a fresh
wrapper and expects `1`; another expects exactly `maxAttempts` after a total
failure.
</details>

<details>
<summary>Hint 4 — what to return when everything fails</summary>

The **last** result, so the inner notifier's own `reason` survives. Keep a
variable holding the most recent result, and return it when the loop exits.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
the decorator pattern, dependency inversion, and why `Notifier` as a parameter
type makes testing trivial.
