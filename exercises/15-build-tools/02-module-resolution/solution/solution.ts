/**
 * Solution — 15/02 Module resolution
 */

export type ResolutionMode = "bundler" | "node10" | "nodenext";

export function relativeSpecifier(
  mode: ResolutionMode,
  sourceFile: string,
): string {
  if (mode !== "nodenext") {
    // Both other modes strip a trailing extension and probe candidates.
    return `./${sourceFile.replace(/\.m?tsx?$/, "")}`;
  }

  // Node resolves the specifier literally, at runtime, against the file that
  // will exist AFTER compilation — so you write the output extension.
  const output = sourceFile
    .replace(/\.mts$/, ".mjs")
    .replace(/\.cts$/, ".cjs")
    .replace(/\.tsx?$/, ".js");

  return `./${output}`;
}

export type Feature =
  | "extensionless-relative-imports"
  | "directory-index-imports"
  | "package-json-exports"
  | "package-json-imports-subpaths";

export function supports(mode: ResolutionMode, feature: Feature): boolean {
  // A nested Record is exhaustive in both dimensions: add a mode or a feature
  // and this stops compiling until every cell is filled in.
  const matrix: Record<ResolutionMode, Record<Feature, boolean>> = {
    bundler: {
      "extensionless-relative-imports": true,
      "directory-index-imports": true,
      "package-json-exports": true,
      "package-json-imports-subpaths": true,
    },
    node10: {
      "extensionless-relative-imports": true,
      "directory-index-imports": true,
      // node10 predates both fields entirely.
      "package-json-exports": false,
      "package-json-imports-subpaths": false,
    },
    nodenext: {
      // ESM resolution in Node is literal: no extension search, no index.
      "extensionless-relative-imports": false,
      "directory-index-imports": false,
      "package-json-exports": true,
      "package-json-imports-subpaths": true,
    },
  };

  return matrix[mode][feature];
}

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
  const causes: Record<Symptom, Cause> = {
    "tsc-cannot-find-a-sibling-module": "missing-js-extension",
    "node-cannot-find-a-module-that-tsc-resolved-happily":
      "bundler-resolution-with-a-node-runtime",
    "a-deep-import-into-a-dependency-fails-although-the-file-is-there":
      "exports-does-not-list-the-subpath",
    "a-package-ships-types-but-tsc-says-it-has-no-declarations":
      "exports-has-no-types-condition-first",
    "a-default-import-of-a-commonjs-package-is-undefined-at-runtime":
      "commonjs-default-interop",
  };

  return causes[symptom];
}

export type ExportsEntry =
  | string
  | null
  | { readonly [condition: string]: ExportsEntry };

export type ExportsMap = { readonly [subpath: string]: ExportsEntry };

/** Resolve a target once the subpath has been matched. */
function resolveTarget(
  entry: ExportsEntry,
  conditions: readonly string[],
  wildcard: string | null,
): string | null {
  // `null` is not "missing" — it is the package author saying "this path is
  // deliberately not reachable".
  if (entry === null) return null;

  if (typeof entry === "string") {
    return wildcard === null ? entry : entry.replace("*", wildcard);
  }

  // Object.entries preserves declaration order for string keys, which IS the
  // priority order for conditions. First match wins, so a map that lists
  // "import" before "types" resolves to the .mjs for a types-aware caller.
  for (const [condition, nested] of Object.entries(entry)) {
    if (condition === "default" || conditions.includes(condition)) {
      return resolveTarget(nested, conditions, wildcard);
    }
  }

  return null;
}

export function resolveExports(
  map: ExportsMap,
  subpath: string,
  conditions: readonly string[],
): string | null {
  // 1. An exact key always wins over a pattern.
  const exact = map[subpath];
  if (exact !== undefined) return resolveTarget(exact, conditions, null);

  // 2. Otherwise the best `*` pattern: prefix and suffix must both match, and
  //    the longest prefix wins.
  let best: { entry: ExportsEntry; wildcard: string } | null = null;
  let bestPrefixLength = -1;

  for (const [pattern, entry] of Object.entries(map)) {
    const star = pattern.indexOf("*");
    if (star === -1) continue;

    const prefix = pattern.slice(0, star);
    const suffix = pattern.slice(star + 1);

    if (!subpath.startsWith(prefix) || !subpath.endsWith(suffix)) continue;
    if (subpath.length < prefix.length + suffix.length) continue;
    if (prefix.length <= bestPrefixLength) continue;

    best = {
      entry,
      wildcard: subpath.slice(prefix.length, subpath.length - suffix.length),
    };
    bestPrefixLength = prefix.length;
  }

  if (best === null) return null;

  return resolveTarget(best.entry, conditions, best.wildcard);
}

export type BuildTarget =
  | "vite-application"
  | "published-node-library"
  | "legacy-webpack-4-build"
  | "script-run-by-node-directly";

export function modeFor(target: BuildTarget): ResolutionMode {
  const modes: Record<BuildTarget, ResolutionMode> = {
    "vite-application": "bundler",
    // The mistake: a published package built with "bundler" compiles fine and
    // then fails in every consumer that runs it on Node.
    "published-node-library": "nodenext",
    "legacy-webpack-4-build": "node10",
    "script-run-by-node-directly": "nodenext",
  };

  return modes[target];
}
