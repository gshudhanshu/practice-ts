/**
 * Exercise 09/01 — A typed collection (practice project, part 1 of 3)
 *
 * Section 09 is one small project across three exercises, combining the
 * classes from section 06 with the generics from section 08:
 *
 *   09/01  Collection<T>   — a chainable, immutable wrapper around an array
 *   09/02  Validator<T>    — composable field validation
 *   09/03  Table<T>        — the two together
 *
 * The interesting method is `map`, which must return a Collection of a
 * DIFFERENT element type.
 *
 * Read README.md first. Replace every TODO.
 */

export class Collection<T> {
  // ─── TODO 1 ────────────────────────────────────────────────────────────────
  // Storage, a PRIVATE constructor, and the entry point.
  //
  //   Collection.from([1, 2, 3])   the only way to build one
  //   toArray()                    a fresh mutable copy
  //   size                         how many items
  //
  // Every method must be non-mutating: operations return a NEW Collection and
  // leave the original untouched.

  // ─── TODO 2 ────────────────────────────────────────────────────────────────
  // Keep the items the predicate accepts, in order.
  filter(predicate: (item: T) => boolean): Collection<T> {
    throw new Error("TODO 2: implement filter");
  }

  // ─── TODO 3 ────────────────────────────────────────────────────────────────
  // Transform every item — note the NEW type parameter, and that the result is
  // a Collection<U>, not a Collection<T>:
  //   Collection.from([1, 2]).map((n) => String(n))   ->   Collection<string>
  map<U>(transform: (item: T) => U): Collection<U> {
    throw new Error("TODO 3: implement map");
  }

  // ─── TODO 4 ────────────────────────────────────────────────────────────────
  // sort   -> a new Collection ordered by the comparator. Must not mutate.
  // take   -> the first `count` items; a count <= 0 gives an empty Collection,
  //           and a count past the end is harmless.
  sort(compare: (a: T, b: T) => number): Collection<T> {
    throw new Error("TODO 4: implement sort");
  }

  take(count: number): Collection<T> {
    throw new Error("TODO 4: implement take");
  }

  // ─── TODO 5 ────────────────────────────────────────────────────────────────
  // first   -> the first item, or undefined
  // reduce  -> fold into a single value of any type (another new parameter)
  first(): T | undefined {
    throw new Error("TODO 5: implement first");
  }

  reduce<U>(fold: (accumulator: U, item: T) => U, seed: U): U {
    throw new Error("TODO 5: implement reduce");
  }
}
