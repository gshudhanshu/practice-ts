/**
 * Exercise 03/03 — `exactOptionalPropertyTypes`
 *
 * There is a difference between a property that is ABSENT and one that is
 * PRESENT WITH THE VALUE `undefined`:
 *
 *     const a = {};                 "x" in a -> false,  Object.keys(a) -> []
 *     const b = { x: undefined };   "x" in b -> true,   Object.keys(b) -> ["x"]
 *
 * By default TypeScript conflates the two. This flag keeps them apart, and this
 * exercise is about the class of bug that causes.
 *
 * Read README.md first. Replace every TODO.
 */

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// theme and fontSize are required; autoSave and language are optional.
// Optional here must mean genuinely absent — NOT "present and undefined".
export type Settings = {
  theme: "light" | "dark";
  fontSize: number;
};

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// A patch object: every field optional, and — unlike Settings — explicitly
// allowed to be present with the value `undefined`, because that is what a
// partially-filled form or a JSON body actually produces.
//
// Write the four properties out longhand.
export type SettingsPatch = Settings;

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Apply a patch on top of the base settings.
//
// A key whose patch value is `undefined` must be IGNORED, leaving the base
// value intact. The obvious one-liner `{ ...base, ...patch }` is wrong —
// work out why before you write anything.
export function mergeSettings(base: Settings, patch: SettingsPatch): Settings {
  throw new Error("TODO 3: implement mergeSettings");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Return a copy with `language` genuinely REMOVED — the key must not survive,
// not even set to undefined. One destructuring line does it.
export function withoutLanguage(settings: Settings): Settings {
  throw new Error("TODO 4: implement withoutLanguage");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// Has this optional setting been configured at all?
//
// "Configured" means the key is PRESENT. `autoSave: false` counts as
// configured — so a truthiness check is the wrong tool.
export function isConfigured(
  settings: Settings,
  key: "autoSave" | "language",
): boolean {
  throw new Error("TODO 5: implement isConfigured");
}
