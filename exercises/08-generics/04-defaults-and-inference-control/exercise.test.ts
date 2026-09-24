import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  Store,
  asTuple,
  failWith,
  pickOne,
  succeed,
  type ApiResponse,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

// TODO 1: the second parameter defaults to string.
type _defaulted = Expect<
  Equal<ApiResponse<number>, ApiResponse<number, string>>
>;
type _shape = Expect<
  Equal<
    ApiResponse<number>,
    { ok: true; data: number } | { ok: false; error: string }
  >
>;
type _customError = Expect<
  Equal<
    ApiResponse<number, Error>,
    { ok: true; data: number } | { ok: false; error: Error }
  >
>;

// TODO 5: the state type defaults, so `Store` needs no argument.
type _storeDefault = Expect<
  Equal<ReturnType<Store["get"]>, Record<string, unknown>>
>;

function _compileTimeOnly(): void {
  // TODO 2
  const good = succeed(1);
  type _good = Expect<Equal<typeof good, ApiResponse<number>>>;

  const bad = failWith("nope");
  type _bad = Expect<Equal<typeof bad, ApiResponse<never, string>>>;

  const typedError = failWith(new Error("x"));
  type _typedError = Expect<Equal<typeof typedError, ApiResponse<never, Error>>>;

  // TODO 3: the literal tuple survives without `as const` at the call site.
  const tuple = asTuple(["a", "b"]);
  type _tuple = Expect<Equal<typeof tuple, readonly ["a", "b"]>>;

  const numbers = asTuple([1, 2, 3]);
  type _numbers = Expect<Equal<typeof numbers, readonly [1, 2, 3]>>;

  // TODO 4: T comes from `options` alone.
  const picked = pickOne(["a", "b"], "c");
  type _picked = Expect<Equal<typeof picked, string>>;

  // @ts-expect-error — the fallback must not widen T.
  pickOne(["a", "b"], 1);

  // TODO 5: inference still works when an argument is given.
  const store = new Store({ count: 0 });
  const state = store.get();
  type _state = Expect<Equal<typeof state, { count: number }>>;

  // @ts-expect-error — the state shape is fixed by the constructor argument.
  store.set({ count: "one" });
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("succeed / failWith", () => {
  it("builds a success", () => {
    expect(succeed(1)).toEqual({ ok: true, data: 1 });
    expect(succeed("x")).toEqual({ ok: true, data: "x" });
  });

  it("builds a failure", () => {
    expect(failWith("nope")).toEqual({ ok: false, error: "nope" });
  });

  it("keeps falsy payloads", () => {
    expect(succeed(0)).toEqual({ ok: true, data: 0 });
    expect(failWith("")).toEqual({ ok: false, error: "" });
  });
});

describe("asTuple", () => {
  it("returns the same values", () => {
    expect(asTuple(["a", "b"])).toEqual(["a", "b"]);
    expect(asTuple([])).toEqual([]);
  });
});

describe("pickOne", () => {
  it("returns the first option", () => {
    expect(pickOne(["a", "b"], "z")).toBe("a");
  });

  it("falls back for an empty list", () => {
    // A bare `[]` would infer T as `never` — with NoInfer the fallback cannot
    // rescue it, so the array's type has to come from somewhere. Annotate it,
    // or pass the type argument explicitly.
    const empty: string[] = [];
    expect(pickOne(empty, "z")).toBe("z");
    expect(pickOne<string>([], "z")).toBe("z");
  });

  it("returns a falsy first option rather than the fallback", () => {
    expect(pickOne([""], "z")).toBe("");
    expect(pickOne([0], 9)).toBe(0);
  });
});

describe("Store", () => {
  it("reads and replaces state", () => {
    const store = new Store({ count: 0 });
    expect(store.get()).toEqual({ count: 0 });

    store.set({ count: 5 });
    expect(store.get()).toEqual({ count: 5 });
  });

  it("updates from the current state", () => {
    const store = new Store({ count: 1 });
    store.update((current) => ({ count: current.count + 1 }));
    store.update((current) => ({ count: current.count + 1 }));

    expect(store.get()).toEqual({ count: 3 });
  });

  it("works with a defaulted state type", () => {
    const store: Store = new Store<Record<string, unknown>>({ any: "thing" });
    expect(store.get()).toEqual({ any: "thing" });
  });
});
