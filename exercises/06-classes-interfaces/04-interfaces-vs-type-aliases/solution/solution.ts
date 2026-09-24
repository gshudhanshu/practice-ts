/**
 * Solution — 06/04 Interfaces vs type aliases
 */

export interface Identified {
  id: string;
}

export interface Timestamped {
  createdAt: string;
  updatedAt: string;
}

// An interface can extend ANY NUMBER of others — comma-separated. The
// equivalent with type aliases is an intersection: `Identified & Timestamped &
// { name: string }`. Both work; `extends` gives better error messages, because
// the compiler checks compatibility at the declaration rather than deferring
// to every use site.
export interface Entity extends Identified, Timestamped {
  name: string;
}

// A union is not an object shape, so this CANNOT be an interface. Type aliases
// name any type at all; interfaces name object shapes only.
export type Id = string | number;

export interface AppConfig {
  apiUrl: string;
}

// DECLARATION MERGING: a second interface with the same name in the same scope
// is merged into the first, rather than being a redeclaration error. Only
// interfaces do this — a duplicate `type` alias is an error.
//
// This is the mechanism behind `declare global { interface Window { … } }` and
// most library augmentation.
export interface AppConfig {
  debug: boolean;
}

export interface Repository {
  add(entity: Entity): void;
  findById(id: string): Entity | undefined;
  // `readonly` in the contract: implementers may back this with a getter, and
  // consumers cannot assign to it.
  readonly size: number;
}

// `implements` is a CHECK, not inheritance: nothing is copied in, and the
// class must supply every member itself.
export class InMemoryRepository implements Repository {
  #entities = new Map<string, Entity>();

  add(entity: Entity): void {
    // Map.set replaces an existing key, which gives the "same id replaces"
    // behaviour for free.
    this.#entities.set(entity.id, entity);
  }

  findById(id: string): Entity | undefined {
    return this.#entities.get(id);
  }

  // A getter satisfies a `readonly` property in the interface.
  get size(): number {
    return this.#entities.size;
  }
}
