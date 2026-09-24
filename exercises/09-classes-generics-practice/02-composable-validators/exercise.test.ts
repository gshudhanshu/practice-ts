import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  combine,
  inRange,
  minLength,
  required,
  rulesFor,
  validateAll,
  type FieldRule,
  type Validator,
} from "./exercise";

/* ── Fixtures ───────────────────────────────────────────────────────────── */

type User = {
  name: string;
  email: string;
  age: number;
};

const valid: User = { name: "Ada", email: "ada@x.com", age: 45 };

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _required = Expect<Equal<ReturnType<typeof required>, Validator<string>>>;
type _inRange = Expect<Equal<ReturnType<typeof inRange>, Validator<number>>>;

function _compileTimeOnly(): void {
  const userRule = rulesFor<User>();

  const nameRule = userRule("name", required());
  type _nameRule = Expect<Equal<typeof nameRule, FieldRule<User>>>;

  userRule("age", inRange(0, 150));
  userRule("email", combine(required(), minLength(3)));

  // @ts-expect-error — `age` is a number, so a string validator is wrong.
  userRule("age", required());

  // @ts-expect-error — `name` is a string, so a number validator is wrong.
  userRule("name", inRange(0, 10));

  // @ts-expect-error — no such field on User.
  userRule("nope", required());

  // combine keeps the validator's type.
  const combined = combine(required(), minLength(2));
  type _combined = Expect<Equal<typeof combined, Validator<string>>>;

  // @ts-expect-error — cannot combine validators of different types.
  combine(required(), inRange(0, 1));
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("required", () => {
  it("rejects blank strings", () => {
    expect(required()("")).toBe("is required");
    expect(required()("   ")).toBe("is required");
  });

  it("accepts real content", () => {
    expect(required()("a")).toBeNull();
    expect(required()("  a  ")).toBeNull();
  });

  it("honours a custom message", () => {
    expect(required("no name")("")).toBe("no name");
  });
});

describe("minLength", () => {
  it("measures after trimming", () => {
    expect(minLength(3)("ab")).toBe("must be at least 3 characters");
    expect(minLength(3)("  ab  ")).toBe("must be at least 3 characters");
    expect(minLength(3)("abc")).toBeNull();
  });

  it("accepts anything at length 0", () => {
    expect(minLength(0)("")).toBeNull();
  });
});

describe("inRange", () => {
  it("is inclusive at both ends", () => {
    expect(inRange(0, 10)(0)).toBeNull();
    expect(inRange(0, 10)(10)).toBeNull();
    expect(inRange(0, 10)(5)).toBeNull();
  });

  it("rejects outside the range", () => {
    expect(inRange(0, 150)(200)).toBe("must be between 0 and 150");
    expect(inRange(0, 150)(-1)).toBe("must be between 0 and 150");
  });
});

describe("combine", () => {
  it("returns the first error", () => {
    expect(combine(required(), minLength(5))("")).toBe("is required");
    expect(combine(required(), minLength(5))("abc")).toBe(
      "must be at least 5 characters",
    );
  });

  it("returns null when everything passes", () => {
    expect(combine(required(), minLength(2))("abc")).toBeNull();
  });

  it("passes with no validators at all", () => {
    expect(combine<string>()("anything")).toBeNull();
  });
});

describe("rulesFor / validateAll", () => {
  // Built lazily inside each test: at module/describe scope the starter's
  // `rulesFor` would throw during collection and hide every other failure.
  const userRules = (): FieldRule<User>[] => {
    const userRule = rulesFor<User>();
    return [
      userRule("name", combine(required(), minLength(2))),
      userRule("email", required()),
      userRule("age", inRange(0, 150)),
    ];
  };

  it("reports nothing for a valid subject", () => {
    expect(validateAll(valid, userRules())).toEqual([]);
  });

  it("reports the failing field", () => {
    expect(validateAll({ ...valid, name: "" }, userRules())).toEqual([
      { field: "name", message: "is required" },
    ]);
  });

  it("reports several failures, in rule order", () => {
    expect(
      validateAll({ name: "", email: "", age: 999 }, userRules()),
    ).toEqual([
      { field: "name", message: "is required" },
      { field: "email", message: "is required" },
      { field: "age", message: "must be between 0 and 150" },
    ]);
  });

  it("reports only the first error per field", () => {
    expect(validateAll({ ...valid, name: "A" }, userRules())).toEqual([
      { field: "name", message: "must be at least 2 characters" },
    ]);
  });

  it("passes with no rules", () => {
    expect(validateAll(valid, [])).toEqual([]);
  });
});
