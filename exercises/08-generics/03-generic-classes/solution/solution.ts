/**
 * Solution — 08/03 Generic classes & interfaces
 */

export type Identifiable = { id: string };

// The type parameter belongs to the CLASS, so every member can use it.
// `Stack<string>` and `Stack<User>` are distinct types from one definition.
export class Stack<T> {
  #items: T[] = [];

  push(item: T): void {
    this.#items.push(item);
  }

  pop(): T | undefined {
    // Array.prototype.pop already returns `T | undefined` — the honest type.
    return this.#items.pop();
  }

  peek(): T | undefined {
    return this.#items[this.#items.length - 1];
  }

  get size(): number {
    return this.#items.length;
  }

  get isEmpty(): boolean {
    return this.#items.length === 0;
  }
}

// The constraint is what lets `add` read `item.id`. Without it, `T` could be
// anything and the interface could not describe an id-based lookup.
export interface Repository<T extends Identifiable> {
  add(item: T): void;
  findById(id: string): T | undefined;
  remove(id: string): boolean;
  all(): readonly T[];
}

// The class declares its own `T` and passes it through. The constraint must be
// repeated — it is not inherited from the interface.
export class InMemoryRepository<T extends Identifiable>
  implements Repository<T>
{
  // Map keeps insertion order, and re-setting an existing key keeps its
  // original position — which gives "replace in place" for free (06/06).
  #items = new Map<string, T>();

  add(item: T): void {
    this.#items.set(item.id, item);
  }

  findById(id: string): T | undefined {
    return this.#items.get(id);
  }

  remove(id: string): boolean {
    // Map.delete already reports whether anything was there.
    return this.#items.delete(id);
  }

  all(): readonly T[] {
    return [...this.#items.values()];
  }
}

// Two independent parameters. `K` is unconstrained because a Map can key on
// anything, including objects — which the test checks.
export class Cache<K, V> {
  #entries = new Map<K, V>();

  get(key: K): V | undefined {
    return this.#entries.get(key);
  }

  set(key: K, value: V): void {
    this.#entries.set(key, value);
  }

  has(key: K): boolean {
    return this.#entries.has(key);
  }

  get size(): number {
    return this.#entries.size;
  }

  getOrCompute(key: K, factory: () => V): V {
    // `.has` rather than `.get() === undefined`: a cached `0`, `""` or even a
    // stored `undefined` must count as present, so the factory runs once.
    if (this.#entries.has(key)) {
      const cached = this.#entries.get(key);
      // `.get` cannot narrow from `.has`, so handle the (impossible) miss.
      if (cached !== undefined) return cached;
    }

    const value = factory();
    this.#entries.set(key, value);
    return value;
  }
}

// Generic over the INTERFACE, so it accepts any implementation — including the
// plain-object fake in the test.
export function firstMatching<T extends Identifiable>(
  repository: Repository<T>,
  predicate: (item: T) => boolean,
): T | undefined {
  return repository.all().find(predicate);
}
