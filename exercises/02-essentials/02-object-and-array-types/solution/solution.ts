/**
 * Solution — 02/02 Object & Array Types
 */

export type Book = {
  id: string;
  title: string;
  author: string;
  // `readonly string[]` (shorthand for ReadonlyArray<string>) blocks push/pop/
  // splice/index-assignment at compile time. It costs nothing at runtime.
  tags: readonly string[];
  // `?` makes the property optional; its type becomes `number | undefined`.
  publishedYear?: number;
};

// Accepting `readonly Book[]` is strictly more permissive than `Book[]`:
// a mutable array is assignable to a readonly one, but not the reverse.
// Take the widest input you can honour — "be liberal in what you accept",
// except here the compiler enforces it.
export function titlesOf(books: readonly Book[]): string[] {
  return books.map((book) => book.title);
}

export function byTag(books: readonly Book[], tag: string): Book[] {
  return books.filter((book) => book.tags.includes(tag));
}

// `books[0]` is `Book | undefined` because noUncheckedIndexedAccess is on.
// The honest return type simply mirrors that — no `!`, no cast.
export function firstBook(books: readonly Book[]): Book | undefined {
  return books[0];
}

export function groupByAuthor(books: readonly Book[]): Record<string, Book[]> {
  const grouped: Record<string, Book[]> = {};

  for (const book of books) {
    // Reading an index signature yields `Book[] | undefined` under
    // noUncheckedIndexedAccess. Narrow it instead of asserting it away.
    const bucket = grouped[book.author];
    if (bucket) {
      bucket.push(book);
    } else {
      grouped[book.author] = [book];
    }
  }

  return grouped;
}
