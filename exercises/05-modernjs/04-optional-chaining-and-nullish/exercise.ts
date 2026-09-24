/**
 * Exercise 05/04 — Optional chaining & the nullish operators
 *
 * `?.` `??` and `??=` replace whole paragraphs of defensive code. The catch is
 * knowing when `??` is right and when `||` is right — they are not
 * interchangeable, and BOTH appear in this exercise.
 *
 * Read README.md first. Replace every TODO.
 */

export type ApiResponse = {
  data?: {
    items?: { id: string; label?: string }[];
  };
  meta?: {
    total?: number;
  };
};

export type Account = {
  username: string;
  /** A user who clears their nickname sends "" — that means "no nickname". */
  nickname?: string;
};

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// The label of the first item, or "none" if any link in the chain is missing.
//   { data: { items: [{ id: "1", label: "First" }] } } -> "First"
//   { data: { items: [] } }                            -> "none"
//   {}                                                 -> "none"
//
// One expression. Optional chaining works on property access AND on indexing.
export function firstLabel(response: ApiResponse): string {
  throw new Error("TODO 1: implement firstLabel");
}

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// The total, defaulting to 0 when absent.
// A REAL total of 0 must be reported as 0, not replaced by the default.
export function totalOf(response: ApiResponse): number {
  throw new Error("TODO 2: implement totalOf");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Call the callback if there is one and return its result; otherwise -1.
// Use an OPTIONAL CALL rather than an `if`.
export function callSafely(fn?: () => number): number {
  throw new Error("TODO 3: implement callSafely");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Increment a visit counter, initialising it to 0 the first time.
//   const v = {}; bumpVisit(v) -> 1; bumpVisit(v) -> 2
//
// Use the LOGICAL NULLISH ASSIGNMENT operator for the initialisation step.
// Mutating the argument is intended here.
export function bumpVisit(visits: { count?: number }): number {
  throw new Error("TODO 4: implement bumpVisit");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// The name to show for an account.
//
// A nickname of "" means the user deliberately cleared it, so it must fall back
// to the username — same as an absent nickname.
//
// Read that requirement carefully. `??` is the WRONG operator here.
export function displayName(account: Account): string {
  throw new Error("TODO 5: implement displayName");
}
