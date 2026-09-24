#!/usr/bin/env node
/**
 * Typechecks every ```ts code block in CHEATSHEET.md.
 *
 * Each block is extracted to its own file (with `export {}` appended so blocks
 * cannot collide in the global scope) and compiled with the repo's strict
 * settings. A block that is deliberately illustrative rather than compilable
 * should use a ```text fence instead of ```ts.
 *
 *   npm run check:cheatsheet
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ROOT, TSC, c } from "./_lib.mjs";

const SOURCE = path.join(ROOT, "CHEATSHEET.md");
const OUT = path.join(ROOT, "verify-tmp", "cheatsheet");

const markdown = readFileSync(SOURCE, "utf8");
const lines = markdown.split(/\r?\n/);

/* Collect fenced ```ts blocks along with the line they start on, so an error
   can be reported against the real CHEATSHEET.md line number. */
const blocks = [];
let current = null;

lines.forEach((line, index) => {
  const fence = line.match(/^```(\w*)\s*$/);
  if (!fence) {
    if (current) current.body.push(line);
    return;
  }
  if (current) {
    blocks.push(current);
    current = null;
  } else if (fence[1] === "ts") {
    current = { startLine: index + 1, body: [] };
  }
});

if (blocks.length === 0) {
  console.error(c.red("No ```ts blocks found — is CHEATSHEET.md intact?"));
  process.exit(1);
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

blocks.forEach((block, i) => {
  const name = `block-${String(i).padStart(3, "0")}.ts`;
  block.file = name;
  writeFileSync(
    path.join(OUT, name),
    `${block.body.join("\n")}\nexport {};\n`,
  );
});

writeFileSync(
  path.join(OUT, "tsconfig.json"),
  JSON.stringify(
    { extends: "../../tsconfig.base.json", include: ["."] },
    null,
    2,
  ) + "\n",
);

console.log(c.bold(`\nTypechecking ${blocks.length} cheat sheet snippets…\n`));

const result = spawnSync(process.execPath, [TSC(), "--noEmit", "-p", OUT], {
  cwd: ROOT,
  encoding: "utf8",
});

/* Snippets are compiled from a temp directory, so any import path written for
   the reader's benefit ("./src/type-testing") cannot resolve. Module-resolution
   errors are therefore expected and ignored; everything else is a real bug. */
const IGNORED = new Set([
  "TS2307", // Cannot find module '…'
  "TS2664", // Invalid module name in augmentation
]);

const output = `${result.stdout ?? ""}${result.stderr ?? ""}`
  .split(/\r?\n/)
  .filter((line) => {
    const code = line.match(/error (TS\d+):/);
    return code === null || !IGNORED.has(code[1]);
  })
  .join("\n")
  .trim();

if (output === "") {
  rmSync(OUT, { recursive: true, force: true });
  console.log(c.green("✔ every snippet compiles under the repo's strict config\n"));
  process.exit(0);
}

/* Rewrite "block-007.ts(3,10)" into a CHEATSHEET.md line number. */
for (const line of output.split(/\r?\n/)) {
  // Match the whole leading path so the rewritten message has no stale prefix.
  const match = line.match(/^\S*block-(\d+)\.ts\((\d+),(\d+)\)/);
  if (!match) {
    console.log(line);
    continue;
  }
  const block = blocks[Number(match[1])];
  const realLine = (block?.startLine ?? 0) + Number(match[2]);
  console.log(
    line.replace(match[0], `CHEATSHEET.md:${realLine} (snippet col ${match[3]})`),
  );
}

console.log(
  c.red(`\n✘ snippet errors above. Fix them, or use a \`\`\`text fence for
  illustrative-only code. Extracted files kept in verify-tmp/cheatsheet/\n`),
);
process.exit(1);
