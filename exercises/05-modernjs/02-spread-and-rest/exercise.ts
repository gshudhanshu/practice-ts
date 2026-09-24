/**
 * Exercise 05/02 — Spread & rest
 *
 * Spread is the backbone of immutable updates, which is how every modern state
 * library (Redux, Zustand, React state) expects you to work. The trap is that
 * spread is SHALLOW — half this exercise is about that.
 *
 * Read README.md first. Replace every TODO.
 */

export type User = {
  name: string;
  email: string;
  tags: readonly string[];
};

export type State = {
  user: {
    name: string;
    address: {
      city: string;
      country: string;
    };
  };
  version: number;
};

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Sum any number of arguments using a REST parameter.
//   sum()        -> 0
//   sum(1, 2, 3) -> 6
export function sum(): number {
  throw new Error("TODO 1: implement sum");
}

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// Merge any number of lists into one, dropping duplicates and keeping
// FIRST-SEEN order:
//   mergeUnique(["a","b"], ["b","c"], ["a"]) -> ["a","b","c"]
//   mergeUnique()                            -> []
export function mergeUnique(): string[] {
  throw new Error("TODO 2: implement mergeUnique");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Return a COPY of the user with a new name. The original must not change.
export function withName(user: User, name: string): User {
  throw new Error("TODO 3: implement withName");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// The largest value, or undefined for an empty list.
// Use Math.max with a spread — but mind what Math.max() returns with no
// arguments, which is why the empty case needs handling first.
export function maxOf(values: readonly number[]): number | undefined {
  throw new Error("TODO 4: implement maxOf");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// Immutably update the deeply-nested city, and bump `version` by 1.
//
// Every object ON THE PATH to the change must be a NEW object; the original
// state and all of its nested objects must be completely untouched.
// Spread is shallow, so one spread is not enough here.
export function updateCity(state: State, city: string): State {
  throw new Error("TODO 5: implement updateCity");
}
