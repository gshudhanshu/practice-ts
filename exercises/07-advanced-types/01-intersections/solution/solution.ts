/**
 * Solution — 07/01 Intersection types
 */

export type Readable = {
  read(key: string): string | undefined;
};

export type Writable = {
  write(key: string, value: string): void;
};

export type Clearable = {
  clear(): void;
};

export type ApiUser = {
  id: number;
  name: string;
  email: string;
};

// `&` combines capabilities. A Store must satisfy ALL THREE contracts, so
// `keyof Store` is the union of all their keys.
export type Store = Readable & Writable & Clearable;

// An intersection works in an `implements` clause exactly like an interface.
export class InMemoryStore implements Store {
  #data = new Map<string, string>();

  read(key: string): string | undefined {
    return this.#data.get(key);
  }

  write(key: string, value: string): void {
    this.#data.set(key, value);
  }

  clear(): void {
    this.#data.clear();
  }
}

export function copyKey(source: Store, target: Store, key: string): boolean {
  const value = source.read(key);

  // Compare against undefined, not truthiness — "" is a real value that must
  // still be copied, which the test pins down.
  if (value === undefined) return false;

  target.write(key, value);
  return true;
}

// The override pattern: remove the property, intersect a replacement back in.
// `name` and `email` are never restated, so adding a field to ApiUser flows
// through automatically.
export type ClientUser = Omit<ApiUser, "id"> & { id: string };

export function toClientUser(apiUser: ApiUser): ClientUser {
  // Spread everything, then override — order matters (05/02).
  return { ...apiUser, id: String(apiUser.id) };
}
