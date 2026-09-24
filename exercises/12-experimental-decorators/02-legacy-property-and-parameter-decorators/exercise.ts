/**
 * Exercise 12/02 — Legacy property and parameter decorators
 *
 * Two more legacy-only shapes, both of which look useless on their own and are
 * the foundation of every dependency-injection container you have used.
 *
 *   PROPERTY   (target, propertyKey)                  -> void
 *   PARAMETER  (target, propertyKey, parameterIndex)  -> void
 *
 * Neither returns anything useful. A property decorator gets no descriptor, so
 * it cannot read the value, intercept writes, or change the type. A parameter
 * decorator gets an index and nothing else — not the value, not the argument's
 * type, not even a name.
 *
 * All they can do is RECORD something in a side table, for a method or class
 * decorator to read later. That indirection is the whole pattern: `@required`
 * writes down which parameters matter, `@validate` reads it back at call time.
 * Angular's `@Inject`, NestJS's constructor injection and class-validator's
 * `@IsEmail` are all exactly this.
 *
 * `emitDecoratorMetadata` + `reflect-metadata` is the piece that makes the
 * side table implicit rather than hand-written — see the explanation. It is
 * deliberately NOT enabled here.
 *
 * Read README.md first. Replace every TODO.
 */

/** Human-readable labels, keyed by property name. */
export const labels = new Map<string, string>();

/** Which parameter indices are required, keyed by method name. */
export const requiredParams = new Map<string, number[]>();

/** Injection tokens per constructor, indexed by parameter position. */
export const injectionTokens = new WeakMap<object, (string | undefined)[]>();

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// A property decorator factory that files a label away under the property name.
//
//   class Profile { @label("Email address") email = "" }
//
//   labels.get("email")  ->  "Email address"
//
// Note the two arguments, and what is missing: no descriptor, so no way to see
// or change `email`'s value, and certainly no way to change its type.
export function label(
  _text: string,
): (target: object, propertyKey: string) => void {
  throw new Error("TODO 1: implement label");
}

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// A parameter decorator that records which positions must not be `undefined`.
//
//   save(@required name: string, note?: string)
//
//   requiredParams.get("save")  ->  [0]
//
// `parameterIndex` is 0-based and counts from the left. Push it onto the list
// for that method — order within the list does not matter, only membership.
export function required(
  _target: object,
  _propertyKey: string,
  _parameterIndex: number,
): void {
  throw new Error("TODO 2: implement required");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// The other half: a METHOD decorator that reads what `@required` recorded and
// enforces it at call time.
//
//   service.save(undefined)  ->  throws Error("save: argument 0 is required")
//   service.save("ada")      ->  runs normally
//
// A parameter decorator cannot enforce anything by itself — it never sees a
// call. This pairing is why property and parameter decorators exist at all.
export function validate<Args extends unknown[], Return>(
  _target: object,
  _propertyKey: string,
  _descriptor: TypedPropertyDescriptor<(...args: Args) => Return>,
): void {
  throw new Error("TODO 3: implement validate");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// A CONSTRUCTOR parameter decorator factory: record which container key fills
// each constructor parameter.
//
//   constructor(@Inject("greeting") readonly greeting: string, …)
//
//   injectionTokens.get(Greeting)  ->  ["greeting", "name"]
//
// Two things bite here.
//
//   - For a constructor parameter, `propertyKey` is `undefined`. There is no
//     member name, so the signature has to allow it.
//   - Parameter decorators are applied RIGHT TO LEFT. Store by index; a `push`
//     gives you the tokens backwards, and the tests will catch it.
export function Inject(
  _token: string,
): (
  target: object,
  propertyKey: string | symbol | undefined,
  parameterIndex: number,
) => void {
  throw new Error("TODO 4: implement Inject");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// A plain function — not a decorator — that builds an instance from the tokens
// `@Inject` recorded.
//
//   resolve(Greeting, new Map([["greeting", "hello"], ["name", "ada"]]))
//     ->  new Greeting("hello", "ada")
//
// Throw `Error("no provider for <token>")` when the container has no entry, and
// `Error("<ClassName>: parameter <i> is not injectable")` when a parameter has
// no token at all.
//
// This is the whole of a DI container, minus the bookkeeping. Writing it once
// makes NestJS stop looking like magic.
//
// Walk `ctor.length` parameters, not the recorded token list — an undecorated
// trailing parameter leaves no entry at all, and silently constructing with too
// few arguments is exactly the bug a container must not have.
//
// `Reflect.construct` is the only way to spread a runtime array into `new`.
export function resolve<T>(
  _ctor: {
    new (...args: never[]): T;
    readonly length: number;
    readonly name: string;
  },
  _container: ReadonlyMap<string, unknown>,
): T {
  throw new Error("TODO 5: implement resolve");
}

/* ── The subjects ──────────────────────────────────────────────────────────
 * Inside factories so a starter that throws during decoration cannot kill test
 * collection (CONVENTIONS rule 2), and so each test gets a fresh class.
 * ----------------------------------------------------------------------- */

export function makeProfile() {
  class Profile {
    @label("Email address")
    email = "";

    @label("Display name")
    name = "";

    /** Undecorated, to prove labelling is opt-in. */
    id = 0;
  }

  return Profile;
}

export function makeNoteService() {
  class NoteService {
    readonly saved: string[] = [];

    @validate
    save(@required name: string, note?: string): string {
      const entry = note === undefined ? name : `${name}: ${note}`;
      this.saved.push(entry);
      return entry;
    }
  }

  return NoteService;
}

export function makeGreeting() {
  class Greeting {
    constructor(
      @Inject("greeting") readonly greeting: string,
      @Inject("name") readonly name: string,
    ) {}

    say(): string {
      return `${this.greeting}, ${this.name}`;
    }
  }

  return Greeting;
}

/** Its second parameter has no `@Inject`, so `resolve` must refuse it. */
export function makePartial() {
  class Partial {
    constructor(
      @Inject("greeting") readonly greeting: string,
      readonly name: string,
    ) {}
  }

  return Partial;
}
