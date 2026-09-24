import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import { maxBy, merge, pluck, pluckAll, sortByKey } from "./exercise";

/* ── Fixtures ───────────────────────────────────────────────────────────── */

type User = {
  id: number;
  name: string;
  age: number;
  tags: string[];
};

const users: User[] = [
  { id: 1, name: "Carol", age: 30, tags: ["a"] },
  { id: 2, name: "Ada", age: 45, tags: [] },
  { id: 3, name: "Bob", age: 30, tags: ["b"] },
];

/* ── Compile-time spec ──────────────────────────────────────────────────── */

function _compileTimeOnly(user: User): void {
  // TODO 1: the return type follows the key.
  const name = pluck(user, "name");
  type _name = Expect<Equal<typeof name, string>>;

  const age = pluck(user, "age");
  type _age = Expect<Equal<typeof age, number>>;

  const tags = pluck(user, "tags");
  type _tags = Expect<Equal<typeof tags, string[]>>;

  // @ts-expect-error — "nope" is not a key of User.
  pluck(user, "nope");

  // TODO 2
  const ages = pluckAll(users, "age");
  type _ages = Expect<Equal<typeof ages, number[]>>;

  // @ts-expect-error — still key-checked.
  pluckAll(users, "nope");

  // TODO 3: the element type survives the sort.
  const sorted = sortByKey(users, "age");
  type _sorted = Expect<Equal<typeof sorted, User[]>>;

  // @ts-expect-error — `tags` is a string[], which is not comparable.
  sortByKey(users, "tags");

  // TODO 4
  const oldest = maxBy(users, (user) => user.age);
  type _oldest = Expect<Equal<typeof oldest, User | undefined>>;

  // TODO 5: an intersection, so both halves stay visible.
  const merged = merge({ a: 1 }, { b: "x" });
  type _merged = Expect<Equal<typeof merged, { a: number } & { b: string }>>;
  const _a: number = merged.a;
  const _b: string = merged.b;
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("pluck", () => {
  it("reads the property", () => {
    expect(pluck({ id: 1, name: "Ada" }, "name")).toBe("Ada");
    expect(pluck({ id: 1, name: "Ada" }, "id")).toBe(1);
  });
});

describe("pluckAll", () => {
  it("reads the property from every item", () => {
    expect(pluckAll(users, "age")).toEqual([30, 45, 30]);
    expect(pluckAll(users, "name")).toEqual(["Carol", "Ada", "Bob"]);
  });

  it("handles an empty list", () => {
    expect(pluckAll([], "age" as never)).toEqual([]);
  });
});

describe("sortByKey", () => {
  it("sorts numbers numerically", () => {
    expect(sortByKey(users, "age").map((u) => u.id)).toEqual([1, 3, 2]);
  });

  it("sorts strings lexicographically", () => {
    expect(sortByKey(users, "name").map((u) => u.name)).toEqual([
      "Ada",
      "Bob",
      "Carol",
    ]);
  });

  it("does not mutate the input", () => {
    sortByKey(users, "age");
    expect(users.map((u) => u.id)).toEqual([1, 2, 3]);
  });

  it("is stable for equal keys", () => {
    // Carol and Bob are both 30; Carol came first in the input.
    expect(sortByKey(users, "age").slice(0, 2).map((u) => u.name)).toEqual([
      "Carol",
      "Bob",
    ]);
  });
});

describe("maxBy", () => {
  it("finds the highest score", () => {
    expect(maxBy(users, (user) => user.age)?.name).toBe("Ada");
  });

  it("returns the first on a tie", () => {
    const tied = users.filter((user) => user.age === 30);
    expect(maxBy(tied, (user) => user.age)?.name).toBe("Carol");
  });

  it("returns undefined for an empty list", () => {
    expect(maxBy([], () => 0)).toBeUndefined();
  });
});

describe("merge", () => {
  it("combines both objects", () => {
    expect(merge({ a: 1 }, { b: "x" })).toEqual({ a: 1, b: "x" });
  });

  it("lets the second argument win on a clash", () => {
    expect(merge({ a: 1 }, { a: 2 })).toEqual({ a: 2 });
  });

  it("does not mutate its arguments", () => {
    const a = { a: 1 };
    const b = { b: 2 };
    merge(a, b);
    expect(a).toEqual({ a: 1 });
    expect(b).toEqual({ b: 2 });
  });
});
