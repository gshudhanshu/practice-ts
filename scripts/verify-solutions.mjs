#!/usr/bin/env node
/**
 * Quality gate: proves every provided solution actually passes its own spec.
 *
 * For each exercise it copies the WHOLE exercise directory into a private
 * scratch dir, swaps `solution/solution.ts` in as `exercise.ts`, then
 * typechecks and runs it. If a solution is wrong, this goes red.
 *
 * Copying the whole directory (rather than just two files) means exercises may
 * ship helper modules, fixtures, or their own tsconfig — needed for sections
 * like modules, decorators and React.
 *
 * The scratch dir is unique per run, so several of these can run concurrently.
 *
 *   npm run verify:solutions          -> all
 *   npm run verify:solutions 07/03    -> one
 */
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { ROOT, TSC, VITEST, resolveTargets, rel, c } from "./_lib.mjs";

const shorthand = process.argv.slice(2).find((a) => !a.startsWith("-"));

// Unique per run so concurrent verifications cannot delete each other's files.
const RUN_ID = `run-${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const RUN_DIR = path.join(ROOT, "verify-tmp", RUN_ID);

let targets;
try {
  targets = resolveTargets(shorthand);
} catch (err) {
  console.error(c.red(err.message));
  process.exit(1);
}

/** Rewrite `../../../src/type-testing` for the copy's new depth. */
function retargetImports(file, depth) {
  if (!existsSync(file)) return;
  const hop = "../".repeat(depth);
  writeFileSync(
    file,
    readFileSync(file, "utf8").replace(
      /(["'])(?:\.\.\/)+src\/([A-Za-z0-9_-]+)\1/g,
      `$1${hop}src/$2$1`,
    ),
  );
}

const prepared = [];

for (const dir of targets) {
  const solution = path.join(dir, "solution", "solution.ts");
  const test = path.join(dir, "exercise.test.ts");
  if (!existsSync(solution) || !existsSync(test)) continue;

  const out = path.join(RUN_DIR, rel(dir).replace(/^exercises\//, ""));
  mkdirSync(out, { recursive: true });

  // 1. Copy everything (helpers, fixtures, a custom tsconfig, …).
  cpSync(dir, out, { recursive: true });

  // 2. The solution becomes the exercise, then drop the solution folder so it
  //    is not typechecked twice.
  cpSync(solution, path.join(out, "exercise.ts"));
  rmSync(path.join(out, "solution"), { recursive: true, force: true });

  // 3. Fix relative paths for the new depth.
  const depth = rel(out).split("/").length;
  for (const entry of readdirSync(out)) {
    if (entry.endsWith(".ts")) retargetImports(path.join(out, entry), depth);
  }

  // 4. Keep the exercise's own compiler options if it has any (section 12
  //    needs experimentalDecorators, section 18 needs jsx), otherwise default.
  const tsconfigPath = path.join(out, "tsconfig.json");
  let tsconfig = { extends: "", include: ["."] };
  if (existsSync(tsconfigPath)) {
    try {
      tsconfig = JSON.parse(readFileSync(tsconfigPath, "utf8"));
    } catch {
      /* fall through to the default */
    }
  }
  tsconfig.extends = "../".repeat(depth) + "tsconfig.base.json";
  tsconfig.include = tsconfig.include ?? ["."];
  writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2) + "\n");

  prepared.push(out);
}

if (prepared.length === 0) {
  console.log(c.yellow("No solutions to verify yet."));
  rmSync(RUN_DIR, { recursive: true, force: true });
  process.exit(0);
}

const run = (entry, argv) =>
  spawnSync(process.execPath, [entry, ...argv], { cwd: ROOT, stdio: "inherit" })
    .status ?? 1;

console.log(c.bold(`\nVerifying ${prepared.length} solution(s)…\n`));

let failures = 0;
for (const dir of prepared) {
  if (run(TSC(), ["--noEmit", "-p", dir]) !== 0) {
    console.log(c.red(`✘ type error in solution: ${rel(dir)}`));
    failures++;
  }
}

// Scope the test run to THIS run's directory so parallel runs stay isolated.
if (run(VITEST(), ["run", rel(RUN_DIR)]) !== 0) failures++;

if (process.env.KEEP_VERIFY_TMP !== "1") {
  rmSync(RUN_DIR, { recursive: true, force: true });
  // Tidy the parent when nothing else is running.
  try {
    const parent = path.join(ROOT, "verify-tmp");
    if (existsSync(parent) && readdirSync(parent).length === 0) {
      rmSync(parent, { recursive: true, force: true });
    }
  } catch {
    /* another run is using it */
  }
}

console.log(
  failures === 0
    ? c.green("\n✔ every solution passes its own spec.\n")
    : c.red(`\n✘ ${failures} solution problem(s).\n`),
);
process.exit(failures === 0 ? 0 : 1);
