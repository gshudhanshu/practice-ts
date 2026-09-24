import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  fillNulls,
  type Getters,
  type Mutable,
  type Nullable,
  type PickByType,
  type User,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _nullable = Expect<
  Equal<
    Nullable<User>,
    {
      id: string | null;
      name: string | null;
      age: number | null;
      active: boolean | null;
    }
  >
>;

type _mutable = Expect<Equal<Mutable<Readonly<User>>, User>>;

// Already-mutable input is unchanged.
type _mutableIdempotent = Expect<Equal<Mutable<User>, User>>;

type _getters = Expect<
  Equal<
    Getters<User>,
    {
      getId: () => string;
      getName: () => string;
      getAge: () => number;
      getActive: () => boolean;
    }
  >
>;

type _pickStrings = Expect<
  Equal<PickByType<User, string>, { id: string; name: string }>
>;
type _pickNumbers = Expect<Equal<PickByType<User, number>, { age: number }>>;
type _pickBooleans = Expect<
  Equal<PickByType<User, boolean>, { active: boolean }>
>;
type _pickNone = Expect<Equal<PickByType<User, symbol>, {}>>;

type _fillReturn = Expect<Equal<ReturnType<typeof fillNulls>, User | null>>;

function _compileTimeOnly(): void {
  // Nullable accepts both real values and nulls.
  const draft: Nullable<User> = { id: "1", name: null, age: 30, active: null };
  void draft;

  // @ts-expect-error — undefined is not null; Nullable adds only null.
  const _wrong: Nullable<User> = { id: undefined, name: "a", age: 1, active: true };
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("fillNulls", () => {
  it("builds a User when every field is present", () => {
    expect(
      fillNulls({ id: "1", name: "Ada", age: 45, active: true }),
    ).toEqual({ id: "1", name: "Ada", age: 45, active: true });
  });

  it("returns null when any field is missing", () => {
    expect(fillNulls({ id: null, name: "Ada", age: 45, active: true })).toBeNull();
    expect(fillNulls({ id: "1", name: null, age: 45, active: true })).toBeNull();
    expect(fillNulls({ id: "1", name: "Ada", age: null, active: true })).toBeNull();
    expect(fillNulls({ id: "1", name: "Ada", age: 45, active: null })).toBeNull();
  });

  it("keeps falsy-but-present values", () => {
    expect(fillNulls({ id: "", name: "", age: 0, active: false })).toEqual({
      id: "",
      name: "",
      age: 0,
      active: false,
    });
  });
});
