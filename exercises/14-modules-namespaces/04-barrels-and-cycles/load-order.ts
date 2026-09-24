/**
 * A leaf module with no imports of its own, so it can never take part in a
 * cycle. Every other module here records itself as it is evaluated, which makes
 * the evaluation order visible instead of something you have to reason about.
 */

export const loadOrder: string[] = [];

export function record(name: string): void {
  loadOrder.push(name);
}
