/**
 * Solution — 15/01 isolatedModules
 */

// `import type` is erased completely; the value import is kept verbatim. A
// transpiler that has never seen ./shapes still emits the right thing, because
// the source already says which name is which.
import type { Shape } from "./shapes";
import { area } from "./shapes";

// `export type` marks the re-export as erasable. Written as a plain
// `export { Shape } from "./shapes"` this is TS1205, because the transpiler
// would emit a re-export of a binding that does not exist at runtime.
export type { Shape } from "./shapes";

export function summarise(shape: Shape): string {
  return `${shape.kind}: ${area(shape).toFixed(2)}`;
}

// The const-enum replacement: one frozen object of literals…
export const DIRECTION = {
  up: "up",
  down: "down",
  left: "left",
  right: "right",
} as const;

// …and the union derived from it, so the values exist exactly once (02/03).
export type Direction = (typeof DIRECTION)[keyof typeof DIRECTION];

export type Construct =
  | "type-reexport-without-export-type"
  | "ambient-const-enum"
  | "const-enum"
  | "namespace-merged-across-files"
  | "import-equals-require";

export type Problem =
  | "bundler-cannot-find-an-exported-name"
  | "enum-member-is-undefined-at-runtime"
  | "enum-object-survives-into-the-bundle"
  | "half-the-namespace-members-vanished"
  | "require-is-not-defined-in-the-browser";

export function diagnose(problem: Problem): Construct {
  // A Record keyed by the union gives exhaustiveness for free (03/04).
  const causes: Record<Problem, Construct> = {
    "bundler-cannot-find-an-exported-name": "type-reexport-without-export-type",
    "enum-member-is-undefined-at-runtime": "ambient-const-enum",
    "enum-object-survives-into-the-bundle": "const-enum",
    "half-the-namespace-members-vanished": "namespace-merged-across-files",
    "require-is-not-defined-in-the-browser": "import-equals-require",
  };

  return causes[problem];
}

export function flaggedByTheCompiler(construct: Construct): boolean {
  // TS1205, TS2748 and TS1202/TS1203 respectively. The other two compile
  // without a murmur and break only once a bundler gets hold of them.
  const flagged: Record<Construct, boolean> = {
    "type-reexport-without-export-type": true,
    "ambient-const-enum": true,
    "import-equals-require": true,
    "const-enum": false,
    "namespace-merged-across-files": false,
  };

  return flagged[construct];
}

export type ImportForm =
  | "import type { T } from 'm'"
  | "import { type T } from 'm'"
  | "import { value } from 'm'"
  | "import 'm'"
  | "import type * as NS from 'm'";

export function emitsAnImport(form: ImportForm): boolean {
  // The second line is the surprise: `import { type T } from "m"` emits
  // `import {} from "m"`, so the module is still fetched and its side effects
  // still run. Only the `import type` FORM erases the statement itself.
  const kept: Record<ImportForm, boolean> = {
    "import type { T } from 'm'": false,
    "import { type T } from 'm'": true,
    "import { value } from 'm'": true,
    "import 'm'": true,
    "import type * as NS from 'm'": false,
  };

  return kept[form];
}
