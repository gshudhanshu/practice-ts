/**
 * Exercise 09/03 — CHALLENGE: a validated table (practice project, part 3 of 3)
 *
 * The two halves together: a generic store (09/01) whose writes go through
 * composable validation (09/02). The validation types are given, so this
 * exercise stands alone.
 *
 * Read README.md first. Replace every TODO.
 */

export type Validator<T> = (value: T) => string | null;

export type ValidationError = {
  field: string;
  message: string;
};

export type FieldRule<T> = {
  field: string;
  check: (subject: T) => string | null;
};

export type Identifiable = { id: string };

/** Every write reports success or exactly why it failed. */
export type WriteResult =
  | { ok: true; id: string }
  | { ok: false; errors: readonly ValidationError[] };

export class Table<T extends Identifiable> {
  // ─── TODO 1 ────────────────────────────────────────────────────────────────
  // Storage and the read side.
  //   constructor(rules)   the rules every row must satisfy
  //   size                 how many rows
  //   findById(id)         the row, or undefined
  //   all()                every row, in insertion order

  // ─── TODO 2 ────────────────────────────────────────────────────────────────
  // Insert a row.
  //   - validate it against every rule; on failure return ALL the errors and
  //     store nothing
  //   - a duplicate id fails with
  //       { field: "id", message: "already exists" }
  //     and must be checked BEFORE the rules
  //   - on success store it and return { ok: true, id }
  insert(item: T): WriteResult {
    throw new Error("TODO 2: implement insert");
  }

  // ─── TODO 3 ────────────────────────────────────────────────────────────────
  // Patch an existing row. `id` cannot be changed — note the parameter type.
  //   - unknown id fails with { field: "id", message: "not found" }
  //   - merge the patch over the existing row and validate the RESULT
  //   - if the merged row is invalid, return the errors and leave the stored
  //     row completely untouched
  update(id: string, patch: Partial<Omit<T, "id">>): WriteResult {
    throw new Error("TODO 3: implement update");
  }

  // ─── TODO 4 ────────────────────────────────────────────────────────────────
  // Remove a row. Returns whether anything was removed.
  remove(id: string): boolean {
    throw new Error("TODO 4: implement remove");
  }

  // ─── TODO 5 ────────────────────────────────────────────────────────────────
  // Queries.
  //   where(predicate)  matching rows, in insertion order
  //   count(predicate)  how many match
  where(predicate: (row: T) => boolean): T[] {
    throw new Error("TODO 5: implement where");
  }

  count(predicate: (row: T) => boolean): number {
    throw new Error("TODO 5: implement count");
  }
}
