/**
 * Exercise 03/01 — Living with `strictNullChecks`
 *
 * `strictNullChecks` is the single most valuable flag TypeScript has. Without
 * it, `null` and `undefined` are members of EVERY type and the compiler cannot
 * see a single null-dereference. With it, they must be handled explicitly.
 *
 * Read README.md first. Replace every TODO.
 */

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Return the length of the string, or 0 when it is null/undefined.
export function safeLength(value: string | null | undefined): number {
  throw new Error("TODO 1: implement safeLength");
}

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// Return the first value that is a non-empty string, or `undefined` if there
// is none. Blank/whitespace-only strings do not count.
export function firstNonEmpty(
  values: readonly (string | null | undefined)[],
): string | undefined {
  throw new Error("TODO 2: implement firstNonEmpty");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Drop every null and undefined, returning a plain string[].
//
// Do this with `.filter(...)` and NO type assertion. TypeScript 5.5+ infers a
// type predicate from a simple filter callback — you get `string[]` for free.
export function compact(
  values: readonly (string | null | undefined)[],
): string[] {
  throw new Error("TODO 3: implement compact");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Extract initials: "Ada Lovelace" -> "AL", "grace hopper" -> "GH".
// Return null when the input is null or has no usable words.
export function getInitials(fullName: string | null): string | null {
  throw new Error("TODO 4: implement getInitials");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// Deeply optional data. Return the city, or "unknown" if any link in the chain
// is missing. Use optional chaining and the nullish coalescing operator —
// no nested `if` pyramid, no `!`.
export type Person = {
  name: string;
  address?: {
    city?: string;
    postcode?: string;
  };
};

export function cityOf(person: Person | null | undefined): string {
  throw new Error("TODO 5: implement cityOf");
}
