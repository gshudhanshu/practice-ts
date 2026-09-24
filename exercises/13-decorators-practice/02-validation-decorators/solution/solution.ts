/**
 * Solution — 13/02 Validation decorators
 */

export type ValidationError = {
  field: string;
  message: string;
};

export type FieldRule = {
  field: string;
  check: () => string | null;
};

export type FieldDecorator<Value> = <This extends object>(
  target: undefined,
  context: ClassFieldDecoratorContext<This, Value>,
) => void;

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

export function required(message?: string): FieldDecorator<string> {
  return function <This extends object>(
    _target: undefined,
    context: ClassFieldDecoratorContext<This, string>,
  ): void {
    const field = String(context.name);

    // `addInitializer` on a FIELD decorator runs once per instance, right after
    // that field is initialised, with `this` bound to the instance.
    context.addInitializer(function (this: This) {
      addRule(this, {
        field,
        // The read happens inside `check`, so `validate` always sees the
        // CURRENT value — mutate the object afterwards and validation follows.
        // `context.access.get` is typed `(object: This) => string`, so no cast.
        check: () =>
          context.access.get(this).trim() === ""
            ? (message ?? "is required")
            : null,
      });
    });
  };
}

export function minLength(length: number): FieldDecorator<string> {
  return function <This extends object>(
    _target: undefined,
    context: ClassFieldDecoratorContext<This, string>,
  ): void {
    const field = String(context.name);

    context.addInitializer(function (this: This) {
      addRule(this, {
        field,
        check: () =>
          context.access.get(this).trim().length < length
            ? `must be at least ${length} characters`
            : null,
      });
    });
  };
}

export function range(min: number, max: number): FieldDecorator<number> {
  return function <This extends object>(
    _target: undefined,
    context: ClassFieldDecoratorContext<This, number>,
  ): void {
    const field = String(context.name);

    context.addInitializer(function (this: This) {
      const value = (): number => context.access.get(this);
      addRule(this, {
        field,
        check: () =>
          value() < min || value() > max
            ? `must be between ${min} and ${max}`
            : null,
      });
    });
  };
}

export function validate(subject: object): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const rule of rulesFor(subject)) {
    const message = rule.check();
    if (message !== null) {
      errors.push({ field: rule.field, message });
    }
  }

  return errors;
}

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
  void context;

  return function (this: This, ...args: Args): Return {
    // `this` is the instance, which is exactly the key the rules were filed
    // under — so the method decorator needs to know nothing about the fields.
    const errors = validate(this);
    if (errors.length > 0) {
      throw new ValidationFailed(errors);
    }
    return target.call(this, ...args);
  };
}

export class Registration {
  // Applied bottom-up: `required()` registers first, so it also reports first.
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

export class TeamRegistration extends Registration {
  @minLength(3)
  team: string;

  constructor(name: string, age: number, team: string) {
    super(name, age);
    this.team = team;
  }
}
