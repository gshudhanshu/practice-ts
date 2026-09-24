import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  compact,
  type Circle,
  type HasMembers,
  type Level,
  type MaybeTag,
  type MyExclude,
  type MyExtract,
  type MyNonNullable,
  type NaiveIsNever,
  type Shape,
  type Square,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

/* MyExclude — distribution doing the work */

type _excludeOne = Expect<
  Equal<MyExclude<Level, "debug">, "info" | "warn" | "error">
>;
type _excludeMany = Expect<
  Equal<MyExclude<Level, "debug" | "info">, "warn" | "error">
>;
type _excludeMatchesStdlib = Expect<
  Equal<MyExclude<Level, "error">, Exclude<Level, "error">>
>;

// Assignability, not identity: every string literal is assignable to `string`.
type _excludeByWidening = Expect<Equal<MyExclude<"a" | "b" | 1, string>, 1>>;

// `boolean` is `true | false` internally, so it distributes too.
type _excludeBoolean = Expect<
  Equal<MyExclude<string | number | boolean, boolean>, string | number>
>;

// Filtering everything out leaves the empty union.
type _excludeAll = Expect<Equal<MyExclude<Level, Level>, never>>;

// …and distributing over the empty union runs nothing at all.
type _excludeFromNever = Expect<Equal<MyExclude<never, string>, never>>;

/* MyExtract */

type _extract = Expect<
  Equal<MyExtract<Level, "debug" | "warn">, "debug" | "warn">
>;
type _extractMatchesStdlib = Expect<
  Equal<MyExtract<Level, "warn">, Extract<Level, "warn">>
>;

// A partial shape is enough to select a union member.
type _extractShape = Expect<Equal<MyExtract<Shape, { kind: "circle" }>, Circle>>;
type _extractShapes = Expect<Equal<MyExtract<Shape, { kind: string }>, Shape>>;

// Loose, exactly like the standard library: a member that is not in T is
// accepted in silence and simply matches nothing. 20/05 fixes this.
type _extractNonMember = Expect<Equal<MyExtract<Level, "trace">, never>>;

/* MyNonNullable */

type _nonNullable = Expect<
  Equal<MyNonNullable<string | null | undefined>, string>
>;
type _nonNullableUnion = Expect<
  Equal<MyNonNullable<Circle | Square | null>, Shape>
>;
type _nonNullableMatchesStdlib = Expect<
  Equal<MyNonNullable<number | undefined>, NonNullable<number | undefined>>
>;
type _nonNullableNoop = Expect<Equal<MyNonNullable<string>, string>>;

/* HasMembers, and the specimen it fixes */

type _naiveGivesNever = Expect<Equal<NaiveIsNever<never>, never>>;
type _naiveOnUnion = Expect<Equal<NaiveIsNever<string>, false>>;

type _hasMembersNever = Expect<Equal<HasMembers<never>, false>>;
type _hasMembersEmptied = Expect<Equal<HasMembers<MyExclude<"a", "a">>, false>>;
type _hasMembersUnion = Expect<Equal<HasMembers<"a" | "b">, true>>;
type _hasMembersSingle = Expect<Equal<HasMembers<Shape>, true>>;

/* compact */

type _compactReturn = Expect<Equal<ReturnType<typeof compact>, string[]>>;

function _compileTimeOnly(): void {
  const tags: MaybeTag[] = ["a", null, undefined];
  const cleaned = compact(tags);
  type _cleaned = Expect<Equal<typeof cleaned, string[]>>;

  // @ts-expect-error — the element type is `string`: null is no longer a member.
  cleaned.push(null);
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("compact", () => {
  it("removes null and undefined", () => {
    expect(compact(["a", null, "b", undefined])).toEqual(["a", "b"]);
  });

  it("keeps the empty string — it is a value, not a hole", () => {
    expect(compact(["", null, "b"])).toEqual(["", "b"]);
  });

  it("returns a new array and leaves the input alone", () => {
    const input: MaybeTag[] = ["a", null];
    const output = compact(input);
    expect(output).not.toBe(input);
    expect(input).toEqual(["a", null]);
  });

  it("handles an array with nothing to keep", () => {
    expect(compact([null, undefined])).toEqual([]);
  });
});
