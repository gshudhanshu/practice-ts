/**
 * Solution — 06/05 Implementing interfaces & polymorphism
 */

export type SendResult =
  | { ok: true; channel: string }
  | { ok: false; channel: string; reason: string };

export interface Notifier {
  readonly channel: string;
  send(message: string): SendResult;
}

export class EmailNotifier implements Notifier {
  // Inferred as the literal "email" because of `readonly` — still assignable
  // to the interface's `string`.
  readonly channel = "email";

  // `#sent` is genuinely private; the getter exposes it as `readonly string[]`,
  // so callers can read and iterate but cannot push. The array is not copied,
  // so this stays O(1) — `readonly` is a compile-time guarantee, which is
  // exactly what is needed here.
  #sent: string[] = [];

  get sent(): readonly string[] {
    return this.#sent;
  }

  send(message: string): SendResult {
    this.#sent.push(message);
    return { ok: true, channel: this.channel };
  }
}

export class SmsNotifier implements Notifier {
  static readonly MAX_LENGTH = 160;

  readonly channel = "sms";

  #sent: string[] = [];

  get sent(): readonly string[] {
    return this.#sent;
  }

  send(message: string): SendResult {
    // Reject BEFORE recording, so `sent` only ever holds delivered messages.
    if (message.length > SmsNotifier.MAX_LENGTH) {
      return { ok: false, channel: this.channel, reason: "too long" };
    }

    this.#sent.push(message);
    return { ok: true, channel: this.channel };
  }
}

export class RetryingNotifier implements Notifier {
  #attempts = 0;

  constructor(
    // Typed as the INTERFACE, not as a concrete class. That is what lets this
    // wrap EmailNotifier, SmsNotifier, another RetryingNotifier, or a class
    // defined in a completely different file — including the test's own.
    private readonly inner: Notifier,
    private readonly maxAttempts: number,
  ) {}

  // Delegate: the wrapper is transparent about which channel it represents.
  get channel(): string {
    return this.inner.channel;
  }

  get attempts(): number {
    return this.#attempts;
  }

  send(message: string): SendResult {
    // Reset per send, so `attempts` describes the LAST send, not all time.
    this.#attempts = 0;

    let last: SendResult = {
      ok: false,
      channel: this.channel,
      reason: "no attempts made",
    };

    while (this.#attempts < this.maxAttempts) {
      this.#attempts += 1;
      last = this.inner.send(message);
      if (last.ok) return last;
    }

    // Every attempt failed — hand back the most recent failure, which carries
    // the inner notifier's own reason.
    return last;
  }
}

export function broadcast(
  notifiers: readonly Notifier[],
  message: string,
): SendResult[] {
  // Knows nothing about the concrete classes — that is the whole point.
  return notifiers.map((notifier) => notifier.send(message));
}
