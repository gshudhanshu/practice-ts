/**
 * Solution — 09/03 A validated table
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

export type WriteResult =
  | { ok: true; id: string }
  | { ok: false; errors: readonly ValidationError[] };

export class Table<T extends Identifiable> {
  #rows = new Map<string, T>();
  readonly #rules: readonly FieldRule<T>[];

  constructor(rules: readonly FieldRule<T>[]) {
    // Copy, so a caller mutating their array afterwards cannot change the
    // table's validation behaviour.
    this.#rules = [...rules];
  }

  get size(): number {
    return this.#rows.size;
  }

  findById(id: string): T | undefined {
    return this.#rows.get(id);
  }

  all(): readonly T[] {
    return [...this.#rows.values()];
  }

  /** Every rule that the candidate row fails, in rule order. */
  #validate(candidate: T): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const rule of this.#rules) {
      const message = rule.check(candidate);
      if (message !== null) {
        errors.push({ field: rule.field, message });
      }
    }

    return errors;
  }

  insert(item: T): WriteResult {
    // Identity before content: a duplicate id is a different kind of problem,
    // and reporting "already exists" alongside field errors would be noise.
    if (this.#rows.has(item.id)) {
      return {
        ok: false,
        errors: [{ field: "id", message: "already exists" }],
      };
    }

    const errors = this.#validate(item);
    if (errors.length > 0) return { ok: false, errors };

    this.#rows.set(item.id, item);
    return { ok: true, id: item.id };
  }

  update(id: string, patch: Partial<Omit<T, "id">>): WriteResult {
    const existing = this.#rows.get(id);
    if (existing === undefined) {
      return { ok: false, errors: [{ field: "id", message: "not found" }] };
    }

    // Build the candidate WITHOUT storing it. Validating the merged row rather
    // than the patch is what catches a change that is only invalid in context.
    const candidate: T = { ...existing, ...patch };

    const errors = this.#validate(candidate);
    // Rolling back is free because nothing was written yet — the "validate a
    // copy, then commit" shape avoids needing a rollback at all.
    if (errors.length > 0) return { ok: false, errors };

    // Re-setting an existing Map key keeps its original position, so insertion
    // order survives the update.
    this.#rows.set(id, candidate);
    return { ok: true, id };
  }

  remove(id: string): boolean {
    return this.#rows.delete(id);
  }

  where(predicate: (row: T) => boolean): T[] {
    return this.all().filter(predicate);
  }

  count(predicate: (row: T) => boolean): number {
    return this.where(predicate).length;
  }
}
