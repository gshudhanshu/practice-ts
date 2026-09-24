/**
 * Exercise 08/03 — Generic classes & interfaces
 *
 * A generic class parameterises its whole instance: `Stack<string>` and
 * `Stack<User>` are different types built from one definition.
 *
 * Read README.md first. Replace every TODO.
 */

/** Anything this exercise can store in a repository. */
export type Identifiable = { id: string };

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// A last-in-first-out stack of any element type.
//   push(item)  add to the top
//   pop()       remove and return the top, or undefined when empty
//   peek()      return the top WITHOUT removing it, or undefined
//   size        how many items
//   isEmpty     true when there are none
export class Stack {
  #items: unknown[] = [];
}

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// A generic interface. `T` must be constrained so `findById` can rely on
// items having an `id`.
//   add(item: T): void
//   findById(id: string): T | undefined
//   remove(id: string): boolean     true if something was removed
//   all(): readonly T[]             insertion order
export interface Repository {}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Implement it. The class needs its own type parameter, passed through to the
// interface — `implements Repository<T>`, not `implements Repository`.
export class InMemoryRepository {
  #items = new Map<string, unknown>();
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// A cache with TWO type parameters.
//   get(key)                     V | undefined
//   set(key, value)              void
//   has(key)                     boolean
//   size                         how many entries
//   getOrCompute(key, factory)   cached value, or compute-and-store it
//
// `getOrCompute` must call `factory` at most once per key — and must cache a
// falsy value (0, "") just as happily as a truthy one.
export class Cache {
  #entries = new Map<unknown, unknown>();
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// A function generic over a generic INTERFACE. It must work with any
// Repository implementation, not just the class above.
export function firstMatching(
  repository: unknown,
  predicate: (item: unknown) => boolean,
): unknown {
  throw new Error("TODO 5: implement firstMatching");
}
