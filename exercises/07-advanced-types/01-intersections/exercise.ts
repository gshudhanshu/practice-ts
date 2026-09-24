/**
 * Exercise 07/01 — Intersection types
 *
 * A union is a CHOICE (`A | B`); an intersection is a COMBINATION (`A & B`).
 * The confusing part: an intersection has MORE properties but FEWER valid
 * values, and a union is the reverse.
 *
 * Read README.md first. Replace every TODO.
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

/** What the server sends: a numeric id. */
export type ApiUser = {
  id: number;
  name: string;
  email: string;
};

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// A store that can do all three things at once.
export type Store = Readable;

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// Implement it. `implements Store` must be satisfied by the class itself —
// an intersection works as an implements-clause just like an interface.
export class InMemoryStore {
  #data = new Map<string, string>();
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Copy one key across. Take the NARROWEST parameter types that still do the
// job — a reader that is only read from, a writer that is only written to.
// An InMemoryStore must be accepted for both.
//
// Return true if the key existed and was copied, false otherwise.
export function copyKey(
  source: Store,
  target: Store,
  key: string,
): boolean {
  throw new Error("TODO 3: implement copyKey");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// The client wants the same user but with `id` as a STRING.
//
// Do NOT retype the other fields. Remove the property you want to change and
// intersect a replacement back in — this "override one property" pattern is
// the single most useful thing intersections do in real code.
export type ClientUser = ApiUser;

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// Convert. Every other field passes through untouched.
export function toClientUser(apiUser: ApiUser): ClientUser {
  throw new Error("TODO 5: implement toClientUser");
}
