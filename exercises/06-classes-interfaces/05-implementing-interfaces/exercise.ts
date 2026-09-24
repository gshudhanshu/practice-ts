/**
 * Exercise 06/05 — Implementing interfaces & polymorphism
 *
 * One contract, several implementations, and a wrapper that implements the
 * same contract it consumes. That last one — the decorator pattern — is the
 * payoff of programming to an interface rather than to a class.
 *
 * Read README.md first. Replace every TODO.
 */

/** A discriminated union, exactly as in 02/04. */
export type SendResult =
  | { ok: true; channel: string }
  | { ok: false; channel: string; reason: string };

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// The contract every notifier must satisfy:
//   readonly channel: string
//   send(message: string): SendResult
export interface Notifier {}

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// Email always succeeds. It must record every message it sent, exposed as a
// read-only `sent` view (callers must not be able to push into it).
//   channel -> "email"
export class EmailNotifier {}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// SMS rejects anything longer than MAX_LENGTH (160) characters:
//   -> { ok: false, channel: "sms", reason: "too long" }
// Rejected messages must NOT be recorded in `sent`.
//   channel -> "sms"
export class SmsNotifier {
  static readonly MAX_LENGTH = 160;
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// A wrapper that implements Notifier AND consumes one — the decorator pattern.
//
//   - `channel` reports the wrapped notifier's channel
//   - `send` retries the inner notifier until it succeeds or `maxAttempts`
//     attempts have been made, then returns the last result
//   - `attempts` reports how many inner calls the LAST send made
//
// It must work with ANY Notifier, including ones written elsewhere.
export class RetryingNotifier {}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// Send the same message through every notifier, returning the results in
// order. The parameter type is the INTERFACE, so this function never needs to
// know which concrete classes exist.
export function broadcast(
  notifiers: readonly Notifier[],
  message: string,
): SendResult[] {
  throw new Error("TODO 5: implement broadcast");
}
