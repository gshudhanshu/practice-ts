import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  Inject,
  injectionTokens,
  label,
  labels,
  makeGreeting,
  makeNoteService,
  makePartial,
  makeProfile,
  required,
  requiredParams,
  resolve,
  validate,
} from "./exercise";

/* ── Fixtures ───────────────────────────────────────────────────────────── */

function reset(): void {
  labels.clear();
  requiredParams.clear();
}

const container = new Map<string, unknown>([
  ["greeting", "hello"],
  ["name", "ada"],
]);

/* ── Compile-time spec ──────────────────────────────────────────────────── */

// A property decorator takes two arguments and returns nothing.
type Label = ReturnType<typeof label>;
type _labelArgs = Expect<Equal<Parameters<Label>, [object, string]>>;
type _labelReturn = Expect<Equal<ReturnType<Label>, void>>;

// A parameter decorator takes three, the third being the index.
type _requiredArgs = Expect<
  Equal<Parameters<typeof required>, [object, string, number]>
>;
type _requiredReturn = Expect<Equal<ReturnType<typeof required>, void>>;

// A constructor parameter decorator must accept an undefined property key.
type InjectDec = ReturnType<typeof Inject>;
type _injectKey = Expect<
  Equal<Parameters<InjectDec>[1], string | symbol | undefined>
>;

// Decorating changes nothing about the declared types.
type Profile = InstanceType<ReturnType<typeof makeProfile>>;
type _email = Expect<Equal<Profile["email"], string>>;
type _id = Expect<Equal<Profile["id"], number>>;

type Greeting = InstanceType<ReturnType<typeof makeGreeting>>;
type _greeting = Expect<Equal<Greeting["greeting"], string>>;

type NoteService = InstanceType<ReturnType<typeof makeNoteService>>;
type _save = Expect<
  Equal<NoteService["save"], (name: string, note?: string) => string>
>;

function _compileTimeOnly(): void {
  // `resolve` returns the instance type of whatever class it was given.
  const Greeting = makeGreeting();
  const built = resolve(Greeting, container);
  type _built = Expect<Equal<typeof built, InstanceType<typeof Greeting>>>;

  // @ts-expect-error — a class decorator is called with one argument, so a
  // property decorator's `(target, propertyKey)` shape does not fit.
  @label("nope")
  class Wrong {}
  void Wrong;

  class LooselyChecked {
    // Legal, and a genuine weakness of the legacy design: a decorator that
    // takes fewer arguments fits any position that supplies at least that many,
    // so a PROPERTY decorator silently applies to a METHOD.
    @label("surprising")
    method(): void {}
  }
  void LooselyChecked;

  class AlsoWrong {
    // @ts-expect-error — `validate` is a method decorator; a property is not a method.
    @validate
    name = "nope";
  }
  void AlsoWrong;
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("label", () => {
  it("records a label per decorated property", () => {
    reset();
    makeProfile();

    expect(labels.get("email")).toBe("Email address");
    expect(labels.get("name")).toBe("Display name");
  });

  it("ignores undecorated properties", () => {
    reset();
    makeProfile();

    expect(labels.has("id")).toBe(false);
  });

  it("leaves the properties themselves untouched", () => {
    reset();
    const Profile = makeProfile();
    const profile = new Profile();
    profile.email = "ada@example.com";

    expect(profile.email).toBe("ada@example.com");
    expect(profile.id).toBe(0);
  });
});

describe("required", () => {
  it("records the decorated parameter's index", () => {
    reset();
    makeNoteService();

    expect(requiredParams.get("save")).toEqual([0]);
  });
});

describe("validate", () => {
  it("lets a valid call through", () => {
    reset();
    const NoteService = makeNoteService();
    const service = new NoteService();

    expect(service.save("ada")).toBe("ada");
    expect(service.save("ada", "hi")).toBe("ada: hi");
    expect(service.saved).toEqual(["ada", "ada: hi"]);
  });

  it("rejects a missing required argument", () => {
    reset();
    const NoteService = makeNoteService();
    const service = new NoteService();

    // Reflect.apply, so the missing argument does not need a cast to be typed.
    expect(() => Reflect.apply(service.save, service, [undefined])).toThrow(
      "save: argument 0 is required",
    );
    expect(service.saved).toEqual([]);
  });

  it("does not mind a missing optional argument", () => {
    reset();
    const NoteService = makeNoteService();

    expect(new NoteService().save("ada", undefined)).toBe("ada");
  });
});

describe("Inject", () => {
  it("records one token per constructor parameter, in order", () => {
    reset();
    const Greeting = makeGreeting();

    expect(injectionTokens.get(Greeting)).toEqual(["greeting", "name"]);
  });

  it("leaves the class constructable by hand", () => {
    reset();
    const Greeting = makeGreeting();

    expect(new Greeting("hi", "bob").say()).toBe("hi, bob");
  });
});

describe("resolve", () => {
  it("builds an instance from the container", () => {
    reset();
    const Greeting = makeGreeting();
    const built = resolve(Greeting, container);

    expect(built).toBeInstanceOf(Greeting);
    expect(built.say()).toBe("hello, ada");
  });

  it("passes arguments in the right order", () => {
    reset();
    const Greeting = makeGreeting();
    const built = resolve(Greeting, container);

    expect(built.greeting).toBe("hello");
    expect(built.name).toBe("ada");
  });

  it("refuses a token the container does not have", () => {
    reset();
    const Greeting = makeGreeting();

    expect(() => resolve(Greeting, new Map([["greeting", "hi"]]))).toThrow(
      "no provider for name",
    );
  });

  it("refuses a parameter with no token at all", () => {
    reset();
    const Partial = makePartial();

    expect(() => resolve(Partial, container)).toThrow(
      "parameter 1 is not injectable",
    );
  });
});
