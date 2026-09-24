/**
 * Exercise 03/04 — CHALLENGE: configure a project properly
 *
 * Nobody asks you to write a tsconfig in an interview. They ask which flags you
 * turn on and WHY, and they describe a bug and expect you to name the flag that
 * would have caught it. That is what this exercise drills.
 *
 * Read README.md first. Replace every TODO.
 */

/** Every flag referenced in this exercise. */
export type CompilerFlag =
  | "allowUnreachableCode"
  | "alwaysStrict"
  | "exactOptionalPropertyTypes"
  | "noFallthroughCasesInSwitch"
  | "noImplicitAny"
  | "noImplicitOverride"
  | "noImplicitThis"
  | "noPropertyAccessFromIndexSignature"
  | "noUncheckedIndexedAccess"
  | "noUnusedLocals"
  | "strictBindCallApply"
  | "strictFunctionTypes"
  | "strictNullChecks"
  | "strictPropertyInitialization"
  | "useUnknownInCatchVariables";

/** A bug that reached production. Which flag would have caught it? */
export type Problem =
  /** `const first = items[0]; first.name` threw on an empty array. */
  | "index-access-crashed"
  /** A patch object `{ retries: undefined }` wiped out the default retries. */
  | "spread-erased-a-default"
  /** A base class method was renamed; the subclass "override" silently became dead code. */
  | "orphaned-override"
  /** A `switch` case ran on into the next one because someone forgot `break`. */
  | "switch-fell-through"
  /** A function parameter had no annotation and silently became `any`. */
  | "parameter-was-implicitly-any"
  /** `user.name.toUpperCase()` threw because `name` was null. */
  | "null-dereference"
  /** Inside `catch (err)`, `err.message` was read without checking the type. */
  | "catch-variable-assumed-to-be-an-error";

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// List EXACTLY the flags that `"strict": true` turns on. There are eight.
// Order does not matter. Derive the type from the value (as in 02/03) so this
// stays a single source of truth.
export const STRICT_IMPLIED_FLAGS = [] as const;

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// Is this flag already covered by `"strict": true`?
// Knowing which useful flags are NOT in `strict` is the actual point.
export function isImpliedByStrict(flag: CompilerFlag): boolean {
  throw new Error("TODO 2: implement isImpliedByStrict");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Diagnose each bug: return the single flag that would have caught it at
// compile time. See the table in README.md if you need the mapping spelled out.
export function flagForProblem(problem: Problem): CompilerFlag {
  throw new Error("TODO 3: implement flagForProblem");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// The compilerOptions you would open a new 2026 application project with.
// README.md lists the exact required entries and values.
export const RECOMMENDED_COMPILER_OPTIONS = {};
