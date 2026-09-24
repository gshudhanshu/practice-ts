/**
 * Solution — 07/02 Index signatures & dynamic keys
 */

// `Record<K, V>` is the mapped-type form; `{ [locale: string]: … }` is the
// index-signature form. For an open string key they produce the same type —
// the test asserts exactly that.
export type Translations = Record<string, Record<string, string>>;

export function translate(
  translations: Translations,
  locale: string,
  key: string,
  fallback: string,
): string {
  // Under noUncheckedIndexedAccess this is `Record<string,string> | undefined`.
  const messages = translations[locale];
  if (messages === undefined) return fallback;

  const message = messages[key];
  // `=== undefined`, not truthiness — a stored "" is a real translation.
  return message === undefined ? fallback : message;
}

export type Config = {
  name: string;
  // Every DECLARED property must be assignable to the index signature's value
  // type. `name: string` is fine because `string` is part of the union; a
  // `debug: boolean` property would not compile.
  [key: string]: string | number;
};

export function flattenTranslations(
  translations: Translations,
): Record<string, string> {
  const flat: Record<string, string> = {};

  // Object.entries gives [string, V] pairs and, unlike a for-in loop, does not
  // walk the prototype chain.
  for (const [locale, messages] of Object.entries(translations)) {
    for (const [key, text] of Object.entries(messages)) {
      flat[`${locale}.${key}`] = text;
    }
  }

  return flat;
}

export function pickDefined(
  source: Record<string, string | undefined>,
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(source)) {
    // The narrowing is what changes the type: inside this branch `value` is
    // `string`, so it is assignable to the narrower result record.
    if (value !== undefined) {
      result[key] = value;
    }
  }

  return result;
}
