/**
 * Solution — 09/01 A typed collection
 */

export class Collection<T> {
  // `readonly` on the field plus a defensive copy in `from` means nothing can
  // reach in and change the contents after construction.
  readonly #items: readonly T[];

  // Private constructor + static factory (06/02): every Collection is built
  // through a named entry point, and internals stay internal.
  private constructor(items: readonly T[]) {
    this.#items = items;
  }

  static from<T>(items: readonly T[]): Collection<T> {
    // Copy: otherwise a later `source.push(…)` would mutate this collection,
    // which one of the tests checks.
    return new Collection([...items]);
  }

  toArray(): T[] {
    // A fresh array each call, so callers cannot mutate our storage.
    return [...this.#items];
  }

  get size(): number {
    return this.#items.length;
  }

  filter(predicate: (item: T) => boolean): Collection<T> {
    return new Collection(this.#items.filter(predicate));
  }

  // `U` is declared on the METHOD, not the class — each call picks its own
  // result type, and the returned Collection is parameterised by it.
  map<U>(transform: (item: T) => U): Collection<U> {
    return new Collection(this.#items.map(transform));
  }

  sort(compare: (a: T, b: T) => number): Collection<T> {
    // `.sort` mutates, so copy first — twice over, since `#items` is shared
    // with nothing but is typed readonly.
    return new Collection([...this.#items].sort(compare));
  }

  take(count: number): Collection<T> {
    // `.slice` handles both edges: a negative count would slice from the end,
    // so clamp it to 0 first.
    return new Collection(this.#items.slice(0, Math.max(count, 0)));
  }

  first(): T | undefined {
    return this.#items[0];
  }

  reduce<U>(fold: (accumulator: U, item: T) => U, seed: U): U {
    return this.#items.reduce(fold, seed);
  }
}
