/**
 * Solution — 14/02 `import type` and `verbatimModuleSyntax`
 */

// Type-only. The whole statement is erased, so ./telemetry is never fetched and
// never evaluated — which is exactly what the "telemetry does not load" test
// checks. Under `verbatimModuleSyntax` this is also the ONLY legal form:
// omitting `type` is error TS1484, because the emitted import would ask for a
// runtime binding that does not exist.
import type { TelemetryEvent } from "./telemetry";

// A bare side-effect import: run the module, bind nothing. It is the only form
// that survives when a module has no exports to hold onto.
import "./audit";

// Mixed. The inline `type` modifier marks one specifier, so the emitted import
// keeps `formatEvent` and drops `Format` — one statement, no duplication.
import { formatEvent, type Format } from "./formatter";

// A value import, because a class is a type AND a value. `import type { Codec }`
// would compile the annotation below and then fail on `new Codec(…)`.
import { Codec } from "./codec";

export function eventName(event: TelemetryEvent): string {
  return event.name;
}

export function render(event: TelemetryEvent, format: Format): string {
  return formatEvent(event.name, event.at, format);
}

export function encode(event: TelemetryEvent, separator: string): string {
  // `Codec` in type position and value position, from one import.
  const codec: Codec = new Codec(separator);
  return codec.encode([event.name, String(event.at)]);
}

// Type-only re-exports. Written as plain `export { … } from`, these would emit
// real re-export statements and load ./telemetry — an export line causing a
// module to run is the same elision bug from the other direction.
export type { TelemetryEvent } from "./telemetry";
export type { Format } from "./formatter";

// A value re-export, because `Codec` really is a runtime binding.
export { Codec } from "./codec";
