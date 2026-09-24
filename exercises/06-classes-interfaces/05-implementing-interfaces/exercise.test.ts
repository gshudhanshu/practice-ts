import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  EmailNotifier,
  RetryingNotifier,
  SmsNotifier,
  broadcast,
  type Notifier,
  type SendResult,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _channel = Expect<Equal<Notifier["channel"], string>>;
type _send = Expect<
  Equal<Notifier["send"], (message: string) => SendResult>
>;

type _emailIsNotifier = Expect<EmailNotifier extends Notifier ? true : false>;
type _smsIsNotifier = Expect<SmsNotifier extends Notifier ? true : false>;
type _retryIsNotifier = Expect<
  RetryingNotifier extends Notifier ? true : false
>;

function _compileTimeOnly(): void {
  const email = new EmailNotifier();

  // @ts-expect-error — `sent` is a read-only view.
  email.sent.push("sneaky");

  // @ts-expect-error — channel is readonly.
  email.channel = "other";

  // Every implementation is usable through the interface.
  const notifiers: Notifier[] = [
    new EmailNotifier(),
    new SmsNotifier(),
    new RetryingNotifier(new SmsNotifier(), 2),
  ];
  void notifiers;
}

/* ── A notifier defined OUTSIDE the exercise file ───────────────────────────
   RetryingNotifier must work with this too — that is the point of coding
   against the interface rather than the concrete classes.               */

class FlakyNotifier implements Notifier {
  readonly channel = "flaky";
  calls = 0;

  constructor(private readonly failuresFirst: number) {}

  send(message: string): SendResult {
    this.calls += 1;
    if (this.calls <= this.failuresFirst) {
      return { ok: false, channel: this.channel, reason: "flaky" };
    }
    return { ok: true, channel: this.channel };
  }
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("EmailNotifier", () => {
  it("always succeeds", () => {
    expect(new EmailNotifier().send("hi")).toEqual({
      ok: true,
      channel: "email",
    });
  });

  it("records what it sent", () => {
    const email = new EmailNotifier();
    email.send("one");
    email.send("two");
    expect([...email.sent]).toEqual(["one", "two"]);
  });
});

describe("SmsNotifier", () => {
  it("sends short messages", () => {
    const sms = new SmsNotifier();
    expect(sms.send("hi")).toEqual({ ok: true, channel: "sms" });
    expect([...sms.sent]).toEqual(["hi"]);
  });

  it("accepts a message of exactly the maximum length", () => {
    const sms = new SmsNotifier();
    const exact = "x".repeat(SmsNotifier.MAX_LENGTH);
    expect(sms.send(exact).ok).toBe(true);
  });

  it("rejects anything longer, and does not record it", () => {
    const sms = new SmsNotifier();
    const tooLong = "x".repeat(SmsNotifier.MAX_LENGTH + 1);

    expect(sms.send(tooLong)).toEqual({
      ok: false,
      channel: "sms",
      reason: "too long",
    });
    expect([...sms.sent]).toEqual([]);
  });
});

describe("RetryingNotifier", () => {
  it("reports the wrapped channel", () => {
    expect(new RetryingNotifier(new SmsNotifier(), 3).channel).toBe("sms");
  });

  it("succeeds on the first attempt when it can", () => {
    const retrying = new RetryingNotifier(new EmailNotifier(), 3);
    expect(retrying.send("hi").ok).toBe(true);
    expect(retrying.attempts).toBe(1);
  });

  it("retries until the inner notifier succeeds", () => {
    const flaky = new FlakyNotifier(2);
    const retrying = new RetryingNotifier(flaky, 5);

    expect(retrying.send("hi")).toEqual({ ok: true, channel: "flaky" });
    expect(retrying.attempts).toBe(3);
    expect(flaky.calls).toBe(3);
  });

  it("gives up after maxAttempts and returns the last failure", () => {
    const flaky = new FlakyNotifier(99);
    const retrying = new RetryingNotifier(flaky, 3);

    expect(retrying.send("hi")).toEqual({
      ok: false,
      channel: "flaky",
      reason: "flaky",
    });
    expect(retrying.attempts).toBe(3);
  });

  it("wraps a notifier that always fails without retrying forever", () => {
    const sms = new SmsNotifier();
    const retrying = new RetryingNotifier(sms, 2);
    const result = retrying.send("x".repeat(500));

    expect(result.ok).toBe(false);
    expect(retrying.attempts).toBe(2);
  });
});

describe("broadcast", () => {
  it("sends through every notifier, in order", () => {
    const results = broadcast(
      [new EmailNotifier(), new SmsNotifier()],
      "hello",
    );
    expect(results).toEqual([
      { ok: true, channel: "email" },
      { ok: true, channel: "sms" },
    ]);
  });

  it("reports each failure independently", () => {
    const results = broadcast(
      [new EmailNotifier(), new SmsNotifier()],
      "x".repeat(500),
    );
    expect(results[0]?.ok).toBe(true);
    expect(results[1]?.ok).toBe(false);
  });

  it("returns [] for no notifiers", () => {
    expect(broadcast([], "hi")).toEqual([]);
  });
});
