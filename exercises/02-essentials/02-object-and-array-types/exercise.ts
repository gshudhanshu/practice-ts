/**
 * Exercise 02/02 — Object & Array Types
 *
 * Read README.md first. Replace every TODO.
 */

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Model a book:
//   id            string, required
//   title         string, required
//   author        string, required
//   tags          an array of strings that CANNOT be mutated
//   publishedYear number, optional
export type Book = {
  id: string;
  title: string;
};

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// Return every title. The parameter must accept a readonly array (so callers
// can pass `readonly Book[]` too) and must not be mutated inside.
export function titlesOf(books: Book[]): string[] {
  throw new Error("TODO 2: implement titlesOf");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Return only the books carrying `tag`. Case-sensitive.
export function byTag(books: readonly Book[], tag: string): Book[] {
  throw new Error("TODO 3: implement byTag");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Return the first book, or `undefined` when the list is empty.
// `noUncheckedIndexedAccess` is ON in this repo — `books[0]` is already
// `Book | undefined`, so this should need no assertion and no `!`.
export function firstBook(books: readonly Book[]): Book {
  throw new Error("TODO 4: implement firstBook");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// Group books by author into a plain object keyed by author name.
// An author with no books must simply be absent from the result.
// Because of `noUncheckedIndexedAccess`, reading `result[author]` gives you
// `Book[] | undefined` — handle that rather than asserting it away.
export function groupByAuthor(
  books: readonly Book[],
): Record<string, Book[]> {
  throw new Error("TODO 5: implement groupByAuthor");
}
