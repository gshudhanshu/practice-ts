/**
 * Solution — 14/01 Import & export forms
 */

// A named import: the names are fixed by the exporting module, so a reader can
// grep for `area` and find both ends.
import { area, perimeter } from "./shapes";

// A default import: the local name is chosen HERE. Nothing stops the next file
// calling it `fmt`, which is exactly why default exports are harder to search.
import formatLength from "./format";

// A namespace import: one object holding every named export of the module.
import * as units from "./units";

import type { Shape } from "./shapes";

const round = (value: number): number => Number(value.toFixed(2));

export function summarise(shape: Shape): string {
  return `area ${round(area(shape))}, perimeter ${round(perimeter(shape))}`;
}

export function label(value: number, unit: string): string {
  return formatLength(value, unit);
}

// `keyof typeof units` (10/01) reads the namespace object's type and takes its
// keys — the unit names, derived rather than retyped.
export type UnitName = keyof typeof units;

export function unitNames(): string[] {
  return Object.keys(units).sort();
}

export function toMetres(value: number, unit: UnitName): number {
  // Indexing a namespace with a key union is not an index signature, so
  // `noUncheckedIndexedAccess` does not add `| undefined` here.
  return value * units[unit];
}

// Re-export form: the binding never enters this module's scope, so a barrel
// stays free of unused-import warnings.
export { area, perimeter } from "./shapes";

// Types must say `export type` under `isolatedModules`/`verbatimModuleSyntax`:
// each file is transpiled alone, so the emitter cannot tell a type from a value
// by looking at the other module.
export type { Circle, Rect, Shape } from "./shapes";

// A default has no name of its own, so re-exporting it means giving it one.
export { default as formatLength } from "./format";

// The wildcard form. It forwards every NAMED export of "./units" — and
// deliberately not a default, which is why the line above exists.
export * from "./units";

// Renaming on re-export is how a barrel avoids collisions between the modules
// it forwards.
export { PRECISION as FORMAT_PRECISION } from "./format";
