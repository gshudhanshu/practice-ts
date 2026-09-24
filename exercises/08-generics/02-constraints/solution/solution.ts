/**
 * Solution — 08/02 Generic constraints
 */

export type Comparable = string | number;

// `K extends keyof T` is the workhorse pattern: the key is checked against the
// object, and `T[K]` makes the return type follow the key that was passed.
export function pluck<T, K extends keyof T>(item: T, key: K): T[K] {
  return item[key];
}

export function pluckAll<T, K extends keyof T>(
  items: readonly T[],
  key: K,
): T[K][] {
  return items.map((item) => item[key]);
}

// The constraint reads: "T is an object that has a property named K whose value
// is Comparable". Writing it this way round — constraining T via Record<K, …>
// rather than constraining T[K] — is what makes `sortByKey(users, "tags")` a
// compile error.
export function sortByKey<K extends PropertyKey, T extends Record<K, Comparable>>(
  items: readonly T[],
  key: K,
): T[] {
  // Copy first: `.sort` mutates, and the input is `readonly` by contract.
  // Array.prototype.sort has been stable since ES2019, so equal keys keep
  // their original order for free.
  return [...items].sort((left, right) => {
    const a = left[key];
    const b = right[key];

    // Numbers must compare numerically; String(10) < String(9) is true.
    if (typeof a === "number" && typeof b === "number") return a - b;

    const as = String(a);
    const bs = String(b);
    if (as < bs) return -1;
    if (as > bs) return 1;
    return 0;
  });
}

// Here the "constraint" arrives as a function. More flexible than constraining
// T itself: the caller can score anything however they like, and T stays free.
export function maxBy<T>(
  items: readonly T[],
  score: (item: T) => number,
): T | undefined {
  let best: T | undefined = undefined;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const item of items) {
    const current = score(item);
    // Strictly greater keeps the FIRST of any tie.
    if (best === undefined || current > bestScore) {
      best = item;
      bestScore = current;
    }
  }

  return best;
}

// `extends object` rules out primitives, which cannot be spread meaningfully.
// Returning `A & B` keeps both halves visible to the caller.
export function merge<A extends object, B extends object>(a: A, b: B): A & B {
  return { ...a, ...b };
}
