import { record } from "./registry";

// If this module is ever evaluated, "telemetry" shows up in the registry.
record("telemetry");

/** The only export is a TYPE. There is nothing here to use at runtime. */
export type TelemetryEvent = {
  name: string;
  at: number;
};
