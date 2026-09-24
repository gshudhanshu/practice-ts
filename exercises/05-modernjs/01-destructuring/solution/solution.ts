/**
 * Solution — 05/01 Destructuring & default values
 */

export type User = {
  name: string;
  title?: string;
  address?: {
    city?: string;
    country?: string;
  };
};

// Destructuring in the parameter list, with the default inside the pattern.
// `title` is `string` in the body — the default has removed `undefined`.
export function greet({ name, title = "friend" }: User): string {
  return `Hello, ${title} ${name}`;
}

export function swap(pair: [string, number]): [number, string] {
  // Tuple destructuring gives exact element types: `text` is string,
  // `value` is number, neither is `| undefined`.
  const [text, value] = pair;
  return [value, text];
}

export function headAndRest(values: readonly string[]): {
  first: string | undefined;
  rest: string[];
} {
  // A rest element in array destructuring collects the remainder into a NEW
  // array — `rest` is `string[]`, and is `[]` when there is nothing left.
  // `first` is `string | undefined` because this is an array, not a tuple.
  const [first, ...rest] = values;
  return { first, rest };
}

export function toCoordinateLabel({
  x: longitude,
  y: latitude,
}: {
  x: number;
  y: number;
}): string {
  // `x: longitude` means "read property x, bind it to a local called
  // longitude". It is NOT a type annotation, which is the usual confusion.
  return `lat ${latitude}, lon ${longitude}`;
}

export function locationOf({
  // The whole `address` object may be absent, so it gets its own default of
  // `{}` — that empty object is then destructured, and its own members fall
  // back to their defaults in turn.
  address: { city = "unknown", country = "unknown" } = {},
}: User): string {
  return `${city}, ${country}`;
}
