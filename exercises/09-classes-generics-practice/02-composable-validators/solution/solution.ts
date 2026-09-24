/**
 * Solution — 09/02 Composable validators
 */

export type Validator<T> = (value: T) => string | null;

export type ValidationError = {
  field: string;
  message: string;
};

export type FieldRule<T> = {
  field: string;
  check: (subject: T) => string | null;
};

// Each of these is a FACTORY returning a validator — that is what lets them
// carry configuration (a message, a length, a range) while all sharing the
// single `Validator<T>` shape that `combine` can work with.
export function required(message?: string): Validator<string> {
  return (value) => (value.trim() === "" ? (message ?? "is required") : null);
}

export function minLength(length: number): Validator<string> {
  return (value) =>
    value.trim().length < length
      ? `must be at least ${length} characters`
      : null;
}

export function inRange(min: number, max: number): Validator<number> {
  return (value) =>
    value < min || value > max ? `must be between ${min} and ${max}` : null;
}

export function combine<T>(
  ...validators: readonly Validator<T>[]
): Validator<T> {
  return (value) => {
    for (const validate of validators) {
      const error = validate(value);
      // First failure wins: report the most fundamental problem, not all of
      // them. "is required" is more useful than "is required, and too short".
      if (error !== null) return error;
    }
    return null;
  };
}

/**
 * Curried generics.
 *
 * TypeScript has no PARTIAL type-argument inference — you cannot write
 * `rule<User>("name", …)` and let `K` infer, because supplying one type
 * argument means supplying them all.
 *
 * Splitting into two calls fixes `T` in the first and infers `K` in the
 * second, which is what makes the field name and the validator check against
 * each other.
 */
export function rulesFor<T>() {
  return function rule<K extends keyof T & string>(
    field: K,
    validator: Validator<T[K]>,
  ): FieldRule<T> {
    return {
      field,
      // The closure captures both `field` and `validator`, so `K` is erased
      // from the result type — every rule is just a FieldRule<T>, and a list
      // of them can hold rules for differently-typed fields.
      check: (subject) => validator(subject[field]),
    };
  };
}

export function validateAll<T>(
  subject: T,
  rules: readonly FieldRule<T>[],
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const rule of rules) {
    const message = rule.check(subject);
    if (message !== null) {
      errors.push({ field: rule.field, message });
    }
  }

  return errors;
}
