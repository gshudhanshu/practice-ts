/**
 * Solution — 08/01 Generic functions
 */

// `T` appears in the parameter AND the return type — it RELATES them. That is
// what a type parameter is for. Callers never write identity<string>(…),
// because inference fills T in from the argument.
export function identity<T>(value: T): T {
  return value;
}

// T relates the element type of the input to the return type.
// `readonly T[]` accepts both mutable and readonly arrays (02/02).
export function first<T>(items: readonly T[]): T | undefined {
  return items[0];
}

// Two INDEPENDENT type parameters. One would force both arguments to the same
// type, or widen them to a shared supertype.
export function pair<A, B>(a: A, b: B): [A, B] {
  return [a, b];
}

export function partition<T>(
  items: readonly T[],
  predicate: (item: T) => boolean,
): [T[], T[]] {
  const matching: T[] = [];
  const rest: T[] = [];

  for (const item of items) {
    // A single pass, and order is preserved in both halves.
    if (predicate(item)) {
      matching.push(item);
    } else {
      rest.push(item);
    }
  }

  return [matching, rest];
}

// No type parameter. `T` appeared exactly once in the original signature, so it
// related nothing — it was a constraint wearing a generic's clothes.
//
// The honest version says precisely what it needs: a list of things that have
// a length. It also stops accepting a bare string (which has a `length` and
// would have satisfied the old `T`).
export function totalLength(items: readonly { length: number }[]): number {
  let total = 0;
  for (const item of items) total += item.length;
  return total;
}
