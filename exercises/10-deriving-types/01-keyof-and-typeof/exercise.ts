/**
 * Exercise 10/01 — `keyof` and `typeof`
 *
 * Section 10 is about DERIVING types instead of writing them twice. The rule
 * behind all of it: if a type and a value describe the same thing, derive one
 * from the other so they cannot drift apart.
 *
 * `typeof` in TYPE position is the type-query operator — unrelated to the
 * runtime `typeof` you use for narrowing.
 *
 * Read README.md first. Replace every TODO.
 */

export const DEFAULT_CONFIG = {
  host: "localhost",
  port: 3000,
  secure: false,
};

export const ROLES = ["admin", "editor", "viewer"] as const;

export const EVENT_HANDLERS = {
  click: (x: number, y: number) => `${x},${y}`,
  key: (code: string) => code.toUpperCase(),
};

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Derive the config's shape from the VALUE, so adding a field to
// DEFAULT_CONFIG updates the type automatically.
//   { host: string; port: number; secure: boolean }
export type Config = unknown;

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// The union of Config's keys: "host" | "port" | "secure"
export type ConfigKey = unknown;

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// The union of the ROLES entries: "admin" | "editor" | "viewer"
// (the 02/03 pattern — index the tuple TYPE with `number`)
export type Role = unknown;

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Two derivations from EVENT_HANDLERS:
//   EventName    -> "click" | "key"
//   ClickHandler -> the exact type of the `click` function
export type EventName = unknown;
export type ClickHandler = unknown;

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// The runtime bridge. `Object.keys` is deliberately typed as returning
// `string[]`, so it will not give you ConfigKey[] on its own.
//
//   configKeys()             -> every key of DEFAULT_CONFIG, typed ConfigKey[]
//   isConfigKey("host")      -> true, and narrows to ConfigKey
//   isConfigKey("nope")      -> false
//
// Build the guard first, then use it to make `configKeys` type-safe with no
// cast anywhere.
export function isConfigKey(value: string): boolean {
  throw new Error("TODO 5: implement isConfigKey");
}

export function configKeys(): unknown[] {
  throw new Error("TODO 5: implement configKeys");
}
