import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  toPublicUser,
  type MyOmit,
  type MyPartialBy,
  type MyPick,
  type MyRecord,
  type PublicUser,
  type Role,
  type User,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

/* MyPick */

type _pick = Expect<
  Equal<MyPick<User, "id" | "name">, { readonly id: string; name: string }>
>;

// Modifiers survive: `Pick` is homomorphic because `K extends keyof T`.
type _pickKeepsOptional = Expect<
  Equal<MyPick<User, "lastLogin">, { lastLogin?: Date }>
>;

type _pickMatchesStdlib = Expect<
  Equal<MyPick<User, "email" | "name">, Pick<User, "email" | "name">>
>;

// It maps over K, so the result has exactly the keys you asked for.
type _pickKeys = Expect<Equal<keyof MyPick<User, "id" | "email">, "id" | "email">>;

/* MyOmit */

type _omit = Expect<
  Equal<
    MyOmit<User, "passwordHash">,
    {
      readonly id: string;
      name: string;
      email: string;
      lastLogin?: Date;
    }
  >
>;

type _omitMatchesStdlib = Expect<
  Equal<MyOmit<User, "passwordHash" | "email">, Omit<User, "passwordHash" | "email">>
>;

// The loose constraint the standard library chose: a key that does not exist is
// accepted in silence and removes nothing. 20/05 is about fixing this.
type _omitTypoIsSilent = Expect<Equal<MyOmit<User, "pasword">, User>>;

/* MyRecord */

type _record = Expect<
  Equal<MyRecord<Role, number>, { admin: number; editor: number; viewer: number }>
>;

type _recordMatchesStdlib = Expect<
  Equal<MyRecord<Role, User[]>, Record<Role, User[]>>
>;

// A non-literal key type produces an index signature, not named keys.
type _recordIndexSignature = Expect<
  Equal<MyRecord<string, boolean>, { [key: string]: boolean }>
>;

/* MyPartialBy */

type _partialBy = Expect<
  Equal<
    MyPartialBy<User, "email">,
    {
      readonly id: string;
      name: string;
      email?: string;
      passwordHash: string;
      lastLogin?: Date;
    }
  >
>;

type _partialByMultiple = Expect<
  Equal<
    MyPartialBy<User, "email" | "passwordHash">,
    {
      readonly id: string;
      name: string;
      email?: string;
      passwordHash?: string;
      lastLogin?: Date;
    }
  >
>;

/* PublicUser */

type _publicUser = Expect<Equal<PublicUser, MyOmit<User, "passwordHash">>>;
type _toPublicUser = Expect<Equal<ReturnType<typeof toPublicUser>, PublicUser>>;

function _compileTimeOnly(): void {
  // @ts-expect-error — "nope" is not a key of User: Pick's constraint is strict.
  type _bad = MyPick<User, "nope">;

  // @ts-expect-error — same for MyPartialBy.
  type _bad2 = MyPartialBy<User, "nope">;

  const publicUser: PublicUser = {
    id: "u1",
    name: "Ada",
    email: "ada@example.com",
  };

  // @ts-expect-error — the secret is gone from the type, not just the value.
  publicUser.passwordHash;

  // @ts-expect-error — `readonly id` survived the Omit.
  publicUser.id = "u2";
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

const user = (): User => ({
  id: "u1",
  name: "Ada",
  email: "ada@example.com",
  passwordHash: "$2b$10$notreally",
});

describe("toPublicUser", () => {
  it("keeps the public fields", () => {
    expect(toPublicUser(user())).toEqual({
      id: "u1",
      name: "Ada",
      email: "ada@example.com",
    });
  });

  it("removes the key entirely, not just its value", () => {
    expect("passwordHash" in toPublicUser(user())).toBe(false);
  });

  it("carries optional fields through when present", () => {
    const withLogin: User = { ...user(), lastLogin: new Date(0) };
    expect(toPublicUser(withLogin).lastLogin).toEqual(new Date(0));
  });

  it("does not mutate the input", () => {
    const original = user();
    toPublicUser(original);
    expect(original.passwordHash).toBe("$2b$10$notreally");
  });
});
