/**
 * A module with a DEFAULT export plus a named one — the shape you meet in most
 * npm packages, and the one whose re-export rules trip people up.
 */

export const PRECISION = 2;

export default function formatLength(value: number, unit: string): string {
  return `${value.toFixed(PRECISION)}${unit}`;
}
