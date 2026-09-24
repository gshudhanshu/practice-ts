/**
 * Exercise 13/02 — Validation decorators (decorators project, part 2 of 3)
 *
 * 13/01 decorated methods. This one decorates FIELDS, which behave differently
 * in two ways worth internalising:
 *
 *   1. A field decorator's `target` is `undefined`. There is no value yet —
 *      fields are initialised per instance, long after the class is defined.
 *   2. `context.access.get(instance)` reads that field's CURRENT value, with
 *      the right type and without a cast. It is the reason a field decorator
 *      can do anything useful at all.
 *
 * The pattern below is how every "annotation-driven" validation library works
 * (class-validator, TypeORM, NestJS pipes): decorators register rules, and one
 * ordinary function runs them.
 *
 * 09/02 built the same feature out of closures and explicit rule lists. This is
 * the same idea with the wiring moved to the declaration site — compare the
 * two when you are done.
 *
 * As in 13/01, decorators run at class-definition time, so the starter bodies
 * are no-ops rather than `throw`s.
 *
 * Read README.md first. Replace every TODO.
 */

export type ValidationError = {
  field: string;
  message: string;
};

/** One registered check. `check` reads the field's value when it is called. */
export type FieldRule = {
  field: string;
  check: () => string | null;
};

/**
 * A field decorator that may only be applied to a field of type `Value`.
 * `Value` is invariant here, so `@range(0, 10)` on a `string` field is a
 * compile error rather than a runtime surprise.
 */
export type FieldDecorator<Value> = <This extends object>(
  target: undefined,
  context: ClassFieldDecoratorContext<This, Value>,
) => void;

/* ── Given: the rule registry ───────────────────────────────────────────────
   Rules are stored per INSTANCE, keyed weakly so a discarded object takes its
   rules with it. Per-instance (rather than per-class) is what makes inheritance
   work for free: a subclass's initialisers and its base class's both run on the
   same object. */

const RULES = new WeakMap<object, FieldRule[]>();

export function addRule(subject: object, rule: FieldRule): void {
  const existing = RULES.get(subject);
  if (existing === undefined) {
    RULES.set(subject, [rule]);
  } else {
    existing.push(rule);
  }
}

export function rulesFor(subject: object): readonly FieldRule[] {
  return RULES.get(subject) ?? [];
}

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// `@required()` — a blank or whitespace-only string fails.
//
//   new Registration("", 30)  ->  [{ field: "name", message: "is required" }]
//
// Use `context.addInitializer` to register a rule on the new instance. Inside
// that callback `this` is the instance, so `context.access.get(this)` reads the
// field — and reads it AT VALIDATION TIME, not at construction time, because
// the read lives inside `check`.
//
// Default message: "is required".
export function required(message?: string): FieldDecorator<string> {
  return function <This extends object>(
    _target: undefined,
    _context: ClassFieldDecoratorContext<This, string>,
  ): void {
    // TODO 1 — replace this no-op.
    void message;
  };
}

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// `@minLength(n)` — fails when the trimmed value is shorter than `n`.
//
//   message: "must be at least 2 characters"
export function minLength(length: number): FieldDecorator<string> {
  return function <This extends object>(
    _target: undefined,
    _context: ClassFieldDecoratorContext<This, string>,
  ): void {
    // TODO 2 — replace this no-op.
    void length;
  };
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// `@range(min, max)` — inclusive at both ends, for NUMBER fields.
//
//   message: "must be between 18 and 120"
export function range(min: number, max: number): FieldDecorator<number> {
  return function <This extends object>(
    _target: undefined,
    _context: ClassFieldDecoratorContext<This, number>,
  ): void {
    // TODO 3 — replace this no-op.
    void min;
    void max;
  };
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Run every rule registered against `subject` and collect the failures.
//
//   validate(new Registration("Ada", 36))   -> []
//   validate(new Registration("", 5))       -> two errors
//
// Rules run in registration order, and every failing rule reports — including
// two failures on the same field.
export function validate(subject: object): ValidationError[] {
  throw new Error("TODO 4: implement validate");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// `@guarded` — a METHOD decorator that refuses to run an invalid object.
//
//   const r = new Registration("", 5);
//   r.submit();   // throws ValidationFailed, and `errors` carries the details
//
// Validate `this` first; throw `new ValidationFailed(errors)` when there is
// anything to report; otherwise delegate as usual.
export class ValidationFailed extends Error {
  constructor(readonly errors: readonly ValidationError[]) {
    super(`${errors.length} validation error(s)`);
    this.name = "ValidationFailed";
  }
}

export function guarded<This extends object, Args extends unknown[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<
    This,
    (this: This, ...args: Args) => Return
  >,
): (this: This, ...args: Args) => Return {
  // TODO 5 — replace this no-op.
  void context;
  return target;
}

// ─── Wiring ──────────────────────────────────────────────────────────────────
// Nothing below needs editing — the decorators are already applied. Note the
// stacking order on `name`: decorators are applied bottom-up, so the BOTTOM one
// registers its rule first and therefore reports first.

export class Registration {
  @minLength(2)
  @required()
  name: string;

  @range(18, 120)
  age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  @guarded
  submit(): string {
    return `registered ${this.name}`;
  }
}

/** A subclass adds its own rules; the base class's still apply. */
export class TeamRegistration extends Registration {
  @minLength(3)
  team: string;

  constructor(name: string, age: number, team: string) {
    super(name, age);
    this.team = team;
  }
}
