/**
 * Solution — 03/02 `noUncheckedIndexedAccess`
 */

export function at(values: readonly string[], index: number): string | undefined {
  const normalized = index < 0 ? values.length + index : index;
  // No guard needed: with the flag on, this expression is ALREADY
  // `string | undefined`, which is exactly the contract we advertise.
  // Out-of-range indexes (including a still-negative one) yield undefined.
  return values[normalized];
}

export function sumAll(values: readonly number[]): number {
  let total = 0;
  // `for...of` yields the ELEMENT type, never `T | undefined`. Iterating
  // instead of indexing is the simplest way to work with this flag.
  for (const value of values) {
    total += value;
  }
  return total;
}

export function tally(words: readonly string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const word of words) {
    // `counts[word]` is `number | undefined` on read; `?? 0` supplies the
    // seed for a key we have not seen. Writing is unaffected by the flag.
    counts[word] = (counts[word] ?? 0) + 1;
  }
  return counts;
}

export function zip(
  left: readonly string[],
  right: readonly number[],
): [string, number][] {
  const pairs: [string, number][] = [];
  const length = Math.min(left.length, right.length);

  for (let i = 0; i < length; i++) {
    const a = left[i];
    const b = right[i];
    // The compiler does not connect `i < length` to the element types, so it
    // still sees `string | undefined`. We know these are present; proving it
    // with an explicit check costs one line and keeps the code honest.
    if (a === undefined || b === undefined) continue;
    pairs.push([a, b]);
  }

  return pairs;
}

export function chunk(values: readonly number[], size: number): number[][] {
  if (size <= 0) return [];

  const chunks: number[][] = [];
  for (let i = 0; i < values.length; i += size) {
    // `.slice()` returns `number[]` — no indexed access, so no `| undefined`
    // to handle. Reaching for the right array method beats fighting the flag.
    chunks.push(values.slice(i, i + size));
  }
  return chunks;
}
