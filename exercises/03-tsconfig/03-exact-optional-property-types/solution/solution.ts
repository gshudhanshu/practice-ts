/**
 * Solution — 03/03 `exactOptionalPropertyTypes`
 */

export type Settings = {
  theme: "light" | "dark";
  fontSize: number;
  // Optional AND exact: under this flag these keys may be absent, but may not
  // be present holding `undefined`.
  autoSave?: boolean;
  language?: string;
};

// The patch type deliberately opts BACK IN to explicit undefined by writing
// `| undefined` alongside the `?`. That models reality: a partially-filled
// form, a JSON body, or `{ ...defaults, ...userInput }` all produce keys whose
// value is undefined.
export type SettingsPatch = {
  theme?: "light" | "dark" | undefined;
  fontSize?: number | undefined;
  autoSave?: boolean | undefined;
  language?: string | undefined;
};

export function mergeSettings(base: Settings, patch: SettingsPatch): Settings {
  // Why `{ ...base, ...patch }` is wrong:
  // spreading copies EVERY own key, including ones holding undefined. So
  // `{ fontSize: 12 }` spread with `{ fontSize: undefined }` yields
  // `{ fontSize: undefined }` — the patch erases the default instead of
  // deferring to it. Under this flag the compiler also rejects the result.
  const merged: Settings = { ...base };

  if (patch.theme !== undefined) merged.theme = patch.theme;
  if (patch.fontSize !== undefined) merged.fontSize = patch.fontSize;
  if (patch.autoSave !== undefined) merged.autoSave = patch.autoSave;
  if (patch.language !== undefined) merged.language = patch.language;

  return merged;
}

export function withoutLanguage(settings: Settings): Settings {
  // Rest destructuring builds a new object WITHOUT the pulled-out key — the
  // key is genuinely absent, not set to undefined. `delete` would also work
  // but mutates, and is slower in most engines.
  const { language: _removed, ...rest } = settings;
  return rest;
}

export function isConfigured(
  settings: Settings,
  key: "autoSave" | "language",
): boolean {
  // `in` asks whether the KEY exists, regardless of its value.
  // `settings[key] !== undefined` would agree here, but a truthiness check
  // (`!!settings[key]`) would wrongly report `autoSave: false` as unconfigured.
  return key in settings;
}
