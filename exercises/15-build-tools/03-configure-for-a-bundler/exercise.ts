/**
 * Exercise 15/03 — CHALLENGE: configure TypeScript for a bundler
 *
 * 03/04 was about SAFETY: which strictness flags you turn on and which bug each
 * one catches. Do that one first if you have not — this exercise does not
 * re-teach it, and deliberately says nothing about `strict`.
 *
 * This one is about the other half of a tsconfig: EMIT and RESOLUTION. In a
 * Vite/esbuild project, tsc never writes a single file — the bundler does. That
 * one fact rewrites most of the config, and the interview question behind it is
 * always some version of "who does what in your build?".
 *
 * Read README.md first. Replace every TODO.
 */

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// The compilerOptions for a Vite application: tsc is the type-checker, Vite is
// the compiler. README.md gives the exact object. Write it out rather than
// pasting it — you are meant to be able to justify every line, and
// solution/EXPLANATION.md justifies them one by one.
//
// It must be `as const`: a config object that widens its own values to `string`
// has lost the only compile-time safety it had.
export const APP_COMPILER_OPTIONS = {} as const;

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// The same project's PUBLISHED package, where tsc IS the compiler and the
// output is consumed by Node. Six of the entries flip. README.md has the spec.
export const LIBRARY_COMPILER_OPTIONS = {} as const;

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Division of labour. In an app built by a bundler, who performs each job?
export type BuildJob =
  | "type-checking"
  | "transpiling-typescript-to-javascript"
  | "emitting-declaration-files"
  | "tree-shaking-unused-exports"
  | "minifying-and-hashing-the-output"
  | "catching-an-import-of-a-name-that-does-not-exist";

export function ownerOf(job: BuildJob): "tsc" | "bundler" {
  throw new Error("TODO 3: implement ownerOf");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Why is each option in the app config? One reason each; README.md pairs them
// up if you get stuck, but try to write it from understanding first.
export type BundlerOption =
  | "target"
  | "lib"
  | "module"
  | "moduleResolution"
  | "moduleDetection"
  | "types"
  | "noEmit"
  | "isolatedModules"
  | "verbatimModuleSyntax"
  | "resolveJsonModule"
  | "skipLibCheck";

export type Reason =
  | "set-the-syntax-level-tsc-downlevels-to"
  | "declare-which-runtime-apis-exist"
  | "keep-esm-so-the-bundler-can-tree-shake"
  | "resolve-the-way-the-bundler-resolves"
  | "treat-every-file-as-a-module"
  | "stop-every-installed-types-package-entering-global-scope"
  | "the-bundler-writes-the-output-not-tsc"
  | "reject-what-a-single-file-transpiler-cannot-handle"
  | "emit-imports-exactly-as-written"
  | "type-json-imports"
  | "trade-dependency-type-conflicts-for-build-speed";

export function reasonFor(option: BundlerOption): Reason {
  throw new Error("TODO 4: implement reasonFor");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// The same knowledge, backwards — which is how it actually arrives, as a bug
// report from someone else.
export type Symptom =
  | "tsc-wrote-javascript-next-to-my-sources"
  | "an-import-with-only-side-effects-vanished-from-the-bundle"
  | "the-bundle-failed-on-a-re-exported-type"
  | "tsc-resolves-a-package-that-vite-cannot-find"
  | "globals-from-an-unrelated-types-package-are-in-scope"
  | "document-is-not-a-known-name-in-a-browser-project";

export function optionForSymptom(symptom: Symptom): BundlerOption {
  throw new Error("TODO 5: implement optionForSymptom");
}
