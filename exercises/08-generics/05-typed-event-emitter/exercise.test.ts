import { describe, expect, it, vi } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import { EventEmitter } from "./exercise";

/* ── Fixtures ───────────────────────────────────────────────────────────── */

type AppEvents = {
  login: { userId: string };
  logout: { userId: string; reason: string };
  error: { message: string; code: number };
};

const makeEmitter = (): EventEmitter<AppEvents> => new EventEmitter<AppEvents>();

/* ── Compile-time spec ──────────────────────────────────────────────────── */

function _compileTimeOnly(): void {
  const emitter = makeEmitter();

  // The payload type follows the event name.
  emitter.on("login", (payload) => {
    type _payload = Expect<Equal<typeof payload, { userId: string }>>;
    payload.userId.toUpperCase();
  });

  emitter.on("error", (payload) => {
    type _payload = Expect<
      Equal<typeof payload, { message: string; code: number }>
    >;
  });

  // @ts-expect-error — `reason` belongs to logout, not login.
  emitter.on("login", (payload) => payload.reason);

  // @ts-expect-error — unknown event name.
  emitter.on("nope", () => undefined);

  // @ts-expect-error — wrong payload shape.
  emitter.emit("login", { wrong: true });

  // @ts-expect-error — a payload is required.
  emitter.emit("login");

  // @ts-expect-error — unknown event name.
  emitter.emit("nope", {});

  emitter.emit("logout", { userId: "1", reason: "timeout" });

  const unsubscribe = emitter.on("login", () => undefined);
  type _unsubscribe = Expect<Equal<typeof unsubscribe, () => void>>;

  type _count = Expect<Equal<ReturnType<EventEmitter<AppEvents>["listenerCount"]>, number>>;
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("on / emit", () => {
  it("calls the listener with the payload", () => {
    const emitter = makeEmitter();
    const listener = vi.fn();

    emitter.on("login", listener);
    emitter.emit("login", { userId: "1" });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ userId: "1" });
  });

  it("calls listeners in registration order", () => {
    const emitter = makeEmitter();
    const order: string[] = [];

    emitter.on("login", () => order.push("first"));
    emitter.on("login", () => order.push("second"));
    emitter.emit("login", { userId: "1" });

    expect(order).toEqual(["first", "second"]);
  });

  it("only calls listeners for the emitted event", () => {
    const emitter = makeEmitter();
    const onLogin = vi.fn();
    const onLogout = vi.fn();

    emitter.on("login", onLogin);
    emitter.on("logout", onLogout);
    emitter.emit("login", { userId: "1" });

    expect(onLogin).toHaveBeenCalledTimes(1);
    expect(onLogout).not.toHaveBeenCalled();
  });

  it("emitting with no listeners is a no-op", () => {
    expect(() => makeEmitter().emit("login", { userId: "1" })).not.toThrow();
  });

  it("ignores a duplicate registration of the same function", () => {
    const emitter = makeEmitter();
    const listener = vi.fn();

    emitter.on("login", listener);
    emitter.on("login", listener);
    emitter.emit("login", { userId: "1" });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(emitter.listenerCount("login")).toBe(1);
  });
});

describe("off / unsubscribe", () => {
  it("removes a listener", () => {
    const emitter = makeEmitter();
    const listener = vi.fn();

    emitter.on("login", listener);
    emitter.off("login", listener);
    emitter.emit("login", { userId: "1" });

    expect(listener).not.toHaveBeenCalled();
  });

  it("the returned unsubscribe removes it too", () => {
    const emitter = makeEmitter();
    const listener = vi.fn();

    const unsubscribe = emitter.on("login", listener);
    unsubscribe();
    emitter.emit("login", { userId: "1" });

    expect(listener).not.toHaveBeenCalled();
    expect(emitter.listenerCount("login")).toBe(0);
  });

  it("removing an unknown listener is a no-op", () => {
    const emitter = makeEmitter();
    expect(() => emitter.off("login", () => undefined)).not.toThrow();
  });

  it("survives a listener unsubscribing during the emit", () => {
    const emitter = makeEmitter();
    const order: string[] = [];

    const unsubscribeFirst = emitter.on("login", () => {
      order.push("first");
      unsubscribeFirst();
    });
    emitter.on("login", () => order.push("second"));

    emitter.emit("login", { userId: "1" });

    // Both ran, even though the first removed itself mid-loop.
    expect(order).toEqual(["first", "second"]);
    expect(emitter.listenerCount("login")).toBe(1);
  });
});

describe("once", () => {
  it("fires exactly once", () => {
    const emitter = makeEmitter();
    const listener = vi.fn();

    emitter.once("login", listener);
    emitter.emit("login", { userId: "1" });
    emitter.emit("login", { userId: "2" });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ userId: "1" });
    expect(emitter.listenerCount("login")).toBe(0);
  });

  it("can be cancelled before it fires", () => {
    const emitter = makeEmitter();
    const listener = vi.fn();

    const cancel = emitter.once("login", listener);
    cancel();
    emitter.emit("login", { userId: "1" });

    expect(listener).not.toHaveBeenCalled();
  });

  it("coexists with ordinary listeners", () => {
    const emitter = makeEmitter();
    const always = vi.fn();
    const onlyOnce = vi.fn();

    emitter.on("login", always);
    emitter.once("login", onlyOnce);
    emitter.emit("login", { userId: "1" });
    emitter.emit("login", { userId: "2" });

    expect(always).toHaveBeenCalledTimes(2);
    expect(onlyOnce).toHaveBeenCalledTimes(1);
  });
});

describe("listenerCount", () => {
  it("counts per event", () => {
    const emitter = makeEmitter();
    expect(emitter.listenerCount("login")).toBe(0);

    emitter.on("login", () => undefined);
    emitter.on("login", () => undefined);
    emitter.on("logout", () => undefined);

    expect(emitter.listenerCount("login")).toBe(2);
    expect(emitter.listenerCount("logout")).toBe(1);
    expect(emitter.listenerCount("error")).toBe(0);
  });
});
