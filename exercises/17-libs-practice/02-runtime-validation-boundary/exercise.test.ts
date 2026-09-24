import { describe, expect, it } from "vitest";
import type { Equal, Expect, Extends } from "../../../src/type-testing";
import { HttpError, connect, type TypedClient } from "./http";
import {
  ValidationError,
  arrayOf,
  asBoolean,
  asInteger,
  asString,
  fetchProduct,
  fetchProducts,
  nullable,
  parseProduct,
  parseProductPage,
  withDefault,
  type Parser,
  type Product,
  type ProductPage,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _asString = Expect<Extends<typeof asString, Parser<string>>>;
type _asStringReturns = Expect<Equal<ReturnType<typeof asString>, string>>;
type _asIntegerReturns = Expect<Equal<ReturnType<typeof asInteger>, number>>;
type _asBooleanReturns = Expect<Equal<ReturnType<typeof asBoolean>, boolean>>;
type _parseProduct = Expect<Equal<ReturnType<typeof parseProduct>, Product>>;
type _parsePage = Expect<Equal<ReturnType<typeof parseProductPage>, ProductPage>>;
type _fetchProducts = Expect<
  Equal<Awaited<ReturnType<typeof fetchProducts>>, ProductPage>
>;
type _fetchProduct = Expect<
  Equal<Awaited<ReturnType<typeof fetchProduct>>, Product>
>;

declare const product: Product;
declare const page: ProductPage;

function _compileTimeOnly(): void {
  // A combinator's result type follows the parser it was given.
  const strings = arrayOf(asString);
  type _strings = Expect<Equal<ReturnType<typeof strings>, readonly string[]>>;

  const products = arrayOf(parseProduct);
  type _products = Expect<Equal<ReturnType<typeof products>, readonly Product[]>>;

  const maybeString = nullable(asString);
  type _maybe = Expect<Equal<ReturnType<typeof maybeString>, string | null>>;

  const flag = withDefault(asBoolean, false);
  type _flag = Expect<Equal<ReturnType<typeof flag>, boolean>>;

  const cursor = withDefault(nullable(asString), null);
  type _cursor = Expect<Equal<ReturnType<typeof cursor>, string | null>>;

  // @ts-expect-error — the fallback must be the parser's own type.
  withDefault(asString, 42);

  // @ts-expect-error — a parser takes (value, path), not just a value.
  asString("hello");

  // @ts-expect-error — the domain type is read-only.
  product.name = "renamed";

  // @ts-expect-error — and so is its tag list.
  product.tags.push("new");

  // @ts-expect-error — the page is read-only too.
  page.items = [];

  // nextCursor is `string | null`, never `undefined`.
  const cursorValue = page.nextCursor;
  type _cursorValue = Expect<Equal<typeof cursorValue, string | null>>;
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

function invalid(fn: () => unknown): ValidationError {
  try {
    fn();
  } catch (reason) {
    if (reason instanceof ValidationError) return reason;
    throw reason;
  }
  throw new Error("expected a ValidationError");
}

async function invalidAsync(promise: Promise<unknown>): Promise<ValidationError> {
  try {
    await promise;
  } catch (reason) {
    if (reason instanceof ValidationError) return reason;
    throw reason;
  }
  throw new Error("expected a ValidationError");
}

/** A TypedClient that answers every request with the same body. */
function stubClient(body: unknown): TypedClient {
  return { get: () => Promise.resolve({ status: 200, body }) };
}

const wireProduct = {
  id: "p1",
  title: "Mechanical keyboard",
  price_cents: 8999,
  tags: ["input", "desk"],
  discontinued: false,
};

const domainProduct: Product = {
  id: "p1",
  name: "Mechanical keyboard",
  priceCents: 8999,
  tags: ["input", "desk"],
  discontinued: false,
};

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("leaf parsers", () => {
  it("returns the value when it is right", () => {
    expect(asString("hi", "p")).toBe("hi");
    expect(asInteger(42, "p")).toBe(42);
    expect(asBoolean(false, "p")).toBe(false);
  });

  it("throws with the path and the expectation", () => {
    const error = invalid(() => asString(42, "body.items[0].title"));
    expect(error.path).toBe("body.items[0].title");
    expect(error.detail).toBe("expected a string");
    expect(error.message).toBe("body.items[0].title: expected a string");
    expect(error.name).toBe("ValidationError");
  });

  it.each([
    ["a float", 1.5],
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
    ["a numeric string", "5"],
    ["null", null],
  ])("asInteger rejects %s", (_label, value) => {
    expect(invalid(() => asInteger(value, "p")).message).toBe(
      "p: expected an integer",
    );
  });

  it("asBoolean rejects truthy non-booleans", () => {
    expect(invalid(() => asBoolean(1, "p")).message).toBe(
      "p: expected a boolean",
    );
  });
});

describe("arrayOf", () => {
  it("parses every element", () => {
    expect(arrayOf(asString)(["a", "b"], "tags")).toEqual(["a", "b"]);
    expect(arrayOf(asInteger)([], "tags")).toEqual([]);
  });

  it("rejects a non-array", () => {
    expect(invalid(() => arrayOf(asString)("nope", "tags")).message).toBe(
      "tags: expected an array",
    );
    expect(invalid(() => arrayOf(asString)({ 0: "a" }, "tags")).message).toBe(
      "tags: expected an array",
    );
  });

  it("reports the failing index", () => {
    const error = invalid(() => arrayOf(asString)(["a", 2, "c"], "tags"));
    expect(error.path).toBe("tags[1]");
    expect(error.message).toBe("tags[1]: expected a string");
  });

  it("nests", () => {
    const error = invalid(() =>
      arrayOf(arrayOf(asInteger))([[1], [2, "x"]], "grid"),
    );
    expect(error.message).toBe("grid[1][1]: expected an integer");
  });
});

describe("withDefault / nullable", () => {
  it("withDefault only replaces undefined", () => {
    expect(withDefault(asBoolean, false)(undefined, "p")).toBe(false);
    expect(withDefault(asBoolean, false)(true, "p")).toBe(true);
    expect(invalid(() => withDefault(asBoolean, false)(null, "p")).message).toBe(
      "p: expected a boolean",
    );
  });

  it("nullable only allows null", () => {
    expect(nullable(asString)(null, "p")).toBeNull();
    expect(nullable(asString)("x", "p")).toBe("x");
    expect(invalid(() => nullable(asString)(undefined, "p")).message).toBe(
      "p: expected a string",
    );
  });

  it("composes", () => {
    const cursor = withDefault(nullable(asString), null);
    expect(cursor(undefined, "p")).toBeNull();
    expect(cursor(null, "p")).toBeNull();
    expect(cursor("4", "p")).toBe("4");
    expect(invalid(() => cursor(4, "p")).message).toBe("p: expected a string");
  });
});

describe("parseProduct", () => {
  it("renames the wire fields", () => {
    expect(parseProduct(wireProduct, "body")).toEqual(domainProduct);
  });

  it("defaults a missing discontinued flag to false", () => {
    const parsed = parseProduct(
      { id: "p2", title: "Mouse", price_cents: 3499, tags: [] },
      "body",
    );
    expect(parsed.discontinued).toBe(false);
  });

  it("rejects a non-object", () => {
    expect(invalid(() => parseProduct(null, "body")).message).toBe(
      "body: expected an object",
    );
    expect(invalid(() => parseProduct([wireProduct], "body")).message).toBe(
      "body: expected an object",
    );
  });

  it("reports the WIRE field name in the path", () => {
    const error = invalid(() =>
      parseProduct({ ...wireProduct, price_cents: "8999" }, "body.items[0]"),
    );
    expect(error.message).toBe(
      "body.items[0].price_cents: expected an integer",
    );
  });

  it("reports a bad tag by index", () => {
    const error = invalid(() =>
      parseProduct({ ...wireProduct, tags: ["ok", 7] }, "body"),
    );
    expect(error.message).toBe("body.tags[1]: expected a string");
  });

  it("rejects a missing name outright", () => {
    const error = invalid(() =>
      parseProduct({ id: "p9", price_cents: 1, tags: [] }, "body"),
    );
    expect(error.message).toBe("body.title: expected a string");
  });
});

describe("parseProductPage", () => {
  it("parses items and the cursor", () => {
    expect(
      parseProductPage(
        { items: [wireProduct], next_cursor: "2" },
        "body",
      ),
    ).toEqual({ items: [domainProduct], nextCursor: "2" });
  });

  it("treats an absent or null cursor as null", () => {
    expect(parseProductPage({ items: [] }, "body").nextCursor).toBeNull();
    expect(
      parseProductPage({ items: [], next_cursor: null }, "body").nextCursor,
    ).toBeNull();
  });

  it("reports the failing item and field together", () => {
    const error = invalid(() =>
      parseProductPage(
        { items: [wireProduct, { ...wireProduct, title: 7 }], next_cursor: null },
        "body",
      ),
    );
    expect(error.message).toBe("body.items[1].title: expected a string");
  });

  it("rejects a missing items array", () => {
    expect(invalid(() => parseProductPage({}, "body")).message).toBe(
      "body.items: expected an array",
    );
  });
});

describe("fetchProducts / fetchProduct", () => {
  it("returns a validated page from the real client", async () => {
    const page = await fetchProducts(connect("https://catalog.test"));

    expect(page.nextCursor).toBe("2");
    expect(page.items).toHaveLength(2);
    expect(page.items[0]).toEqual(domainProduct);
    expect(page.items[1]).toEqual({
      id: "p2",
      name: "Wireless mouse",
      priceCents: 3499,
      tags: ["input", "wireless"],
      discontinued: false,
    });
  });

  it("passes the cursor through", async () => {
    const page = await fetchProducts(connect("https://catalog.test"), "4");

    expect(page.items.map((item) => item.id)).toEqual(["p5"]);
    expect(page.nextCursor).toBeNull();
  });

  it("returns one validated product", async () => {
    const found = await fetchProduct(connect("https://catalog.test"), "p4");

    expect(found).toEqual({
      id: "p4",
      name: "USB-C hub",
      priceCents: 5900,
      tags: ["desk"],
      discontinued: true,
    });
  });

  it("lets an HttpError through untouched", async () => {
    await expect(
      fetchProduct(connect("https://catalog.test"), "nope"),
    ).rejects.toBeInstanceOf(HttpError);
  });

  it("turns a malformed payload into a located ValidationError", async () => {
    const client = stubClient({ items: [{ id: "p1" }], next_cursor: null });

    const error = await invalidAsync(fetchProducts(client));
    expect(error.message).toBe("body.items[0].title: expected a string");
  });

  it("rejects a body that is not a page at all", async () => {
    const error = await invalidAsync(fetchProducts(stubClient("<html>")));
    expect(error.message).toBe("body: expected an object");
  });
});
