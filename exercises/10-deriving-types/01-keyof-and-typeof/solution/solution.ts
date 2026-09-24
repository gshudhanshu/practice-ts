/**
 * Solution — 10/01 `keyof` and `typeof`
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

// `typeof` in TYPE position is the type-query operator: it reads the type the
// compiler inferred for a VALUE. Adding a field to DEFAULT_CONFIG updates this
// automatically — one source of truth instead of two.
export type Config = typeof DEFAULT_CONFIG;

// `keyof` turns an object type into the union of its keys.
export type ConfigKey = keyof Config;

// `as const` gives a readonly tuple of literals; indexing the TYPE with
// `number` collapses it to the union of its elements (02/03).
export type Role = (typeof ROLES)[number];

// The two operators compose: read the object's type, then take its keys.
export type EventName = keyof typeof EVENT_HANDLERS;

// Indexed access on a type query — the exact type of one property.
export type ClickHandler = (typeof EVENT_HANDLERS)["click"];

export function isConfigKey(value: string): value is ConfigKey {
  // `Object.hasOwn` (ES2022), NOT `value in DEFAULT_CONFIG`: `in` walks the
  // prototype chain, so "toString" would wrongly pass — which the test checks.
  return Object.hasOwn(DEFAULT_CONFIG, value);
}

export function configKeys(): ConfigKey[] {
  // `Object.keys` is deliberately typed `string[]`, because an object may carry
  // extra properties at runtime. Filtering with the type PREDICATE narrows
  // `string[]` to `ConfigKey[]` — no cast needed.
  return Object.keys(DEFAULT_CONFIG).filter(isConfigKey);
}
