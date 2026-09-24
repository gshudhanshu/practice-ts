/**
 * Solution — 15/03 Configure TypeScript for a bundler
 */

export const APP_COMPILER_OPTIONS = {
  // Syntax level of the emit, and the baseline lib. ES2022 is what every
  // browser released since 2022 parses natively.
  target: "ES2022",
  // Which runtime APIs exist. A browser app needs DOM; a Node package must not
  // have it (see the library config below).
  lib: ["ES2022", "DOM", "DOM.Iterable"],

  // Keep ESM all the way to the bundler: `import`/`export` is what makes
  // tree-shaking possible at all.
  module: "ESNext",
  // Resolve specifiers the way Vite/esbuild does.
  moduleResolution: "bundler",
  // Every file is a module, even one that happens to have no import or export
  // yet — so it can never be treated as a global script.
  moduleDetection: "force",
  // Only the @types packages you ask for enter global scope. Without this,
  // every @types package anywhere in node_modules is loaded.
  types: [],

  // tsc is the type-checker here; Vite writes the output.
  noEmit: true,
  // Reject constructs a single-file transpiler cannot handle (15/01).
  isolatedModules: true,
  // Emit imports exactly as written; never guess whether one is type-only.
  verbatimModuleSyntax: true,

  // `import data from "./data.json"` gets a real type.
  resolveJsonModule: true,
  // Skip checking dependencies' .d.ts files: much faster, and immune to one
  // dependency shipping broken types. The cost is real conflicts going unseen.
  skipLibCheck: true,
} as const;

export const LIBRARY_COMPILER_OPTIONS = {
  target: "ES2022",
  // No DOM: a Node package that compiles against `document` is lying.
  lib: ["ES2022"],

  // Node resolves this package, so model Node exactly (15/02).
  module: "nodenext",
  moduleResolution: "nodenext",
  types: ["node"],

  // Here tsc IS the compiler.
  noEmit: false,
  // The whole point of publishing: consumers get types.
  declaration: true,
  // Lets "go to definition" land in the .ts source, not the .d.ts.
  declarationMap: true,
  sourceMap: true,
  outDir: "dist",
  rootDir: "src",

  // Still true even when tsc emits: the constructs isolatedModules bans are
  // ones consumers' bundlers would choke on.
  isolatedModules: true,
  verbatimModuleSyntax: true,
  skipLibCheck: true,
} as const;

export type BuildJob =
  | "type-checking"
  | "transpiling-typescript-to-javascript"
  | "emitting-declaration-files"
  | "tree-shaking-unused-exports"
  | "minifying-and-hashing-the-output"
  | "catching-an-import-of-a-name-that-does-not-exist";

export function ownerOf(job: BuildJob): "tsc" | "bundler" {
  // The dividing line: anything that needs to understand TYPES is tsc's;
  // anything that produces the artefact is the bundler's.
  const owners: Record<BuildJob, "tsc" | "bundler"> = {
    "type-checking": "tsc",
    "transpiling-typescript-to-javascript": "bundler",
    "emitting-declaration-files": "tsc",
    "tree-shaking-unused-exports": "bundler",
    "minifying-and-hashing-the-output": "bundler",
    "catching-an-import-of-a-name-that-does-not-exist": "tsc",
  };

  return owners[job];
}

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
  const reasons: Record<BundlerOption, Reason> = {
    target: "set-the-syntax-level-tsc-downlevels-to",
    lib: "declare-which-runtime-apis-exist",
    module: "keep-esm-so-the-bundler-can-tree-shake",
    moduleResolution: "resolve-the-way-the-bundler-resolves",
    moduleDetection: "treat-every-file-as-a-module",
    types: "stop-every-installed-types-package-entering-global-scope",
    noEmit: "the-bundler-writes-the-output-not-tsc",
    isolatedModules: "reject-what-a-single-file-transpiler-cannot-handle",
    verbatimModuleSyntax: "emit-imports-exactly-as-written",
    resolveJsonModule: "type-json-imports",
    skipLibCheck: "trade-dependency-type-conflicts-for-build-speed",
  };

  return reasons[option];
}

export type Symptom =
  | "tsc-wrote-javascript-next-to-my-sources"
  | "an-import-with-only-side-effects-vanished-from-the-bundle"
  | "the-bundle-failed-on-a-re-exported-type"
  | "tsc-resolves-a-package-that-vite-cannot-find"
  | "globals-from-an-unrelated-types-package-are-in-scope"
  | "document-is-not-a-known-name-in-a-browser-project";

export function optionForSymptom(symptom: Symptom): BundlerOption {
  const options: Record<Symptom, BundlerOption> = {
    "tsc-wrote-javascript-next-to-my-sources": "noEmit",
    "an-import-with-only-side-effects-vanished-from-the-bundle":
      "verbatimModuleSyntax",
    "the-bundle-failed-on-a-re-exported-type": "isolatedModules",
    "tsc-resolves-a-package-that-vite-cannot-find": "moduleResolution",
    "globals-from-an-unrelated-types-package-are-in-scope": "types",
    "document-is-not-a-known-name-in-a-browser-project": "lib",
  };

  return options[symptom];
}
