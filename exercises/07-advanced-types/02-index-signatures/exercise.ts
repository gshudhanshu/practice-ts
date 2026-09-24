/**
 * Exercise 07/02 — Index signatures & dynamic keys
 *
 * When you do not know the keys ahead of time. The three things worth learning:
 * how an index signature constrains the KNOWN properties alongside it, what
 * `keyof` does to one, and how `noUncheckedIndexedAccess` makes reading honest.
 *
 * Read README.md first. Replace every TODO.
 */

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// A translation catalogue: locale -> (message key -> text).
//   { en: { greeting: "Hello" }, fr: { greeting: "Bonjour" } }
//
// Both levels have unknown keys, so both need an index signature (or Record).
export type Translations = unknown;

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// Look up a message. Return `fallback` when the locale or the key is missing.
//
// Both lookups are `| undefined` under noUncheckedIndexedAccess — handle them,
// do not assert them away.
export function translate(
  translations: Translations,
  locale: string,
  key: string,
  fallback: string,
): string {
  throw new Error("TODO 2: implement translate");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// A config with ONE known property plus arbitrary extra entries:
//   - `name` is always a string
//   - any other key holds a string or a number
//
// Note the rule you are about to meet: every declared property must be
// assignable to the index signature's value type.
export type Config = {
  name: string;
};

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Flatten the catalogue into dotted keys:
//   { en: { greeting: "Hello" } }  ->  { "en.greeting": "Hello" }
export function flattenTranslations(
  translations: Translations,
): Record<string, string> {
  throw new Error("TODO 4: implement flattenTranslations");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// Drop every entry whose value is undefined, and CHANGE THE TYPE accordingly:
// the result must be `Record<string, string>`, with no `| undefined` left.
export function pickDefined(
  source: Record<string, string | undefined>,
): Record<string, string> {
  throw new Error("TODO 5: implement pickDefined");
}
