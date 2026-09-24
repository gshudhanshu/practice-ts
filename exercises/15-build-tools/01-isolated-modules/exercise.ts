/**
 * Exercise 15/01 — isolatedModules: writing code a bundler can transpile
 *
 * Vite, esbuild, swc and Babel do NOT type-check. They transpile one file at a
 * time, with no knowledge of any other file in your project. That is why they
 * are fast, and it is the single constraint that shapes every rule below.
 *
 * Ask of any line: "could a tool that has only ever seen THIS file emit correct
 * JavaScript for it?" If the answer needs type information from somewhere else,
 * the construct is unsafe. `isolatedModules: true` makes tsc reject the cases it
 * can see — and this exercise is also about the cases it cannot.
 *
 * This exercise's own tsconfig.json turns on `verbatimModuleSyntax` as well, so
 * the import rules below are enforced for real. Read README.md first, then
 * replace every TODO.
 */

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// This import does not compile: `Shape` is a type, and `verbatimModuleSyntax`
// refuses to guess. Fix it so that the emitted JavaScript imports exactly what
// is used at runtime and nothing else.
//
// Then re-export `Shape` from this module so that consumers can write
// `import type { Shape } from "./exercise"` — again, in the form a single-file
// transpiler can handle.
import { Shape, area } from "./shapes";

/** `summarise({ kind: "square", side: 3 })` -> `"square: 9.00"` */
export function summarise(shape: Shape): string {
  throw new Error("TODO 1: implement summarise");
}

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// A `const enum` cannot be inlined by a tool that only sees one file, so the
// idiom below replaces it: a frozen object of literals, plus the union derived
// FROM that object (see 02/03 — never write the values twice).
//
//   DIRECTION.up === "up"      and      Direction === "up" | "down" | "left" | "right"
//
// Fill in the object, then derive the type instead of hand-writing it.
export const DIRECTION = {} as const;

export type Direction = never;

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Diagnose a build failure: return the construct that caused it.
// README.md has the table.

/** A construct that a single-file transpiler cannot handle correctly. */
export type Construct =
  /** `export { Shape } from "./shapes"` where `Shape` is a type. */
  | "type-reexport-without-export-type"
  /** A `const enum` declared in a `.d.ts` and read from your code. */
  | "ambient-const-enum"
  /** A local `const enum` that another module imports. */
  | "const-enum"
  /** One `namespace` name declared in two files, merged by the compiler. */
  | "namespace-merged-across-files"
  /** `import fs = require("fs")` and `export = fs`. */
  | "import-equals-require";

/** What the build actually did to you. */
export type Problem =
  /** The bundle throws: `does not provide an export named 'Shape'`. */
  | "bundler-cannot-find-an-exported-name"
  /** A member of a dependency's enum reads as `undefined` after bundling. */
  | "enum-member-is-undefined-at-runtime"
  /** The enum you expected to disappear still ships an object in the bundle. */
  | "enum-object-survives-into-the-bundle"
  /** Half of a namespace's members vanished; the two halves live in two files. */
  | "half-the-namespace-members-vanished"
  /** The browser build throws `require is not defined`. */
  | "require-is-not-defined-in-the-browser";

export function diagnose(problem: Problem): Construct {
  throw new Error("TODO 3: implement diagnose");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Does the COMPILER stop you, or do you find out in production?
// Return true when tsc reports an error for the construct under this repo's
// settings (`isolatedModules` + `module: "ESNext"`), false when it compiles
// happily and only the bundle is wrong. Three are flagged; two are silent.
export function flaggedByTheCompiler(construct: Construct): boolean {
  throw new Error("TODO 4: implement flaggedByTheCompiler");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// With `verbatimModuleSyntax`, imports are emitted EXACTLY as written. For each
// form, does the emitted JavaScript still contain an import of `"m"` — i.e. is
// the module still fetched and its side effects still run?
//
// One of these five surprises nearly everybody.
export type ImportForm =
  | "import type { T } from 'm'"
  | "import { type T } from 'm'"
  | "import { value } from 'm'"
  | "import 'm'"
  | "import type * as NS from 'm'";

export function emitsAnImport(form: ImportForm): boolean {
  throw new Error("TODO 5: implement emitsAnImport");
}
