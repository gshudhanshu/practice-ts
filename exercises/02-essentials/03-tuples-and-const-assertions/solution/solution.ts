/**
 * Solution — 02/03 Tuples, `as const`, and unions instead of enums
 */

// Named tuple members are documentation the compiler shows you at every call
// site. They do not change the type — `[number, number]` is the same type —
// but hovering `parseCoordinate` now reads latitude/longitude instead of 0/1.
export type Coordinate = [latitude: number, longitude: number];

// `as const` does three things at once:
//   1. every element keeps its literal type ("debug", not string)
//   2. the array becomes a readonly tuple, so order and length are fixed
//   3. it can no longer be mutated
export const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;

// Indexing a tuple type with `number` yields the union of its element types.
// This is the "single source of truth" pattern: the value drives the type, so
// they can never drift apart.
export type LogLevel = (typeof LOG_LEVELS)[number];

export function parseCoordinate(input: string): Coordinate | null {
  const parts = input.split(",");
  if (parts.length !== 2) return null;

  // Under noUncheckedIndexedAccess these are `string | undefined`.
  const [rawLat, rawLon] = parts;
  if (rawLat === undefined || rawLon === undefined) return null;

  // Reject "", " " and "12.5," which Number() would happily turn into 0.
  if (rawLat.trim() === "" || rawLon.trim() === "") return null;

  const latitude = Number(rawLat);
  const longitude = Number(rawLon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  if (latitude < -90 || latitude > 90) return null;
  if (longitude < -180 || longitude > 180) return null;

  return [latitude, longitude];
}

export function formatCoordinate(coordinate: Coordinate): string {
  // Destructuring a *tuple* is safe even under noUncheckedIndexedAccess:
  // the compiler knows there are exactly two elements, so neither is
  // `| undefined`. That is the payoff for using a tuple over number[].
  const [latitude, longitude] = coordinate;
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}

// `value is LogLevel` makes this a *type predicate*: when it returns true, the
// compiler narrows the argument at the call site. A plain `boolean` return
// would tell the caller nothing.
export function isLogLevel(value: string): value is LogLevel {
  // `.includes(value)` will NOT compile here: LOG_LEVELS is a readonly tuple of
  // literals, so its `includes` only accepts LogLevel — the very thing we are
  // trying to prove. `.some` with `===` sidesteps that without a cast, because
  // comparing a literal to a string is legal whenever the types overlap.
  return LOG_LEVELS.some((level) => level === value);
}
