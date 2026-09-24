#!/usr/bin/env node
/**
 * The LEARNER-FLOW gate.
 *
 * `verify:solutions` copies each solution into a scratch directory with a
 * regenerated tsconfig and the `solution/` folder removed. That proves the
 * solution is correct, but it does NOT prove the thing a learner actually does:
 *
 *   paste solution/solution.ts into exercise.ts, then run `npm run check`
 *
 * That path uses the exercise's OWN tsconfig, keeps `solution/` on disk (so it
 * is typechecked alongside), and resolves sibling helper modules in place.
 * Differences there are real bugs a learner would hit and the other gate would
 * never see.
 *
 * This script swaps every solution in, runs both halves of `check`, and then
 * restores — even if it fails.
 *
 *   npm run check:inplace          -> all
 *   npm run check:inplace 02       -> one section
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, rmSync } from "node:fs";
import path from "node:path";
import { ROOT, TSC, VITEST, resolveTargets, rel, c } from "./_lib.mjs";

const shorthand = process.argv.slice(2).find((a) => !a.startsWith("-"));

let targets;
try {
  targets = resolveTargets(shorthand);
} catch (err) {
  console.error(c.red(err.message));
  process.exit(1);
}

const swapped = [];

/** Always put the starters back, whatever happened. */
function restore() {
  for (const { exercise, backup } of swapped) {
    if (existsSync(backup)) {
      copyFileSync(backup, exercise);
      rmSync(backup, { force: true });
    }
  }
}

process.on("exit", restore);
process.on("SIGINT", () => {
  restore();
  process.exit(130);
});

// Refuse to run if a previous run died without restoring.
for (const dir of targets) {
  if (existsSync(path.join(dir, "exercise.ts.starter-backup"))) {
    console.error(
      c.red(
        `A backup already exists in ${rel(dir)} — a previous run did not restore.\n` +
          `Inspect it, move it back to exercise.ts, then re-run.`,
      ),
    );
    process.exit(1);
  }
}

for (const dir of targets) {
  const exercise = path.join(dir, "exercise.ts");
  const solution = path.join(dir, "solution", "solution.ts");
  const backup = path.join(dir, "exercise.ts.starter-backup");
  if (!existsSync(exercise) || !existsSync(solution)) continue;

  copyFileSync(exercise, backup);
  copyFileSync(solution, exercise);
  swapped.push({ exercise, backup, dir });
}

if (swapped.length === 0) {
  console.log(c.yellow("Nothing to check."));
  process.exit(0);
}

console.log(
  c.bold(`\nLearner-flow check: ${swapped.length} solution(s) swapped in place\n`),
);

const run = (entry, argv, quiet) =>
  spawnSync(process.execPath, [entry, ...argv], {
    cwd: ROOT,
    stdio: quiet ? "pipe" : "inherit",
    encoding: "utf8",
  });

/* ── 1. Typecheck each exercise with its OWN tsconfig ─────────────────────── */
const typeFailures = [];
for (const { dir } of swapped) {
  const result = run(TSC(), ["--noEmit", "-p", dir], true);
  if ((result.status ?? 1) !== 0) {
    typeFailures.push({
      dir: rel(dir),
      output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim(),
    });
  }
}

if (typeFailures.length === 0) {
  console.log(c.green(`✔ types OK in all ${swapped.length}`));
} else {
  console.log(c.red(`✘ type errors in ${typeFailures.length} exercise(s):\n`));
  for (const { dir, output } of typeFailures) {
    console.log(c.red(`  ── ${dir}`));
    for (const line of output.split(/\r?\n/).slice(0, 6)) {
      if (line.trim() !== "") console.log(`     ${line}`);
    }
  }
}

/* ── 2. Run the suite ─────────────────────────────────────────────────────── */
console.log(c.bold("\nRunning tests against the solutions…\n"));
const testResult = run(
  VITEST(),
  ["run", ...swapped.map(({ dir }) => rel(dir))],
  false,
);
const testsPassed = (testResult.status ?? 1) === 0;

const ok = typeFailures.length === 0 && testsPassed;
console.log(
  ok
    ? c.green("\n✔ every solution also passes IN PLACE, via `npm run check`.\n")
    : c.red("\n✘ learner-flow failures above — these are bugs the temp-dir gate cannot see.\n"),
);

process.exit(ok ? 0 : 1);
