/**
 * Exercise 10/06 — CHALLENGE: typed deep paths
 *
 * The Phase 2 finale. Everything from section 10 at once: mapped types,
 * indexed access, conditional types, `infer`, template literals and recursion —
 * used to build the type behind `lodash.get`.
 *
 * NOTE: like 08/05, ONE `as` is permitted here, and only at the return of
 * `getPath`. See the README.
 *
 * Read README.md first. Replace every TODO.
 */

export type AppState = {
  count: number;
  darkMode: boolean;
  user: {
    name: string;
    email: string;
    address: {
      city: string;
    };
  };
};

/** Given — the guard from 07/05. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Derive a DISCRIMINATED UNION from a type's properties:
//
//   ChangeEvent<AppState>
//     | { key: "count";    value: number }
//     | { key: "darkMode"; value: boolean }
//     | { key: "user";     value: { name: string; … } }
//
// The idiom: build a mapped type whose VALUES are the union members, then
// index it with `keyof T` to collapse it into a union.
export type ChangeEvent<T> = unknown;

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// Every dotted path into a type, at any depth:
//
//   Paths<AppState>
//     "count" | "darkMode" | "user" | "user.name" | "user.email"
//     | "user.address" | "user.address.city"
//
// A nested object contributes BOTH its own key and every path beneath it.
export type Paths<T> = unknown;

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// The type sitting at a dotted path:
//
//   ValueAt<AppState, "count">             ->  number
//   ValueAt<AppState, "user.name">         ->  string
//   ValueAt<AppState, "user.address">      ->  { city: string }
//   ValueAt<AppState, "user.address.city"> ->  string
//
// Split on the first "." with a template literal pattern, then recurse.
export type ValueAt<T, P extends string> = unknown;

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Read a value by dotted path. An unknown path must be a COMPILE error.
//
// The return type is a deferred conditional (10/04), so the compiler cannot
// verify the final value against it — this is where the one permitted `as`
// goes. Everything before it should be properly narrowed with `isRecord`.
export function getPath(subject: unknown, path: unknown): unknown {
  throw new Error("TODO 4: implement getPath");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// Describe a change event. Handle every case exhaustively:
//
//   { key: "count",    value: 5 }        ->  "count -> 5"
//   { key: "darkMode", value: true }     ->  "darkMode -> true"
//   { key: "user",     value: { name: "Ada", … } }  ->  "user -> Ada"
export function describeChange(event: ChangeEvent<AppState>): string {
  throw new Error("TODO 5: implement describeChange");
}
