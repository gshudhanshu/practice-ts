import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Standard (TC39) decorators — runtime support for sections 11 and 13.
 *
 * Vite's TypeScript transform is Oxc, which only implements the LEGACY
 * (`experimentalDecorators`) transform. It passes standard `@decorator` syntax
 * through untouched, and V8 has no native support for it, so the module dies
 * with `SyntaxError: Invalid or unexpected token`.
 *
 * So a file that uses decorators and whose own tsconfig does NOT opt into
 * `experimentalDecorators` is handed to `tsc` first, which does implement the
 * standard-decorator downlevel. Section 12 keeps Oxc's legacy transform,
 * because those exercises set the flag. Every other file returns immediately.
 */
const TSC = path.resolve("node_modules/typescript/lib/tsc.js");
const ROOT = path.resolve(".");
const DECORATOR_SYNTAX = /(^|\n)[ \t]*@[A-Za-z_$]/;

/** Nearest tsconfig.json wins, exactly as it does for `npm run check`. */
const legacyByDir = new Map<string, boolean>();
function usesLegacyDecorators(file: string): boolean {
  const chain: string[] = [];
  let dir = path.dirname(file);
  for (;;) {
    const known = legacyByDir.get(dir);
    if (known !== undefined) {
      for (const seen of chain) legacyByDir.set(seen, known);
      return known;
    }
    chain.push(dir);

    const tsconfig = path.join(dir, "tsconfig.json");
    if (existsSync(tsconfig)) {
      let legacy = false;
      try {
        const parsed: unknown = JSON.parse(readFileSync(tsconfig, "utf8"));
        legacy =
          typeof parsed === "object" &&
          parsed !== null &&
          "compilerOptions" in parsed &&
          typeof parsed.compilerOptions === "object" &&
          parsed.compilerOptions !== null &&
          "experimentalDecorators" in parsed.compilerOptions &&
          parsed.compilerOptions.experimentalDecorators === true;
      } catch {
        /* malformed tsconfig — assume standard decorators */
      }
      for (const seen of chain) legacyByDir.set(seen, legacy);
      return legacy;
    }

    const parent = path.dirname(dir);
    if (parent === dir || dir === ROOT) {
      for (const seen of chain) legacyByDir.set(seen, false);
      return false;
    }
    dir = parent;
  }
}

const standardDecorators = {
  name: "standard-decorators",
  enforce: "pre" as const,
  transform(
    code: string,
    id: string,
  ): { code: string; map: string | null } | null {
    const file = id.split("?")[0] ?? "";
    if (
      !file.endsWith(".ts") ||
      !DECORATOR_SYNTAX.test(code) ||
      usesLegacyDecorators(file)
    ) {
      return null;
    }

    const dir = mkdtempSync(path.join(tmpdir(), "ts-decorators-"));
    try {
      const input = path.join(dir, "input.ts");
      writeFileSync(input, code);
      try {
        execFileSync(
          process.execPath,
          [
            TSC,
            "--target", "es2022",
            "--module", "esnext",
            "--moduleResolution", "bundler",
            "--verbatimModuleSyntax",
            "--isolatedModules",
            "--sourceMap",
            "--outDir", path.join(dir, "out"),
            input,
          ],
          { stdio: "ignore" },
        );
      } catch {
        // Compiling one file in isolation cannot resolve its imports, so tsc
        // exits non-zero. Emit still happens, and `npm run check` is what
        // actually typechecks the exercise.
      }

      // Point the map back at the real file, or stack traces in a failing
      // exercise land on whatever line happens to match in `input.ts`.
      let map: string | null = null;
      const mapPath = path.join(dir, "out", "input.js.map");
      if (existsSync(mapPath)) {
        try {
          const parsed: unknown = JSON.parse(readFileSync(mapPath, "utf8"));
          if (typeof parsed === "object" && parsed !== null) {
            map = JSON.stringify({
              ...parsed,
              sources: [file],
              sourcesContent: [code],
            });
          }
        } catch {
          /* no map is better than a wrong one */
        }
      }

      return {
        code: readFileSync(path.join(dir, "out", "input.js"), "utf8"),
        map,
      };
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  },
};

export default defineConfig({
  plugins: [standardDecorators],
  test: {
    include: ["exercises/**/*.test.ts", "verify-tmp/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/solution/**"],
    passWithNoTests: true,
  },
});
