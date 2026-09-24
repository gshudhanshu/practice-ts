import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  kebabCase,
  type Join,
  type KebabCase,
  type Replace,
  type ReplaceAll,
  type Split,
  type Trim,
  type TrimLeft,
  type TrimRight,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _trimBoth = Expect<Equal<Trim<"  hello  ">, "hello">>;
type _trimMixed = Expect<Equal<Trim<"\n\t hi \t">, "hi">>;
type _trimNothing = Expect<Equal<Trim<"none">, "none">>;
type _trimAll = Expect<Equal<Trim<"   ">, "">>;
type _trimEmpty = Expect<Equal<Trim<"">, "">>;
type _trimInner = Expect<Equal<Trim<"  a b  ">, "a b">>;
type _trimLeft = Expect<Equal<TrimLeft<"  a  ">, "a  ">>;
type _trimRight = Expect<Equal<TrimRight<"  a  ">, "  a">>;

type _splitThree = Expect<Equal<Split<"a,b,c", ",">, ["a", "b", "c"]>>;
type _splitOne = Expect<Equal<Split<"a", ",">, ["a"]>>;
type _splitEmptyParts = Expect<Equal<Split<"a,,b", ",">, ["a", "", "b"]>>;
type _splitEmpty = Expect<Equal<Split<"", ",">, [""]>>;
type _splitOther = Expect<Equal<Split<"a/b/c", "/">, ["a", "b", "c"]>>;
type _splitMulti = Expect<Equal<Split<"a::b", "::">, ["a", "b"]>>;
type _splitLength = Expect<Equal<Split<"a,b,c", ",">["length"], 3>>;

type _joinThree = Expect<Equal<Join<["a", "b", "c"], "-">, "a-b-c">>;
type _joinOne = Expect<Equal<Join<["a"], "-">, "a">>;
type _joinEmpty = Expect<Equal<Join<[], "-">, "">>;
type _joinMulti = Expect<Equal<Join<["a", "b"], " -> ">, "a -> b">>;

// Split and Join are inverses.
type _roundTrip = Expect<Equal<Join<Split<"a/b/c", "/">, "/">, "a/b/c">>;
type _reDelimit = Expect<Equal<Join<Split<"a/b/c", "/">, ".">, "a.b.c">>;

type _replaceFirst = Expect<
  Equal<Replace<"foo bar foo", "foo", "baz">, "baz bar foo">
>;
type _replaceMissing = Expect<Equal<Replace<"abc", "x", "y">, "abc">>;
type _replaceEmptyFrom = Expect<Equal<Replace<"abc", "", "y">, "abc">>;
type _replaceAll = Expect<
  Equal<ReplaceAll<"foo bar foo", "foo", "baz">, "baz bar baz">
>;
type _replaceAllDense = Expect<Equal<ReplaceAll<"aaa", "a", "b">, "bbb">>;
type _replaceAllEmptyFrom = Expect<Equal<ReplaceAll<"abc", "", "y">, "abc">>;
type _replaceAllToEmpty = Expect<Equal<ReplaceAll<"a-b-c", "-", "">, "abc">>;

type _kebabCamel = Expect<Equal<KebabCase<"backgroundColor">, "background-color">>;
type _kebabPascal = Expect<Equal<KebabCase<"FooBarBaz">, "foo-bar-baz">>;
type _kebabPlain = Expect<Equal<KebabCase<"foo">, "foo">>;
type _kebabEmpty = Expect<Equal<KebabCase<"">, "">>;
type _kebabDigits = Expect<Equal<KebabCase<"foo2Bar">, "foo2-bar">>;

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("kebabCase", () => {
  it("converts camelCase", () => {
    expect(kebabCase("backgroundColor")).toBe("background-color");
    expect(kebabCase("borderTopLeftRadius")).toBe("border-top-left-radius");
  });

  it("converts PascalCase", () => {
    expect(kebabCase("FooBarBaz")).toBe("foo-bar-baz");
  });

  it("leaves a single word alone", () => {
    expect(kebabCase("foo")).toBe("foo");
    expect(kebabCase("")).toBe("");
  });

  it("agrees with the type-level version", () => {
    const source = "backgroundColor";
    const fromTypes: KebabCase<typeof source> = "background-color";
    expect(kebabCase(source)).toBe(fromTypes);

    const pascal = "FooBarBaz";
    const pascalFromTypes: KebabCase<typeof pascal> = "foo-bar-baz";
    expect(kebabCase(pascal)).toBe(pascalFromTypes);
  });
});

describe("Split", () => {
  it("agrees with String.prototype.split", () => {
    // The kebab-cased output, split back into its words — computed both ways.
    const kebab = "background-color";
    const parts: Split<typeof kebab, "-"> = ["background", "color"];
    expect(kebabCase("backgroundColor").split("-")).toEqual(parts);

    // Splitting a string with no delimiter still yields one part, and an empty
    // string yields one empty part — which is what `Split` must model.
    const empty = "";
    const emptyFromTypes: Split<typeof empty, ","> = [""];
    expect(empty.split(",")).toEqual(emptyFromTypes);
  });
});
