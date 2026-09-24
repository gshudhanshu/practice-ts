/**
 * Solution — 03/04 Configure a project properly
 */

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

export type Problem =
  | "index-access-crashed"
  | "spread-erased-a-default"
  | "orphaned-override"
  | "switch-fell-through"
  | "parameter-was-implicitly-any"
  | "null-dereference"
  | "catch-variable-assumed-to-be-an-error";

// The eight flags `"strict": true` turns on. `as const` keeps them literal so
// the compiler can check them against CompilerFlag.
export const STRICT_IMPLIED_FLAGS = [
  "alwaysStrict",
  "noImplicitAny",
  "noImplicitThis",
  "strictBindCallApply",
  "strictFunctionTypes",
  "strictNullChecks",
  "strictPropertyInitialization",
  "useUnknownInCatchVariables",
] as const satisfies readonly CompilerFlag[];

export function isImpliedByStrict(flag: CompilerFlag): boolean {
  // `.includes(flag)` will not compile against a readonly tuple of literals
  // (same trap as 02/03), so compare with `.some` instead.
  return STRICT_IMPLIED_FLAGS.some((implied) => implied === flag);
}

export function flagForProblem(problem: Problem): CompilerFlag {
  // A Record keyed by the union is better than a switch here: add a member to
  // Problem and this object fails to compile until you handle it — the same
  // exhaustiveness guarantee, with less ceremony.
  const diagnosis: Record<Problem, CompilerFlag> = {
    "index-access-crashed": "noUncheckedIndexedAccess",
    "spread-erased-a-default": "exactOptionalPropertyTypes",
    "orphaned-override": "noImplicitOverride",
    "switch-fell-through": "noFallthroughCasesInSwitch",
    "parameter-was-implicitly-any": "noImplicitAny",
    "null-dereference": "strictNullChecks",
    "catch-variable-assumed-to-be-an-error": "useUnknownInCatchVariables",
  };

  return diagnosis[problem];
}

export const RECOMMENDED_COMPILER_OPTIONS = {
  // Output/module: modern runtimes, bundler-style resolution.
  target: "ES2022",
  module: "ESNext",
  moduleResolution: "bundler",

  // The eight strict flags, in one line.
  strict: true,

  // The valuable checks strict does NOT include.
  noUncheckedIndexedAccess: true,
  exactOptionalPropertyTypes: true,
  noImplicitOverride: true,
  noFallthroughCasesInSwitch: true,

  // Single-file-transpile safety: required by esbuild/swc/Vite pipelines.
  verbatimModuleSyntax: true,
  isolatedModules: true,

  // Pragmatics: skip type-checking .d.ts files from node_modules, and refuse
  // to depend on the case-insensitivity of Windows/macOS filesystems.
  skipLibCheck: true,
  forceConsistentCasingInFileNames: true,
};
