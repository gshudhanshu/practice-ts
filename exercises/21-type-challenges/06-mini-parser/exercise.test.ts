import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  parseQuery,
  type ParsePair,
  type ParseQuery,
  type ParseValue,
  type Prettify,
  type QueryValue,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _prettify = Expect<
  Equal<Prettify<{ a: string } & { b: number }>, { a: string; b: number }>
>;
type _prettifyThree = Expect<
  Equal<Prettify<{ a: 1 } & { b: 2 } & { c: 3 }>, { a: 1; b: 2; c: 3 }>
>;
type _prettifyPlain = Expect<Equal<Prettify<{ a: string }>, { a: string }>>;

type _valueNumber = Expect<Equal<ParseValue<"42">, 42>>;
type _valueNegative = Expect<Equal<ParseValue<"-3">, -3>>;
type _valueDecimal = Expect<Equal<ParseValue<"1.5">, 1.5>>;
type _valueTrue = Expect<Equal<ParseValue<"true">, true>>;
type _valueFalse = Expect<Equal<ParseValue<"false">, false>>;
type _valueString = Expect<Equal<ParseValue<"asc">, "asc">>;
type _valueEmpty = Expect<Equal<ParseValue<"">, "">>;
// A non-canonical numeric literal widens to `number` rather than failing —
// see the explanation.
type _valuePadded = Expect<Equal<ParseValue<"007">, number>>;

type _pairNumber = Expect<Equal<ParsePair<"a=1">, { a: 1 }>>;
type _pairString = Expect<Equal<ParsePair<"sort=asc">, { sort: "asc" }>>;
type _pairFlag = Expect<Equal<ParsePair<"debug">, { debug: true }>>;
type _pairEmpty = Expect<Equal<ParsePair<"">, {}>>;
type _pairEmptyValue = Expect<Equal<ParsePair<"q=">, { q: "" }>>;

type _queryTwo = Expect<Equal<ParseQuery<"a=1&b=2">, { a: 1; b: 2 }>>;
type _queryMixed = Expect<
  Equal<
    ParseQuery<"page=2&sort=asc&debug">,
    { page: 2; sort: "asc"; debug: true }
  >
>;
type _querySingle = Expect<Equal<ParseQuery<"q=typescript">, { q: "typescript" }>>;
type _queryEmpty = Expect<Equal<ParseQuery<"">, {}>>;
type _queryLong = Expect<
  Equal<
    ParseQuery<"a=1&b=two&c=true&d=false&e">,
    { a: 1; b: "two"; c: true; d: false; e: true }
  >
>;
// A non-literal input cannot be parsed, so the type degrades honestly.
type _queryWide = Expect<Equal<ParseQuery<string>, Record<string, QueryValue>>>;

function _compileTimeOnly(): void {
  const parsed = parseQuery("page=2&sort=asc&debug");
  type _parsed = Expect<
    Equal<typeof parsed, { page: 2; sort: "asc"; debug: true }>
  >;

  // The parsed properties are usable at their narrow types.
  const page: 2 = parsed.page;
  const sort: "asc" = parsed.sort;
  const debug: true = parsed.debug;
  void page;
  void sort;
  void debug;

  // @ts-expect-error — `page` is the literal 2, not any number.
  const wrong: 3 = parsed.page;
  void wrong;

  // @ts-expect-error — a key that was not in the query does not exist.
  const missing = parsed.nope;
  void missing;

  const empty = parseQuery("");
  type _empty = Expect<Equal<typeof empty, {}>>;

  // A runtime string carries no literal type, so the result is the wide record.
  const dynamic: string = "a=1";
  const loose = parseQuery(dynamic);
  type _loose = Expect<Equal<typeof loose, Record<string, QueryValue>>>;
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("parseQuery", () => {
  it("parses key=value pairs", () => {
    expect(parseQuery("a=1&b=2")).toEqual({ a: 1, b: 2 });
    expect(parseQuery("q=typescript")).toEqual({ q: "typescript" });
  });

  it("coerces numbers and booleans", () => {
    expect(parseQuery("page=2&sort=asc&ok=true&off=false")).toEqual({
      page: 2,
      sort: "asc",
      ok: true,
      off: false,
    });
  });

  it("treats a bare key as a flag", () => {
    expect(parseQuery("debug")).toEqual({ debug: true });
    expect(parseQuery("a=1&debug")).toEqual({ a: 1, debug: true });
  });

  it("returns an empty object for an empty string", () => {
    expect(parseQuery("")).toEqual({});
  });

  it("keeps an empty value as an empty string", () => {
    expect(parseQuery("q=")).toEqual({ q: "" });
  });

  it("agrees with the type-level version", () => {
    const search = "page=2&sort=asc&debug";
    const fromTypes: ParseQuery<typeof search> = {
      page: 2,
      sort: "asc",
      debug: true,
    };
    expect(parseQuery(search)).toEqual(fromTypes);
  });
});
