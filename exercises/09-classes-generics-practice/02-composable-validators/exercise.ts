/**
 * Exercise 09/02 — Composable validators (practice project, part 2 of 3)
 *
 * Small validators that compose into bigger ones, all fully typed. TODO 5
 * introduces a technique worth knowing on its own: CURRIED GENERICS, the
 * standard workaround for TypeScript's lack of partial type-argument inference.
 *
 * Read README.md first. Replace every TODO.
 */

/** Returns an error message, or null when the value is acceptable. */
export type Validator<T> = (value: T) => string | null;

export type ValidationError = {
  field: string;
  message: string;
};

/** A validator bound to one field of T. The field's own type is erased here. */
export type FieldRule<T> = {
  field: string;
  check: (subject: T) => string | null;
};

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Reject blank strings (empty or whitespace-only).
//   required()("")      -> "is required"
//   required("no name")("  ")  -> "no name"
//   required()("ok")    -> null
export function required(message?: string): Validator<string> {
  throw new Error("TODO 1: implement required");
}

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// Reject strings shorter than `length`, measured AFTER trimming.
//   minLength(3)("ab")  -> "must be at least 3 characters"
export function minLength(length: number): Validator<string> {
  throw new Error("TODO 2: implement minLength");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Reject numbers outside [min, max], inclusive.
//   inRange(0, 150)(200)  -> "must be between 0 and 150"
export function inRange(min: number, max: number): Validator<number> {
  throw new Error("TODO 3: implement inRange");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Run validators left to right and return the FIRST error, or null if they all
// pass. Combining zero validators always passes.
export function combine<T>(...validators: readonly Validator<T>[]): Validator<T> {
  throw new Error("TODO 4: implement combine");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// Bind a validator to a field, with the field name checked against T and the
// validator checked against THAT field's type.
//
// TypeScript has no partial type-argument inference — you cannot write
// `rule<User>("name", …)` and let K infer. The workaround is to split it into
// two calls, so the first fixes T and the second infers K:
//
//   const userRule = rulesFor<User>();
//   userRule("name", required());     // ok
//   userRule("age", required());      // compile error — age is a number
//   userRule("nope", required());     // compile error — no such field
export function rulesFor<T>(): unknown {
  throw new Error("TODO 5: implement rulesFor");
}

// Collect every failing rule. An empty array means the subject is valid.
export function validateAll<T>(
  subject: T,
  rules: readonly FieldRule<T>[],
): ValidationError[] {
  throw new Error("TODO 5: implement validateAll");
}
