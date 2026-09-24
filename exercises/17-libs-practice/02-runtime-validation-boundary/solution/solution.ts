/**
 * Solution — 17/02 The runtime validation boundary
 */

import type { TypedClient } from "./http";

export type Product = {
  readonly id: string;
  readonly name: string;
  readonly priceCents: number;
  readonly tags: readonly string[];
  readonly discontinued: boolean;
};

export type ProductPage = {
  readonly items: readonly Product[];
  readonly nextCursor: string | null;
};

export class ValidationError extends Error {
  constructor(
    readonly path: string,
    readonly detail: string,
  ) {
    super(`${path}: ${detail}`);
    this.name = "ValidationError";
  }
}

export type Parser<T> = (value: unknown, path: string) => T;

export function assertIsRecord(
  value: unknown,
  path: string,
): asserts value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ValidationError(path, "expected an object");
  }
}

/* ── Leaf parsers ───────────────────────────────────────────────────────── */

// The `Parser<string>` annotation types both parameters and the return, so the
// arrow itself needs no annotations — and the compiler checks that every path
// really does produce a string.
export const asString: Parser<string> = (value, path) => {
  if (typeof value !== "string") {
    throw new ValidationError(path, "expected a string");
  }
  return value;
};

export const asInteger: Parser<number> = (value, path) => {
  // Number.isInteger already rejects NaN, Infinity and non-numbers, but the
  // typeof check is what narrows `unknown` for the return.
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new ValidationError(path, "expected an integer");
  }
  return value;
};

export const asBoolean: Parser<boolean> = (value, path) => {
  if (typeof value !== "boolean") {
    throw new ValidationError(path, "expected a boolean");
  }
  return value;
};

/* ── Combinators ────────────────────────────────────────────────────────── */

export function arrayOf<T>(item: Parser<T>): Parser<readonly T[]> {
  return (value, path) => {
    if (!Array.isArray(value)) {
      throw new ValidationError(path, "expected an array");
    }

    // `value` is `any[]` after Array.isArray, so each element goes through the
    // item parser — which is the only thing that makes the result a `T[]`.
    return value.map((element: unknown, index) =>
      item(element, `${path}[${index}]`),
    );
  };
}

export function withDefault<T>(inner: Parser<T>, fallback: T): Parser<T> {
  // Absent means "the server did not say", which is different from "the server
  // said null" — hence two combinators rather than one.
  return (value, path) => (value === undefined ? fallback : inner(value, path));
}

export function nullable<T>(inner: Parser<T>): Parser<T | null> {
  return (value, path) => (value === null ? null : inner(value, path));
}

/* ── Domain parsers ─────────────────────────────────────────────────────── */

export const parseProduct: Parser<Product> = (value, path) => {
  // The assertion function narrows `value` for the REST OF THE SCOPE (07/05),
  // so every line below reads a property off it with no cast and no nesting.
  assertIsRecord(value, path);

  // Renaming happens here, at the only place that knows both vocabularies.
  // Past this function nothing in the app has heard of `price_cents`.
  return {
    id: asString(value["id"], `${path}.id`),
    name: asString(value["title"], `${path}.title`),
    priceCents: asInteger(value["price_cents"], `${path}.price_cents`),
    tags: arrayOf(asString)(value["tags"], `${path}.tags`),
    discontinued: withDefault(
      asBoolean,
      false,
    )(value["discontinued"], `${path}.discontinued`),
  };
};

export const parseProductPage: Parser<ProductPage> = (value, path) => {
  assertIsRecord(value, path);

  return {
    items: arrayOf(parseProduct)(value["items"], `${path}.items`),
    // Three combinators stacked: absent -> null, explicit null -> null,
    // anything else must be a string.
    nextCursor: withDefault(
      nullable(asString),
      null,
    )(value["next_cursor"], `${path}.next_cursor`),
  };
};

/* ── The functions the app calls ────────────────────────────────────────── */

export async function fetchProducts(
  client: TypedClient,
  cursor?: string,
): Promise<ProductPage> {
  const response = await client.get(
    "/products",
    cursor === undefined ? undefined : { cursor },
  );

  // `response.body` is `unknown` on the way in and `ProductPage` on the way
  // out. That single line is the whole boundary.
  return parseProductPage(response.body, "body");
}

export async function fetchProduct(
  client: TypedClient,
  id: string,
): Promise<Product> {
  const response = await client.get(`/products/${id}`);
  return parseProduct(response.body, "body");
}
