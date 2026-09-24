import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  byTag,
  firstBook,
  groupByAuthor,
  titlesOf,
  type Book,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _tagsAreReadonly = Expect<Equal<Book["tags"], readonly string[]>>;
type _yearIsOptional = Expect<Equal<Book["publishedYear"], number | undefined>>;
type _firstIsMaybe = Expect<Equal<ReturnType<typeof firstBook>, Book | undefined>>;
type _titlesParam = Expect<
  Equal<Parameters<typeof titlesOf>[0], readonly Book[]>
>;

const sample: Book = {
  id: "1",
  title: "Dune",
  author: "Herbert",
  tags: ["scifi"],
};

// publishedYear is genuinely optional — omitting it must be legal.
const _withoutYear: Book = { ...sample };
const _withYear: Book = { ...sample, publishedYear: 1965 };

// Negative assertions live inside a function that is never called.
// `@ts-expect-error` only silences the compiler — the statement would still
// RUN if it sat at module scope, and `readonly` is erased at runtime.
function _compileTimeOnly(): void {
  // @ts-expect-error — tags is readonly, push must not compile.
  sample.tags.push("nope");
}


function _acceptsReadonlyArrays(): void {
  const readonlyBooks: readonly Book[] = [sample];
  titlesOf(readonlyBooks); // must compile
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

const library: Book[] = [
  { id: "1", title: "Dune", author: "Herbert", tags: ["scifi", "classic"] },
  { id: "2", title: "Emma", author: "Austen", tags: ["classic"] },
  { id: "3", title: "Persuasion", author: "Austen", tags: ["classic"], publishedYear: 1817 },
];

describe("titlesOf", () => {
  it("returns every title in order", () => {
    expect(titlesOf(library)).toEqual(["Dune", "Emma", "Persuasion"]);
  });
  it("returns an empty array for an empty library", () => {
    expect(titlesOf([])).toEqual([]);
  });
});

describe("byTag", () => {
  it("filters by tag", () => {
    expect(byTag(library, "scifi").map((b) => b.id)).toEqual(["1"]);
    expect(byTag(library, "classic").map((b) => b.id)).toEqual(["1", "2", "3"]);
  });
  it("is case-sensitive and returns [] on no match", () => {
    expect(byTag(library, "SciFi")).toEqual([]);
  });
});

describe("firstBook", () => {
  it("returns the first book", () => {
    expect(firstBook(library)?.title).toBe("Dune");
  });
  it("returns undefined when empty", () => {
    expect(firstBook([])).toBeUndefined();
  });
});

describe("groupByAuthor", () => {
  it("groups books under their author", () => {
    const grouped = groupByAuthor(library);
    expect(Object.keys(grouped).sort()).toEqual(["Austen", "Herbert"]);
    expect(grouped["Austen"]?.map((b) => b.id)).toEqual(["2", "3"]);
    expect(grouped["Herbert"]?.map((b) => b.id)).toEqual(["1"]);
  });
  it("returns an empty object for an empty library", () => {
    expect(groupByAuthor([])).toEqual({});
  });
});
