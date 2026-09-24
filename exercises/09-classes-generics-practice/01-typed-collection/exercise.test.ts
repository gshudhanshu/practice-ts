import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import { Collection } from "./exercise";

/* ── Fixtures ───────────────────────────────────────────────────────────── */

type User = { id: string; name: string; age: number };

const users: User[] = [
  { id: "1", name: "Carol", age: 30 },
  { id: "2", name: "Ada", age: 45 },
  { id: "3", name: "Bob", age: 25 },
];

const byAge = (a: User, b: User): number => a.age - b.age;

/* ── Compile-time spec ──────────────────────────────────────────────────── */

function _compileTimeOnly(): void {
  const numbers = Collection.from([1, 2, 3]);
  type _numbers = Expect<Equal<typeof numbers, Collection<number>>>;

  // map changes the element type.
  const strings = numbers.map((n) => String(n));
  type _strings = Expect<Equal<typeof strings, Collection<string>>>;

  const objects = numbers.map((n) => ({ value: n }));
  type _objects = Expect<Equal<typeof objects, Collection<{ value: number }>>>;

  // filter, sort and take keep it.
  type _filter = Expect<Equal<ReturnType<Collection<User>["filter"]>, Collection<User>>>;
  type _sort = Expect<Equal<ReturnType<Collection<User>["sort"]>, Collection<User>>>;
  type _take = Expect<Equal<ReturnType<Collection<User>["take"]>, Collection<User>>>;

  type _first = Expect<Equal<ReturnType<Collection<User>["first"]>, User | undefined>>;
  type _toArray = Expect<Equal<ReturnType<Collection<User>["toArray"]>, User[]>>;
  type _size = Expect<Equal<Collection<User>["size"], number>>;

  // reduce picks its own result type.
  const total = Collection.from(users).reduce((sum, user) => sum + user.age, 0);
  type _total = Expect<Equal<typeof total, number>>;

  const names = Collection.from(users).reduce<string[]>(
    (all, user) => [...all, user.name],
    [],
  );
  type _names = Expect<Equal<typeof names, string[]>>;

  // @ts-expect-error — the constructor is private; use Collection.from.
  new Collection([1]);
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("from / toArray / size", () => {
  it("wraps and unwraps", () => {
    expect(Collection.from([1, 2, 3]).toArray()).toEqual([1, 2, 3]);
    expect(Collection.from([]).toArray()).toEqual([]);
    expect(Collection.from([1, 2]).size).toBe(2);
  });

  it("returns a fresh array each time", () => {
    const collection = Collection.from([1, 2]);
    const a = collection.toArray();
    const b = collection.toArray();

    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });

  it("is not affected by later mutation of the source array", () => {
    const source = [1, 2];
    const collection = Collection.from(source);
    source.push(3);

    expect(collection.toArray()).toEqual([1, 2]);
  });
});

describe("filter", () => {
  it("keeps matching items in order", () => {
    expect(
      Collection.from(users)
        .filter((user) => user.age >= 30)
        .toArray()
        .map((user) => user.name),
    ).toEqual(["Carol", "Ada"]);
  });

  it("leaves the original alone", () => {
    const collection = Collection.from(users);
    collection.filter(() => false);
    expect(collection.size).toBe(3);
  });
});

describe("map", () => {
  it("transforms every item", () => {
    expect(Collection.from([1, 2]).map((n) => n * 2).toArray()).toEqual([2, 4]);
    expect(
      Collection.from(users).map((user) => user.name).toArray(),
    ).toEqual(["Carol", "Ada", "Bob"]);
  });
});

describe("sort", () => {
  it("orders by the comparator", () => {
    expect(
      Collection.from(users).sort(byAge).toArray().map((user) => user.name),
    ).toEqual(["Bob", "Carol", "Ada"]);
  });

  it("does not mutate the original collection", () => {
    const collection = Collection.from(users);
    collection.sort(byAge);
    expect(collection.toArray().map((user) => user.name)).toEqual([
      "Carol",
      "Ada",
      "Bob",
    ]);
  });

  it("does not mutate the source array", () => {
    const source = [...users];
    Collection.from(source).sort(byAge);
    expect(source.map((user) => user.name)).toEqual(["Carol", "Ada", "Bob"]);
  });
});

describe("take", () => {
  it("takes the first n", () => {
    expect(Collection.from([1, 2, 3]).take(2).toArray()).toEqual([1, 2]);
  });

  it("handles counts at the edges", () => {
    expect(Collection.from([1, 2]).take(0).toArray()).toEqual([]);
    expect(Collection.from([1, 2]).take(-1).toArray()).toEqual([]);
    expect(Collection.from([1, 2]).take(99).toArray()).toEqual([1, 2]);
  });
});

describe("first", () => {
  it("returns the first item or undefined", () => {
    expect(Collection.from([1, 2]).first()).toBe(1);
    expect(Collection.from([]).first()).toBeUndefined();
  });
});

describe("reduce", () => {
  it("folds to a value", () => {
    expect(Collection.from([1, 2, 3]).reduce((sum, n) => sum + n, 0)).toBe(6);
    expect(Collection.from<number>([]).reduce((sum, n) => sum + n, 0)).toBe(0);
  });
});

describe("chaining", () => {
  it("composes without mutating anything", () => {
    const result = Collection.from(users)
      .filter((user) => user.age >= 25)
      .sort(byAge)
      .map((user) => user.name)
      .take(2)
      .toArray();

    expect(result).toEqual(["Bob", "Carol"]);
    expect(users.map((user) => user.name)).toEqual(["Carol", "Ada", "Bob"]);
  });
});
