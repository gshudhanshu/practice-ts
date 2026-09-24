/**
 * Solution — 21/06 A mini parser
 */

/** What a parsed query value can be. */
export type QueryValue = string | number | boolean;

// Re-mapping every key onto itself rebuilds an intersection as one flat object.
// Nothing about the type changes semantically — but tooltips become readable
// and `Equal<Prettify<A & B>, { … }>` starts passing.
export type Prettify<T> = { [K in keyof T]: T[K] };

// Booleans first: "true" matches the string branch too, and the first matching
// branch wins.
//
// `infer N extends number` (TS 4.8+) converts the captured string to a numeric
// literal. Without the `extends number` you would get the string back.
export type ParseValue<S extends string> = S extends "true"
  ? true
  : S extends "false"
    ? false
    : S extends `${infer N extends number}`
      ? N
      : S;

// `{ [P in K]: … }` builds an object from a string key — a string literal type
// is a union of one member, so mapping over it works exactly as it would over
// a larger union.
export type ParsePair<S extends string> = S extends `${infer K}=${infer V}`
  ? { [P in K]: ParseValue<V> }
  : S extends ""
    ? {}
    : // No "=", so it is a bare flag.
      { [P in S]: true };

// Split on "&" and intersect the pieces. Intersection is how an object type is
// accumulated; `Prettify` at the top flattens the pile back into one object.
type ParsePairs<S extends string> = S extends `${infer Head}&${infer Rest}`
  ? ParsePair<Head> & ParsePairs<Rest>
  : ParsePair<S>;

// `string extends S` is true only when S is the wide `string` type — a literal
// like "a=1" is assignable to `string`, but `string` is not assignable to it.
// That is the standard "did the caller lose the literal?" check, and without it
// this type invents an index signature full of `true`s for any runtime string.
export type ParseQuery<S extends string> = string extends S
  ? Record<string, QueryValue>
  : Prettify<ParsePairs<S>>;

export function parseQuery<const S extends string>(search: S): ParseQuery<S> {
  const out: Record<string, QueryValue> = {};

  if (search !== "") {
    for (const part of search.split("&")) {
      const equals = part.indexOf("=");
      if (equals === -1) {
        // A bare key is a flag.
        out[part] = true;
        continue;
      }
      out[part.slice(0, equals)] = parseValue(part.slice(equals + 1));
    }
  }

  // The ONE permitted cast. `ParseQuery<S>` is a deferred conditional while S
  // is an unresolved type parameter (10/04), so the compiler cannot check this
  // object against it — even though it resolves correctly at every call site.
  // The unsafety is contained to this line; everything above it is checked.
  return out as ParseQuery<S>;
}

/** Mirrors `ParseValue` at runtime. */
function parseValue(raw: string): QueryValue {
  if (raw === "true") return true;
  if (raw === "false") return false;
  const asNumber = Number(raw);
  // `Number("")` is 0 and `Number("abc")` is NaN, so both guards are needed.
  if (raw !== "" && Number.isFinite(asNumber)) return asNumber;
  return raw;
}
