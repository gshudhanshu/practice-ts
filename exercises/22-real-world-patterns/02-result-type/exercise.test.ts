import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  all,
  err,
  flatMap,
  fromThrowing,
  isErr,
  isOk,
  map,
  mapErr,
  ok,
  unwrapOr,
  type Err,
  type Ok,
  type Result,
} from "./exercise";

/* ── Fixtures ───────────────────────────────────────────────────────────── */

type ParseError =
  | { readonly kind: "empty" }
  | { readonly kind: "not-a-number"; readonly raw: string };

type RangeError_ = { readonly kind: "out-of-range"; readonly value: number };

const parseNumber = (raw: string): Result<number, ParseError> => {
  if (raw.trim() === "") return err({ kind: "empty" });
  const value = Number(raw);
  return Number.isFinite(value)
    ? ok(value)
    : err({ kind: "not-a-number", raw });
};

const inRange = (value: number): Result<number, RangeError_> =>
  value >= 0 && value <= 150 ? ok(value) : err({ kind: "out-of-range", value });

/* Built lazily. A `const` initialised with `err(...)` would be NARROWED to
   Err<string> by control-flow analysis, which changes what map() infers. */
const failing = (): Result<number, string> => err("bad");
const succeeding = (): Result<number, string> => ok(2);

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _okType = Expect<Equal<ReturnType<typeof ok<number>>, Ok<number>>>;
type _errType = Expect<Equal<ReturnType<typeof err<string>>, Err<string>>>;

declare const result: Result<number, string>;
declare const fallbackString: string;

function _compileTimeOnly(): void {
  // map keeps the error type and changes the value type.
  const mapped = map(result, (n) => n.toFixed(2));
  type _mapped = Expect<Equal<typeof mapped, Result<string, string>>>;

  // mapErr does the opposite.
  const remapped = mapErr(result, (e) => e.length);
  type _remapped = Expect<Equal<typeof remapped, Result<number, number>>>;

  // flatMap UNIONS the error types — the whole reason to prefer this shape.
  const chained = flatMap(result, (n) =>
    n > 0 ? ok(n) : err(new TypeError("negative")),
  );
  type _chained = Expect<Equal<typeof chained, Result<number, string | TypeError>>>;

  // Two domain error unions accumulate rather than collapsing to Error.
  const pipeline = flatMap(parseNumber("42"), inRange);
  type _pipeline = Expect<
    Equal<typeof pipeline, Result<number, ParseError | RangeError_>>
  >;

  // unwrapOr accepts an unrelated fallback type.
  const unwrapped = unwrapOr(result, fallbackString);
  type _unwrapped = Expect<Equal<typeof unwrapped, number | string>>;

  const orNull = unwrapOr(result, null);
  type _orNull = Expect<Equal<typeof orNull, number | null>>;

  const collected = all([parseNumber("1"), parseNumber("2")]);
  type _collected = Expect<Equal<typeof collected, Result<readonly number[], ParseError>>>;

  // The union cannot be read without discriminating.
  // @ts-expect-error — `value` does not exist on Err.
  void result.value;

  if (result.ok) {
    const value: number = result.value;
    void value;
    // @ts-expect-error — an Ok has no error.
    void result.error;
  } else {
    const error: string = result.error;
    void error;
  }

  // The predicates narrow too — which is what makes them useful in .filter().
  if (isOk(result)) {
    const value: number = result.value;
    void value;
  }
  if (isErr(result)) {
    const error: string = result.error;
    void error;
  }

  const oks: Ok<number>[] = [ok(1), ok(2), err("x")].filter(isOk);
  void oks;

  // fromThrowing hands you `unknown`, never `any`.
  const parsed = fromThrowing(
    (): unknown => JSON.parse("{}"),
    (reason) => {
      type _reason = Expect<Equal<typeof reason, unknown>>;
      return "bad json";
    },
  );
  type _parsed = Expect<Equal<typeof parsed, Result<unknown, string>>>;

  // @ts-expect-error — a Result is read-only.
  result.ok = true;
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("ok / err", () => {
  it("builds the two variants", () => {
    expect(ok(2)).toEqual({ ok: true, value: 2 });
    expect(err("bad")).toEqual({ ok: false, error: "bad" });
  });

  it("carries any value, undefined included", () => {
    expect(ok(undefined)).toEqual({ ok: true, value: undefined });
    expect(err(null)).toEqual({ ok: false, error: null });
  });
});

describe("isOk / isErr", () => {
  it("answers the question", () => {
    expect(isOk(ok(1))).toBe(true);
    expect(isOk(err("x"))).toBe(false);
    expect(isErr(err("x"))).toBe(true);
    expect(isErr(ok(1))).toBe(false);
  });

  it("works as a filter predicate", () => {
    const results: Result<number, string>[] = [ok(1), err("x"), ok(3)];
    expect(results.filter(isOk).map((entry) => entry.value)).toEqual([1, 3]);
    expect(results.filter(isErr).map((entry) => entry.error)).toEqual(["x"]);
  });
});

describe("map / mapErr", () => {
  it("maps the value", () => {
    expect(map(ok(2), (n) => n * 2)).toEqual({ ok: true, value: 4 });
  });

  it("leaves an error alone and does not call the function", () => {
    let called = false;

    const result = map(failing(), (n) => {
      called = true;
      return n * 2;
    });

    expect(result).toEqual({ ok: false, error: "bad" });
    expect(called).toBe(false);
  });

  it("maps the error", () => {
    expect(mapErr(err(404), (code) => `HTTP ${code}`)).toEqual({
      ok: false,
      error: "HTTP 404",
    });
  });

  it("leaves a value alone and does not call the function", () => {
    let called = false;

    const result = mapErr(succeeding(), (e) => {
      called = true;
      return e.length;
    });

    expect(result).toEqual({ ok: true, value: 2 });
    expect(called).toBe(false);
  });
});

describe("flatMap", () => {
  it("chains a step that can itself fail", () => {
    expect(flatMap(parseNumber("42"), inRange)).toEqual({
      ok: true,
      value: 42,
    });
  });

  it("short-circuits on the first error", () => {
    expect(flatMap(parseNumber(""), inRange)).toEqual({
      ok: false,
      error: { kind: "empty" },
    });
  });

  it("reports the second step's error", () => {
    expect(flatMap(parseNumber("999"), inRange)).toEqual({
      ok: false,
      error: { kind: "out-of-range", value: 999 },
    });
  });

  it("does not call the step when the input already failed", () => {
    let called = false;

    flatMap(failing(), (n) => {
      called = true;
      return ok(n);
    });

    expect(called).toBe(false);
  });
});

describe("unwrapOr", () => {
  it("returns the value or the fallback", () => {
    expect(unwrapOr(ok(2), 0)).toBe(2);
    expect(unwrapOr(err("x"), 0)).toBe(0);
    expect(unwrapOr(err("x"), null)).toBeNull();
  });
});

describe("fromThrowing", () => {
  it("captures a return value", () => {
    expect(fromThrowing(() => 2 + 2, String)).toEqual({ ok: true, value: 4 });
  });

  it("captures a thrown Error", () => {
    const result = fromThrowing(
      (): unknown => JSON.parse("{oops"),
      (reason) => (reason instanceof Error ? reason.message : "unknown"),
    );

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected a failure");
    expect(typeof result.error).toBe("string");
  });

  it("captures a thrown non-Error", () => {
    const result = fromThrowing(
      () => {
        throw "just a string";
      },
      (reason) => ({ kind: "threw" as const, reason }),
    );

    expect(result).toEqual({
      ok: false,
      error: { kind: "threw", reason: "just a string" },
    });
  });
});

describe("all", () => {
  it("collects every value in order", () => {
    expect(all([ok(1), ok(2), ok(3)])).toEqual({
      ok: true,
      value: [1, 2, 3],
    });
  });

  it("returns the first error", () => {
    expect(all([ok(1), err("first"), err("second")])).toEqual({
      ok: false,
      error: "first",
    });
  });

  it("succeeds on an empty list", () => {
    expect(all([])).toEqual({ ok: true, value: [] });
  });

  it("composes with the other combinators", () => {
    const parsed = all(["1", "2", "3"].map(parseNumber));
    const summed = map(parsed, (values) =>
      values.reduce((total, value) => total + value, 0),
    );

    expect(summed).toEqual({ ok: true, value: 6 });
    expect(unwrapOr(summed, 0)).toBe(6);

    const broken = all(["1", "nope"].map(parseNumber));
    expect(unwrapOr(map(broken, () => 1), 0)).toBe(0);
  });
});
