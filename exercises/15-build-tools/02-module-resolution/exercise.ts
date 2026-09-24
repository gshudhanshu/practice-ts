/**
 * Exercise 15/02 — module resolution: three modes and one algorithm
 *
 * "Cannot find module './util'" is the single most-Googled TypeScript error,
 * and the answer is always the same: `moduleResolution` decides how a specifier
 * becomes a file, and the three modes disagree about almost everything.
 *
 *   bundler   what Vite/esbuild/webpack 5 do. Extensionless imports, and
 *             `package.json` `exports` is honoured.
 *   nodenext  what Node itself does for ESM. Explicit `.js` extensions, no
 *             directory indexes, `exports` honoured and enforced.
 *   node10    the pre-2022 algorithm ("node"). Extensionless, walks
 *             node_modules, and has never heard of `exports`.
 *
 * Throughout this exercise, assume the package is ESM (`"type": "module"`).
 *
 * Read README.md first. Replace every TODO.
 */

export type ResolutionMode = "bundler" | "node10" | "nodenext";

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Given the name of a sibling SOURCE file, return the specifier you must write
// to import it under this mode.
//
//   relativeSpecifier("bundler",  "util.ts")         -> "./util"
//   relativeSpecifier("node10",   "models/order.ts") -> "./models/order"
//   relativeSpecifier("nodenext", "util.ts")         -> "./util.js"
//   relativeSpecifier("nodenext", "util.mts")        -> "./util.mjs"
//
// Yes: under `nodenext` you write the extension of a file that does not exist
// yet. TODO 3 and the EXPLANATION cover why.
export function relativeSpecifier(
  mode: ResolutionMode,
  sourceFile: string,
): string {
  throw new Error("TODO 1: implement relativeSpecifier");
}

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// The capability matrix. README.md spells out all twelve answers; the point of
// writing it down is that these four rows are what you actually have to
// remember.
export type Feature =
  /** `import "./util"` with no file extension. */
  | "extensionless-relative-imports"
  /** `import "./models"` resolving to `./models/index.ts`. */
  | "directory-index-imports"
  /** The `exports` field of a dependency's package.json is honoured. */
  | "package-json-exports"
  /** `import "#internal/db"` resolved through the `imports` field. */
  | "package-json-imports-subpaths";

export function supports(mode: ResolutionMode, feature: Feature): boolean {
  throw new Error("TODO 2: implement supports");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Diagnose the symptom. README.md has the table.
export type Symptom =
  | "tsc-cannot-find-a-sibling-module"
  | "node-cannot-find-a-module-that-tsc-resolved-happily"
  | "a-deep-import-into-a-dependency-fails-although-the-file-is-there"
  | "a-package-ships-types-but-tsc-says-it-has-no-declarations"
  | "a-default-import-of-a-commonjs-package-is-undefined-at-runtime";

export type Cause =
  | "missing-js-extension"
  | "bundler-resolution-with-a-node-runtime"
  | "exports-does-not-list-the-subpath"
  | "exports-has-no-types-condition-first"
  | "commonjs-default-interop";

export function diagnose(symptom: Symptom): Cause {
  throw new Error("TODO 3: implement diagnose");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// The algorithm itself. Implement the subset of Node's `exports` resolution
// described in README.md:
//
//   1. An exact subpath key wins.
//   2. Otherwise the `*` pattern whose prefix and suffix both match; if several
//      match, the one with the longest prefix. Substitute the matched text for
//      the `*` on the right-hand side.
//   3. A `null` target means "deliberately blocked" -> null.
//   4. Inside a conditions object, keys are tried in DECLARATION ORDER.
//      "default" always matches. First match wins.
//   5. Nothing matched -> null.
//
// Rule 4 is the one that bites: a map that lists "import" before "types" hands
// tsc a .mjs file and you get "has no exported member" on a package that
// definitely ships declarations.

/** A target: a file, a nested conditions object, or `null` for "blocked". */
export type ExportsEntry =
  | string
  | null
  | { readonly [condition: string]: ExportsEntry };

/** The `exports` field itself, keyed by subpath ("." , "./x", "./x/*"). */
export type ExportsMap = { readonly [subpath: string]: ExportsEntry };

export function resolveExports(
  map: ExportsMap,
  subpath: string,
  conditions: readonly string[],
): string | null {
  throw new Error("TODO 4: implement resolveExports");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// Which mode do you put in the tsconfig for each of these? One of them is the
// mistake people make when a project has both a bundled app and a published
// package in the same repo.
export type BuildTarget =
  /** A Vite/esbuild app; the bundler resolves everything. */
  | "vite-application"
  /** An npm package other people will `import` from Node. */
  | "published-node-library"
  /** A build still on webpack 4, which predates `exports`. */
  | "legacy-webpack-4-build"
  /** A script Node runs directly, with no bundler in sight. */
  | "script-run-by-node-directly";

export function modeFor(target: BuildTarget): ResolutionMode {
  throw new Error("TODO 5: implement modeFor");
}
