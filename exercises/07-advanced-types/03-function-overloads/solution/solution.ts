/**
 * Solution — 07/03 Function overloads
 */

export type Item = {
  id: string;
  name: string;
  priceCents: number;
};

// Two OVERLOAD SIGNATURES, then the implementation. Callers only ever see the
// two signatures; the implementation signature is not callable from outside.
export function makeRange(count: number): number[];
export function makeRange(start: number, end: number): number[];
export function makeRange(startOrCount: number, end?: number): number[] {
  // One argument means "count from 0"; two mean "start to end".
  const start = end === undefined ? 0 : startOrCount;
  const stop = end === undefined ? startOrCount : end;

  const values: number[] = [];
  for (let i = start; i < stop; i++) {
    values.push(i);
  }
  return values;
}

export function combine(a: string, b: string): string;
export function combine(a: readonly number[], b: readonly number[]): number[];
export function combine(
  a: string | readonly number[],
  b: string | readonly number[],
): string | number[] {
  if (typeof a === "string" && typeof b === "string") {
    return a + b;
  }
  if (typeof a !== "string" && typeof b !== "string") {
    // Both arrays. Spreading builds a new one, so the inputs are not mutated.
    return [...a, ...b];
  }
  // Unreachable through the public overloads — they never allow a mixed call.
  // The guard exists so the implementation needs no cast.
  throw new TypeError("combine requires two strings or two arrays");
}

// NO overloads: every input yields a string, so the return type does not depend
// on the argument type. A union parameter plus narrowing says it more clearly
// and in a third of the lines.
export function formatValue(value: string | number | boolean): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return value.toFixed(2);
  return value ? "yes" : "no";
}

export class ItemRepository {
  #items: Item[] = [];

  add(item: Item): void {
    this.#items.push(item);
  }

  get size(): number {
    return this.#items.length;
  }

  // Method overloads work exactly like function ones: signatures first,
  // implementation last.
  find(id: string): Item | undefined;
  find(predicate: (item: Item) => boolean): Item | undefined;
  find(idOrPredicate: string | ((item: Item) => boolean)): Item | undefined {
    // Narrow once, then delegate — both branches use the same `.find`.
    const predicate =
      typeof idOrPredicate === "string"
        ? (item: Item) => item.id === idOrPredicate
        : idOrPredicate;

    return this.#items.find(predicate);
  }
}

// Overload resolution picks the FIRST matching signature, so the most SPECIFIC
// one must come first. With the broad signature first, `describe("a")` would
// match it and report "mixed".
export function describe(value: string): "text";
export function describe(value: string | number): "mixed";
export function describe(value: string | number): "text" | "mixed" {
  return typeof value === "string" ? "text" : "mixed";
}
