#!/usr/bin/env node
/**
 * Conventions audit.
 *
 * `verify:solutions` proves the code WORKS. This proves it follows the house
 * style in CONVENTIONS.md — structure, banned constructs, the two-layer spec,
 * and the documentation each exercise owes the reader.
 *
 *   npm run audit          -> every exercise
 *   npm run audit 18       -> one section
 *   npm run audit --strict -> treat warnings as failures
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { EXERCISES, ROOT, resolveTargets, rel, c, sectionDirs } from "./_lib.mjs";

const args = process.argv.slice(2);
const strict = args.includes("--strict");
const shorthand = args.find((a) => !a.startsWith("-"));

const errors = [];
const warnings = [];

const fail = (where, message) => errors.push(`${where}: ${message}`);
const warn = (where, message) => warnings.push(`${where}: ${message}`);

const read = (file) => (existsSync(file) ? readFileSync(file, "utf8") : null);

/**
 * Blank out comments WITHOUT changing the line count, so reported line numbers
 * still point at the right place in the original file.
 */
function stripComments(source) {
  const blank = (match) => match.replace(/[^\n]/g, " ");
  return (
    source
      .replace(/\/\*[\s\S]*?\*\//g, blank)
      .replace(/\/\/[^\n]*/g, blank)
      // String and template literals too: a key like "…-implicitly-any" is not
      // a use of the `any` type, and `as` can appear in prose inside one.
      .replace(/`(?:[^`\\]|\\[\s\S])*`/g, blank)
      .replace(/"(?:[^"\\\n]|\\.)*"/g, blank)
      .replace(/'(?:[^'\\\n]|\\.)*'/g, blank)
  );
}

/** Report banned constructs with their line numbers. */
function hygiene(where, source) {
  const code = stripComments(source);
  const lines = code.split(/\r?\n/);

  const hits = { any: [], as: [], bang: [] };

  lines.forEach((line, i) => {
    const n = i + 1;

    // `any` as a type, not inside an identifier like `company`.
    // Two forms are how the standard library itself is written, so they are
    // legitimate in the utility-type sections: `keyof any` and `...args: any`.
    const withoutStdlibForms = line
      .replace(/keyof\s+any\b/g, "")
      .replace(/\.\.\.\w+\s*:\s*any(\[\])?/g, "");
    if (/(?<![A-Za-z0-9_$])any(?![A-Za-z0-9_$])/.test(withoutStdlibForms)) {
      hits.any.push(n);
    }

    // A type ASSERTION is `as` followed by something type-shaped. This must not
    // match `as const`, a mapped-type key remap, an import alias, or a variable
    // that happens to be named `as`.
    const isAssertion =
      /\bas\s+(?!const\b)(?:readonly\b|string\b|number\b|boolean\b|unknown\b|never\b|[A-Z_$]|\{|\(|\[)/.test(
        line,
      ) &&
      !/\b(?:const|let|var)\s+as\b/.test(line) &&
      !/\[[^\]]*\bin\b[^\]]*\bas\b/.test(line) &&
      !/^\s*(import|export)\b/.test(line);
    if (isAssertion) hits.as.push(n);

    // Non-null assertion: `x!.y`, `x!)`, `x!;`, `x!,`  — but not `!==`/`!=`.
    if (/[A-Za-z0-9_$\])]\!(?=[.\)\];,])/.test(line)) hits.bang.push(n);
  });

  for (const [kind, lineNumbers] of Object.entries(hits)) {
    if (lineNumbers.length === 0) continue;
    const label = { any: "`any`", as: "`as` assertion", bang: "`!` non-null" }[kind];
    // A single, commented cast is permitted by CONVENTIONS.md rule 8 — flag it
    // as a warning so a human can confirm it is documented.
    const level = kind === "as" && lineNumbers.length === 1 ? warn : fail;
    level(where, `${label} on line(s) ${lineNumbers.join(", ")}`);
  }
}

function auditExercise(dir) {
  const where = rel(dir);

  const required = [
    "exercise.ts",
    "exercise.test.ts",
    "tsconfig.json",
    "README.md",
    path.join("solution", "solution.ts"),
    path.join("solution", "EXPLANATION.md"),
  ];

  for (const file of required) {
    if (!existsSync(path.join(dir, file))) fail(where, `missing ${file}`);
  }

  const solution = read(path.join(dir, "solution", "solution.ts"));
  const test = read(path.join(dir, "exercise.test.ts"));
  const starter = read(path.join(dir, "exercise.ts"));
  const readme = read(path.join(dir, "README.md"));
  const explanation = read(path.join(dir, "solution", "EXPLANATION.md"));

  if (solution) hygiene(`${where}/solution.ts`, solution);

  if (test) {
    // Two-layer spec: a compile-time layer AND runtime tests. The compile-time
    // layer is usually Expect<Equal<…>>, but a test whose type contract is
    // purely negative may legitimately use only @ts-expect-error.
    if (!/\bExpect\s*<|\bEqual\s*<|@ts-expect-error/.test(test)) {
      fail(where, "test has no compile-time layer (Expect<Equal<…>> or @ts-expect-error)");
    }
    if (!/\b(describe|it)\s*\(/.test(test)) {
      fail(where, "test has no runtime tests");
    }
    // Rule 1: a negative assertion that EXECUTES something must sit inside an
    // uncalled function. A bare `const`/`type` declaration is inert, so only
    // flag calls and mutations at what looks like module scope.
    const executingExpectError = test
      .split(/\r?\n/)
      .some((line, i, all) => {
        if (!/@ts-expect-error/.test(line)) return false;
        const next = (all[i + 1] ?? "").trim();
        const isDeclaration = /^(const|let|var|type|interface)\b/.test(next);
        const isIndented = /^\s{2,}/.test(all[i] ?? "");
        return !isDeclaration && !isIndented && next !== "";
      });
    if (executingExpectError && !/function\s+_[A-Za-z0-9_]*\s*\(/.test(test)) {
      warn(where, "@ts-expect-error before an executing statement, with no `function _…()` wrapper");
    }
  }

  if (starter) {
    if (!/TODO\s*\d/.test(starter)) warn(where, "starter has no numbered TODOs");
  }

  if (readme) {
    if (!/npm run check/.test(readme)) fail(where, "README has no `npm run check` line");
    if (!/<details>/.test(readme)) warn(where, "README has no collapsed hints");
    if (!/\*\*Tier:\*\*/.test(readme)) warn(where, "README has no Tier/Time header");
  }

  if (explanation) {
    if (!/Common mistakes/i.test(explanation)) {
      warn(where, "EXPLANATION has no 'Common mistakes' section");
    }
    if (!/Interview angle/i.test(explanation)) {
      warn(where, "EXPLANATION has no 'Interview angle' section");
    }
  }
}

/* ── Run ─────────────────────────────────────────────────────────────────── */

let targets;
try {
  targets = resolveTargets(shorthand);
} catch (err) {
  console.error(c.red(err.message));
  process.exit(1);
}

for (const dir of targets) auditExercise(dir);

// Every section needs its own index README.
const sections = shorthand
  ? sectionDirs().filter((s) => s === shorthand || s.startsWith(`${shorthand.split(/[^0-9A-Za-z]/)[0]}-`))
  : sectionDirs();

for (const section of sections) {
  const readme = path.join(EXERCISES, section, "README.md");
  if (!existsSync(readme)) fail(`exercises/${section}`, "missing section README.md");
}

console.log(c.bold(`\nAudited ${targets.length} exercise(s) in ${sections.length} section(s)\n`));

if (warnings.length > 0) {
  console.log(c.yellow(`${warnings.length} warning(s):`));
  for (const w of warnings) console.log(c.yellow(`  ⚠ ${w}`));
  console.log("");
}

if (errors.length > 0) {
  console.log(c.red(`${errors.length} error(s):`));
  for (const e of errors) console.log(c.red(`  ✘ ${e}`));
  console.log("");
  process.exit(1);
}

if (warnings.length > 0 && strict) {
  console.log(c.red("✘ warnings treated as errors (--strict)\n"));
  process.exit(1);
}

console.log(c.green("✔ conventions audit passed\n"));
process.exit(0);
