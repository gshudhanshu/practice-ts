import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  notify,
  type Account,
  type Contact,
  type Merge,
  type OptionalKeys,
  type PickByValue,
  type RequireAtLeastOne,
  type RequiredKeys,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _optional = Expect<Equal<OptionalKeys<Account>, "nickname" | "bio">>;
type _required = Expect<
  Equal<RequiredKeys<Account>, "id" | "name" | "age" | "active">
>;
type _noOptional = Expect<Equal<OptionalKeys<{ a: string }>, never>>;
type _allOptional = Expect<Equal<RequiredKeys<{ a?: string }>, never>>;
// An explicit `| undefined` is NOT the same as optional.
type _explicitUndefined = Expect<
  Equal<OptionalKeys<{ a: string | undefined }>, never>
>;
type _optionalAndUndefined = Expect<
  Equal<OptionalKeys<{ a?: string; b: number }>, "a">
>;

type _byString = Expect<
  Equal<PickByValue<Account, string>, { id: string; name: string }>
>;
type _byNumber = Expect<Equal<PickByValue<Account, number>, { age: number }>>;
type _byBoolean = Expect<
  Equal<PickByValue<Account, boolean>, { active: boolean }>
>;
type _byFunction = Expect<
  Equal<
    PickByValue<{ a: string; run: () => void }, () => void>,
    { run: () => void }
  >
>;
type _byNothing = Expect<Equal<PickByValue<Account, symbol>, {}>>;

type _merge = Expect<
  Equal<
    Merge<{ a: string; b: number }, { b: boolean; c: string }>,
    { a: string; b: boolean; c: string }
  >
>;
type _mergeEmpty = Expect<Equal<Merge<{}, { a: 1 }>, { a: 1 }>>;
type _mergeDisjoint = Expect<
  Equal<Merge<{ a: 1 }, { b: 2 }>, { a: 1; b: 2 }>
>;
// Honest limitation: this Merge is not modifier-preserving — an optional
// property in A comes back required, with `undefined` in its type.
type _mergeOptional = Expect<
  Equal<Merge<{ a?: string }, { b: number }>, { a: string | undefined; b: number }>
>;

type Reachable = RequireAtLeastOne<Contact, "email" | "phone">;
type EitherFlag = RequireAtLeastOne<{ a?: 1; b?: 2 }>;

function _compileTimeOnly(): void {
  const withEmail: Reachable = { name: "Ada", email: "ada@example.com" };
  const withPhone: Reachable = { name: "Ada", phone: "555" };
  const withBoth: Reachable = {
    name: "Ada",
    email: "ada@example.com",
    phone: "555",
  };
  void withEmail;
  void withPhone;
  void withBoth;

  // @ts-expect-error — neither email nor phone is present.
  const unreachable: Reachable = { name: "Ada" };
  void unreachable;

  // @ts-expect-error — `name` is still required; K only affects email/phone.
  const nameless: Reachable = { email: "ada@example.com" };
  void nameless;

  const a: EitherFlag = { a: 1 };
  const b: EitherFlag = { b: 2 };
  void a;
  void b;

  // @ts-expect-error — K defaults to every key, so one of them is required.
  const neither: EitherFlag = {};
  void neither;

  // `notify` must be typed with the same constraint.
  notify({ name: "Ada", email: "ada@example.com" });
  notify({ name: "Ada", phone: "555" });

  // @ts-expect-error — an unreachable contact must not compile.
  notify({ name: "Ada" });

  type _param = Expect<Equal<Parameters<typeof notify>[0], Reachable>>;
  type _returns = Expect<Equal<ReturnType<typeof notify>, string>>;
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("notify", () => {
  it("uses the email when there is one", () => {
    expect(notify({ name: "Ada", email: "ada@example.com" })).toBe(
      "ada@example.com",
    );
  });

  it("falls back to the phone number", () => {
    expect(notify({ name: "Ada", phone: "555" })).toBe("555");
  });

  it("prefers email when both are present", () => {
    expect(notify({ name: "Ada", email: "ada@example.com", phone: "555" })).toBe(
      "ada@example.com",
    );
  });
});
