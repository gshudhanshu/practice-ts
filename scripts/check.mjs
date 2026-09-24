#!/usr/bin/env node
/**
 * npm run check            -> every exercise
 * npm run check 07         -> whole section
 * npm run check 07/03      -> one exercise
 * npm run check 07/03 --types   -> typecheck only, skip the test runner
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { ROOT, TSC, VITEST, resolveTargets, rel, c } from "./_lib.mjs";

const args = process.argv.slice(2);
const typesOnly = args.includes("--types");
const shorthand = args.find((a) => !a.startsWith("-"));

let targets;
try {
  targets = resolveTargets(shorthand);
} catch (err) {
  console.error(c.red(err.message));
  process.exit(1);
}

if (targets.length === 0) {
  console.error(c.yellow("No exercises found yet."));
  process.exit(0);
}

const tsc = TSC();
const vitest = VITEST();
if (!tsc) {
  console.error(c.red("TypeScript is not installed. Run: npm install"));
  process.exit(1);
}

const run = (entry, argv) =>
  spawnSync(process.execPath, [entry, ...argv], {
    cwd: ROOT,
    stdio: "inherit",
  }).status ?? 1;

/* ---------- 1. Types ---------- */
console.log(c.bold(`\nTypechecking ${targets.length} exercise(s)…\n`));
const typeFailures = [];
for (const dir of targets) {
  if (!existsSync(path.join(dir, "tsconfig.json"))) continue;
  const status = run(tsc, ["--noEmit", "-p", dir]);
  if (status !== 0) typeFailures.push(rel(dir));
}

if (typeFailures.length === 0) {
  console.log(c.green("✔ types OK"));
} else {
  console.log(c.red(`✘ type errors in:\n  ${typeFailures.join("\n  ")}`));
}

if (typesOnly) process.exit(typeFailures.length === 0 ? 0 : 1);

/* ---------- 2. Runtime tests ---------- */
if (!vitest) {
  console.error(c.red("\nVitest is not installed. Run: npm install"));
  process.exit(1);
}
console.log(c.bold("\nRunning tests…\n"));
const testStatus = run(vitest, ["run", ...targets.map(rel)]);

const ok = typeFailures.length === 0 && testStatus === 0;
console.log(
  ok
    ? c.green("\n✔ ALL GREEN — exercise complete.\n")
    : c.red("\n✘ Not there yet. Fix the errors above and re-run.\n"),
);
process.exit(ok ? 0 : 1);
