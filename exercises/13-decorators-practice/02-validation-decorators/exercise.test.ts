import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  Registration,
  TeamRegistration,
  ValidationFailed,
  guarded,
  minLength,
  range,
  required,
  rulesFor,
  validate,
  type FieldDecorator,
  type ValidationError,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _required = Expect<
  Equal<ReturnType<typeof required>, FieldDecorator<string>>
>;
type _minLength = Expect<
  Equal<ReturnType<typeof minLength>, FieldDecorator<string>>
>;
type _range = Expect<Equal<ReturnType<typeof range>, FieldDecorator<number>>>;
type _validate = Expect<
  Equal<ReturnType<typeof validate>, ValidationError[]>
>;

function _compileTimeOnly(): void {
  const r = new Registration("Ada", 36);
  type _name = Expect<Equal<typeof r.name, string>>;
  type _age = Expect<Equal<typeof r.age, number>>;

  const submit = r.submit;
  type _submit = Expect<Equal<typeof submit, () => string>>;

  const failure = new ValidationFailed([]);
  type _errors = Expect<Equal<typeof failure.errors, readonly ValidationError[]>>;

  class _Ok {
    @minLength(2)
    @required()
    label = "";

    @range(0, 10)
    score = 0;
  }

  class _WrongFieldType {
    // @ts-expect-error — a string rule cannot guard a number field.
    @minLength(2)
    score = 0;
  }

  class _AlsoWrongFieldType {
    // @ts-expect-error — a number rule cannot guard a string field.
    @range(0, 10)
    label = "";
  }

  class _NotAFactory {
    // @ts-expect-error — `required` is a factory: it must be called.
    @required
    label = "";
  }

  class _WrongKind {
    // @ts-expect-error — a field decorator cannot decorate a method.
    @required()
    go(): void {}
  }

  // @ts-expect-error — `guarded` is a method decorator, not a class one.
  @guarded
  class _NotAClassDecorator {}
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("rule registration", () => {
  it("registers one rule per decorator, in declaration order", () => {
    const r = new Registration("Ada", 36);
    expect(rulesFor(r).map((rule) => rule.field)).toEqual([
      "name",
      "name",
      "age",
    ]);
  });

  it("registers rules per instance, not per class", () => {
    const a = new Registration("Ada", 36);
    const b = new Registration("Bo", 40);
    expect(rulesFor(a)).toHaveLength(3);
    expect(rulesFor(b)).toHaveLength(3);
    expect(rulesFor(a)[0]).not.toBe(rulesFor(b)[0]);
  });

  it("reports nothing for an object that was never decorated", () => {
    expect(rulesFor({})).toEqual([]);
    expect(validate({})).toEqual([]);
  });
});

describe("required", () => {
  it("rejects blank and whitespace-only", () => {
    expect(validate(new Registration("", 36))).toContainEqual({
      field: "name",
      message: "is required",
    });
    expect(validate(new Registration("   ", 36))).toContainEqual({
      field: "name",
      message: "is required",
    });
  });

  it("accepts real content", () => {
    expect(validate(new Registration("Ada", 36))).toEqual([]);
  });
});

describe("minLength", () => {
  it("measures after trimming", () => {
    expect(validate(new Registration(" A ", 36))).toEqual([
      { field: "name", message: "must be at least 2 characters" },
    ]);
  });
});

describe("range", () => {
  it("is inclusive at both ends", () => {
    expect(validate(new Registration("Ada", 18))).toEqual([]);
    expect(validate(new Registration("Ada", 120))).toEqual([]);
  });

  it("rejects outside the range", () => {
    expect(validate(new Registration("Ada", 5))).toEqual([
      { field: "age", message: "must be between 18 and 120" },
    ]);
  });
});

describe("validate", () => {
  it("collects every failure, in registration order", () => {
    expect(validate(new Registration("", 5))).toEqual([
      { field: "name", message: "is required" },
      { field: "name", message: "must be at least 2 characters" },
      { field: "age", message: "must be between 18 and 120" },
    ]);
  });

  it("reads the value at validation time, not at construction time", () => {
    const r = new Registration("Ada", 36);
    expect(validate(r)).toEqual([]);

    r.name = "";
    expect(validate(r)).toEqual([
      { field: "name", message: "is required" },
      { field: "name", message: "must be at least 2 characters" },
    ]);

    r.name = "Grace";
    expect(validate(r)).toEqual([]);
  });

  it("applies base-class rules to a subclass, base fields first", () => {
    const t = new TeamRegistration("", 5, "x");
    expect(validate(t)).toEqual([
      { field: "name", message: "is required" },
      { field: "name", message: "must be at least 2 characters" },
      { field: "age", message: "must be between 18 and 120" },
      { field: "team", message: "must be at least 3 characters" },
    ]);
  });

  it("passes a valid subclass instance", () => {
    expect(validate(new TeamRegistration("Ada", 36, "core"))).toEqual([]);
  });
});

describe("guarded", () => {
  it("runs the method when the object is valid", () => {
    expect(new Registration("Ada", 36).submit()).toBe("registered Ada");
  });

  it("throws ValidationFailed when it is not", () => {
    const r = new Registration("", 5);
    expect(() => r.submit()).toThrow(ValidationFailed);
  });

  it("carries every error on the thrown object", () => {
    const r = new Registration("", 5);
    try {
      r.submit();
      expect.unreachable("submit should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationFailed);
      if (error instanceof ValidationFailed) {
        expect(error.errors).toEqual([
          { field: "name", message: "is required" },
          { field: "name", message: "must be at least 2 characters" },
          { field: "age", message: "must be between 18 and 120" },
        ]);
        expect(error.message).toBe("3 validation error(s)");
      }
    }
  });

  it("re-checks on every call", () => {
    const r = new Registration("Ada", 36);
    expect(r.submit()).toBe("registered Ada");
    r.age = 4;
    expect(() => r.submit()).toThrow(ValidationFailed);
  });
});
