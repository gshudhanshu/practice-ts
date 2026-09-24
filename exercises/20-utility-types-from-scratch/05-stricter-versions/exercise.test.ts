import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  stripId,
  type Circle,
  type DistributiveOmit,
  type Level,
  type Shape,
  type Square,
  type StrictExclude,
  type StrictExtract,
  type StrictOmit,
  type User,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

/* StrictOmit — same result as Omit, stricter contract */

type _strictOmit = Expect<
  Equal<
    StrictOmit<User, "passwordHash">,
    { readonly id: string; name: string; email: string }
  >
>;

type _strictOmitMatchesStdlib = Expect<
  Equal<StrictOmit<User, "passwordHash">, Omit<User, "passwordHash">>
>;

type _strictOmitMany = Expect<
  Equal<StrictOmit<User, "passwordHash" | "email">, { readonly id: string; name: string }>
>;

// The built-in accepts the typo and returns User unchanged. Yours must not
// compile at all — see `_compileTimeOnly`.
type _looseOmitIsSilent = Expect<Equal<Omit<User, "pasword">, User>>;

/* StrictExclude / StrictExtract */

type _strictExclude = Expect<
  Equal<StrictExclude<Level, "warn">, "debug" | "info" | "error">
>;
type _strictExcludeMatchesStdlib = Expect<
  Equal<StrictExclude<Level, "warn">, Exclude<Level, "warn">>
>;
type _strictExcludeAll = Expect<Equal<StrictExclude<Level, Level>, never>>;

type _strictExtract = Expect<
  Equal<StrictExtract<Level, "warn" | "error">, "warn" | "error">
>;
type _strictExtractMatchesStdlib = Expect<
  Equal<StrictExtract<Level, "error">, Extract<Level, "error">>
>;

/* DistributiveOmit */

type _distributive = Expect<
  Equal<
    DistributiveOmit<Shape, "id">,
    { kind: "circle"; radius: number } | { kind: "square"; side: number }
  >
>;

// The built-in on the same input: one object, and the union is gone.
type _builtInCollapses = Expect<
  Equal<Omit<Shape, "id">, { kind: "circle" | "square" }>
>;

// On a single object type the two agree — the difference only shows on unions.
type _distributiveOnObject = Expect<
  Equal<DistributiveOmit<Circle, "id">, Omit<Circle, "id">>
>;

// Distribution also means a key that only exists on one member is handled
// per-member rather than being ignored.
type _distributivePartialKey = Expect<
  Equal<
    DistributiveOmit<Shape, "radius">,
    { kind: "circle"; id: string } | { kind: "square"; id: string; side: number }
  >
>;

type _stripIdReturn = Expect<
  Equal<ReturnType<typeof stripId>, DistributiveOmit<Shape, "id">>
>;

function _compileTimeOnly(): void {
  // @ts-expect-error — "pasword" is not a key of User. The built-in Omit
  // accepts this silently; that is the bug this exercise exists to kill.
  type _typo = StrictOmit<User, "pasword">;

  // @ts-expect-error — "trace" is not a member of Level.
  type _notALevel = StrictExclude<Level, "trace">;

  // @ts-expect-error — same, for Extract.
  type _notALevel2 = StrictExtract<Level, "trace">;

  // @ts-expect-error — THE COST. Selecting a union member by a partial shape is
  // the most useful thing Extract does, and the strict constraint forbids it:
  // `{ kind: "circle" }` is not assignable to Shape.
  type _partialShape = StrictExtract<Shape, { kind: "circle" }>;

  // …whereas the loose built-in handles it, which is the trade-off.
  type _looseWorks = Expect<Equal<Extract<Shape, { kind: "circle" }>, Circle>>;

  // The stripped union still narrows on its discriminant.
  const stripped = stripId({ kind: "circle", id: "c1", radius: 2 });
  if (stripped.kind === "circle") {
    const radius = stripped.radius;
    type _radius = Expect<Equal<typeof radius, number>>;
  } else {
    const side = stripped.side;
    type _side = Expect<Equal<typeof side, number>>;
  }

  // @ts-expect-error — the id really is gone from the type.
  stripped.id;
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

const circle = (): Circle => ({ kind: "circle", id: "c1", radius: 2 });
const square = (): Square => ({ kind: "square", id: "s1", side: 3 });

describe("stripId", () => {
  it("removes the id from each member", () => {
    expect(stripId(circle())).toEqual({ kind: "circle", radius: 2 });
    expect(stripId(square())).toEqual({ kind: "square", side: 3 });
  });

  it("removes the key, not just the value", () => {
    expect("id" in stripId(circle())).toBe(false);
  });

  it("does not mutate the input", () => {
    const original = circle();
    stripId(original);
    expect(original.id).toBe("c1");
  });
});
