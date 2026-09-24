/**
 * Exercise 14/01 — Import & export forms
 *
 * ES modules give you a handful of import and export forms, and every one of
 * them exists for a reason. This exercise walks all of them against three real
 * neighbouring modules:
 *
 *   ./shapes.ts   named exports (values AND types)
 *   ./format.ts   a default export plus a named one
 *   ./units.ts    constants only, used as a namespace
 *
 * This file plays two roles at once: it is the module the tests import, and it
 * is the BARREL that re-exports the other three. Both halves are the exercise.
 *
 * The repo runs with `isolatedModules` and, in this section, with
 * `verbatimModuleSyntax` — so a re-exported TYPE must say `export type`. The
 * compiler will tell you; the point is to know why, and 14/02 goes into it.
 *
 * Read README.md first. Replace every TODO.
 */

import type { Shape } from "./shapes";

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// A NAMED import. Bring in `area` and `perimeter` from "./shapes" and use them.
//
//   summarise({ kind: "rect", width: 3, height: 4 })
//     -> "area 12, perimeter 14"
//
// Both numbers are rounded to two decimals with `Number(x.toFixed(2))`, so
// 12.566370614 prints as 12.57 and 12 prints as 12.
export function summarise(shape: Shape): string {
  throw new Error("TODO 1: implement summarise");
}

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// A DEFAULT import. "./format" default-exports a function; import it (the local
// name is yours to choose — that is what makes default imports awkward) and
// use it.
//
//   label(3.14159, "cm")  ->  "3.14cm"
export function label(value: number, unit: string): string {
  throw new Error("TODO 2: implement label");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// A NAMESPACE import: `import * as units from "./units"`. That gives you one
// object whose keys are exactly the module's exports — so `keyof typeof units`
// is `"mm" | "cm" | "m" | "km"` with nothing hand-written (10/01).
//
//   unitNames()          -> ["cm", "km", "m", "mm"]   (sorted)
//   toMetres(2, "km")    -> 2000
export type UnitName = unknown;

export function unitNames(): string[] {
  throw new Error("TODO 3: implement unitNames");
}

export function toMetres(value: number, unit: UnitName): number {
  throw new Error("TODO 3: implement toMetres");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// RE-EXPORTS. Make this module a barrel, without importing anything you do not
// otherwise need:
//
//   * `area` and `perimeter`, re-exported from "./shapes"
//   * the types `Circle`, `Rect` and `Shape` — these need `export type`
//   * "./format"'s DEFAULT, re-exported under the name `formatLength`
//
// `export { x } from "./m"` is not the same as importing `x` and exporting it:
// the binding never enters this module's scope, which is what lets a barrel
// stay free of unused-import noise.

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// `export * from "./units"` — the wildcard form, for when a module's whole
// surface is meant to come through.
//
// It has one trap, and the tests check it: `export *` does NOT forward a
// default export. That is why TODO 4 had to name "./format"'s default
// explicitly.
//
// Also re-export "./format"'s `PRECISION` under the name `FORMAT_PRECISION`,
// so it cannot collide with anything else this barrel forwards.
