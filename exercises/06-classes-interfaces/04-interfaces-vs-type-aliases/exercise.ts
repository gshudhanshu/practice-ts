/**
 * Exercise 06/04 — Interfaces vs type aliases
 *
 * They overlap enough that "which should I use?" is a real question, and a
 * standard interview one. This exercise walks through the cases where the
 * answer is forced, in both directions.
 *
 * Read README.md first. Replace every TODO.
 */

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Two small INTERFACES:
//   Identified   -> id: string
//   Timestamped  -> createdAt: string, updatedAt: string
export interface Identified {}

export interface Timestamped {}

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// An interface that extends BOTH of the above and adds `name: string`.
// One interface can extend any number of others — note the syntax.
export interface Entity {}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// An id may be a string or a number.
//
// This one CANNOT be an interface: interfaces describe object shapes only,
// so a union has to be a type alias.
export type Id = string;

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// DECLARATION MERGING — a thing only interfaces can do.
//
// Below is an existing config interface you must not edit. Add a SECOND
// `AppConfig` interface declaration that contributes `debug: boolean`.
// TypeScript merges same-named interfaces in the same scope into one type.
//
// This is how you augment types from libraries you do not control.
export interface AppConfig {
  apiUrl: string;
}

// (add your second declaration here)

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// An interface used as a CONTRACT for a class, and a class that implements it.
//
// Repository:
//   add(entity: Entity): void
//   findById(id: string): Entity | undefined
//   readonly size: number
//
// Then finish InMemoryRepository so that it satisfies the contract.
// `implements` checks the shape; it does not inherit anything.
export interface Repository {}

export class InMemoryRepository {
  #entities = new Map<string, Entity>();
}
