/**
 * Solution — 03/01 Living with `strictNullChecks`
 */

export function safeLength(value: string | null | undefined): number {
  // `?.` yields undefined for BOTH null and undefined, and `??` supplies the
  // fallback. Two operators replace a four-line guard.
  return value?.length ?? 0;
}

export function firstNonEmpty(
  values: readonly (string | null | undefined)[],
): string | undefined {
  for (const value of values) {
    // Truthiness alone would let "   " through, so trim as well.
    if (value != null && value.trim() !== "") {
      return value;
    }
  }
  return undefined;
}

export function compact(
  values: readonly (string | null | undefined)[],
): string[] {
  // `!= null` (loose) excludes null AND undefined in one check — the one place
  // where `==`/`!=` is idiomatic rather than sloppy.
  //
  // Since TypeScript 5.5 the compiler INFERS the type predicate
  // `(v) => v is string` from this callback, so the result is `string[]` with
  // no assertion. Before 5.5 you needed an explicit predicate here.
  return values.filter((value) => value != null);
}

export function getInitials(fullName: string | null): string | null {
  if (fullName === null) return null;

  const words = fullName.trim().split(/\s+/).filter((word) => word !== "");
  if (words.length === 0) return null;

  return words
    // `word[0]` is `string | undefined` under noUncheckedIndexedAccess, but
    // every word here is non-empty, so `?? ""` documents that safely.
    .map((word) => (word[0] ?? "").toUpperCase())
    .join("");
}

export type Person = {
  name: string;
  address?: {
    city?: string;
    postcode?: string;
  };
};

export function cityOf(person: Person | null | undefined): string {
  // The whole chain short-circuits to `undefined` the moment any link is
  // nullish; `??` then supplies the default. No nesting, no `!`.
  return person?.address?.city ?? "unknown";
}
