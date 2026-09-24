/**
 * Exercise 14/02 — `import type` and `verbatimModuleSyntax`
 *
 * An import does two things at once: it binds a name, and it makes a module
 * RUN. Most of the time the second half is invisible, which is why it is where
 * the bugs live.
 *
 * The modules next to this one each announce themselves when they are
 * evaluated:
 *
 *   ./registry.ts    the recorder — `loaded` lists whatever ran
 *   ./telemetry.ts   exports a TYPE only, and must never run
 *   ./audit.ts       exports NOTHING, and must run
 *   ./formatter.ts   a type and a value together
 *   ./codec.ts       a class — a type and a value in one name
 *
 * So the tests do not just check your types: they check which modules your
 * imports actually loaded.
 *
 * This exercise's `tsconfig.json` turns on `verbatimModuleSyntax`, which means
 * TypeScript emits your import and export statements EXACTLY as written, minus
 * anything marked `type`. No guessing, no elision — which is why it will insist
 * you say `type` when you mean it.
 *
 * Read README.md first. Replace every TODO.
 */

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// `./telemetry` exports one type and nothing else. Import it so the module is
// NEVER evaluated — a test asserts "telemetry" does not appear in `loaded`.
//
// Then delete the placeholder below; it is only here so the starter compiles.
type TelemetryEvent = {
  name: string;
  at: number;
};

export function eventName(event: TelemetryEvent): string {
  throw new Error("TODO 1: implement eventName");
}

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// `./audit` exports nothing. It still has to run — a test asserts "audit" IS in
// `loaded`. There is exactly one import form that says "run this module, bind
// nothing", and this is the case it exists for.

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// `./formatter` gives you a type (`Format`) and a value (`formatEvent`) in one
// module. Bring in both with ONE import statement, marking the type inline —
// `import { value, type SomeType } from …` — so the emitted import keeps only
// the value.
//
//   render({ name: "click", at: 7 }, "short")  ->  "click"
//   render({ name: "click", at: 7 }, "long")   ->  "click @ 7"
//
// Then delete the placeholder below.
type Format = "short" | "long";

export function render(event: TelemetryEvent, format: Format): string {
  throw new Error("TODO 3: implement render");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// `./codec` exports a CLASS, which is a type and a value under one name. Import
// it as a value — `import type` would let the annotation below compile and then
// fail on `new`.
//
//   encode({ name: "click", at: 7 }, "|")  ->  "click|7"
//
// Write the body so the class is used in BOTH positions: annotate the local as
// `Codec`, and construct it with `new Codec(separator)`.
export function encode(event: TelemetryEvent, separator: string): string {
  throw new Error("TODO 4: implement encode");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// Re-export three things, so the test can reach them through this module:
//
//   * the type `TelemetryEvent` from "./telemetry"
//   * the type `Format` from "./formatter"
//   * the class `Codec` from "./codec"
//
// Two of those are types and one is a value, and under `verbatimModuleSyntax`
// the difference is not cosmetic: a plain `export { … } from "./telemetry"`
// emits a real re-export, which loads the module — and the "telemetry never
// runs" test would fail because of an EXPORT line.
