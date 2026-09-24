#!/usr/bin/env node
/** Ensures every exercise directory has its own tsconfig, so `tsc -p <dir>`
 *  and your editor both scope correctly to one exercise at a time. */
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { resolveTargets, rel } from "./_lib.mjs";

let made = 0;
for (const dir of resolveTargets(process.argv[2])) {
  const file = path.join(dir, "tsconfig.json");
  if (existsSync(file)) continue;
  writeFileSync(
    file,
    JSON.stringify(
      { extends: "../../../tsconfig.base.json", include: ["."] },
      null,
      2,
    ) + "\n",
  );
  console.log("created " + rel(file));
  made++;
}
console.log(made === 0 ? "all exercises already have a tsconfig" : made + " created");
