import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
export const EXERCISES = path.join(ROOT, "exercises");

/** Resolve the JS entrypoint of a dev dependency without relying on .bin shims
 *  (those break on Windows paths containing spaces). */
export function resolveBin(candidates) {
  for (const rel of candidates) {
    const full = path.join(ROOT, "node_modules", rel);
    if (existsSync(full)) return full;
  }
  return null;
}

export const TSC = () =>
  resolveBin(["typescript/lib/tsc.js"]);
export const VITEST = () =>
  resolveBin(["vitest/vitest.mjs", "vitest/dist/cli.js", "vitest/dist/cli-wrapper.js"]);

const dirs = (p) =>
  existsSync(p)
    ? readdirSync(p, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort()
    : [];

export const sectionDirs = () => dirs(EXERCISES);

/**
 * Turn a shorthand into a list of absolute exercise directories.
 *   undefined -> every exercise
 *   "07"      -> every exercise in section 07
 *   "07/03"   -> that one exercise (also accepts a backslash separator)
 */
export function resolveTargets(shorthand) {
  const sections = sectionDirs();
  if (!shorthand) {
    return sections.flatMap((s) =>
      dirs(path.join(EXERCISES, s)).map((e) => path.join(EXERCISES, s, e)),
    );
  }

  const [rawSection, rawExercise] = shorthand.split(/[^0-9A-Za-z_.-]+/).filter(Boolean);
  const section = sections.find(
    (s) => s === rawSection || s.startsWith(`${rawSection}-`),
  );
  if (!section) {
    throw new Error(
      `No section matches "${rawSection}".\nAvailable: ${sections.join(", ") || "(none yet)"}`,
    );
  }

  const children = dirs(path.join(EXERCISES, section));
  if (!rawExercise) {
    return children.map((e) => path.join(EXERCISES, section, e));
  }

  const exercise = children.find(
    (e) => e === rawExercise || e.startsWith(`${rawExercise}-`),
  );
  if (!exercise) {
    throw new Error(
      `No exercise matches "${rawExercise}" in ${section}.\nAvailable: ${children.join(", ") || "(none yet)"}`,
    );
  }
  return [path.join(EXERCISES, section, exercise)];
}

export const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");

export const c = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};
