/**
 * A load recorder. Every other module in this directory calls `record` at the
 * top level, so `loaded` is a live list of which modules actually ran.
 *
 * That is the whole apparatus for this exercise: an import you can SEE the
 * effect of.
 */

export const loaded: string[] = [];

export function record(name: string): void {
  loaded.push(name);
}
