import { record } from "./registry";

record("formatter");

/** A type and a value from the same module — the mixed-import case. */
export type Format = "short" | "long";

export function formatEvent(name: string, at: number, format: Format): string {
  return format === "short" ? name : `${name} @ ${at}`;
}
