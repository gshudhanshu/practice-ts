import { describe, expect, it, vi } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  Cache,
  InMemoryRepository,
  Stack,
  firstMatching,
  type Repository,
} from "./exercise";

/* ── Fixtures ───────────────────────────────────────────────────────────── */

type User = { id: string; name: string; age: number };

const ada: User = { id: "1", name: "Ada", age: 45 };
const bob: User = { id: "2", name: "Bob", age: 30 };

/* ── Compile-time spec ──────────────────────────────────────────────────── */

function _compileTimeOnly(): void {
  const stack = new Stack<string>();
  const popped = stack.pop();
  type _popped = Expect<Equal<typeof popped, string | undefined>>;
  type _peeked = Expect<Equal<ReturnType<Stack<number>["peek"]>, number | undefined>>;
  type _size = Expect<Equal<Stack<string>["size"], number>>;

  // @ts-expect-error — a Stack<string> only takes strings.
  stack.push(1);

  const repo = new InMemoryRepository<User>();
  const found = repo.findById("1");
  type _found = Expect<Equal<typeof found, User | undefined>>;
  type _all = Expect<Equal<ReturnType<InMemoryRepository<User>["all"]>, readonly User[]>>;

  // The class satisfies the generic interface.
  const asInterface: Repository<User> = repo;
  void asInterface;

  // @ts-expect-error — a Repository needs items with an `id`.
  const _bad: Repository<{ name: string }> = repo;

  const cache = new Cache<string, number>();
  const value = cache.get("k");
  type _value = Expect<Equal<typeof value, number | undefined>>;
  type _computed = Expect<
    Equal<ReturnType<Cache<string, number>["getOrCompute"]>, number>
  >;

  // @ts-expect-error — the value type is fixed by the instantiation.
  cache.set("k", "not a number");

  // TODO 5 works through the interface and keeps the element type.
  const match = firstMatching(repo, (user) => user.age > 40);
  type _match = Expect<Equal<typeof match, User | undefined>>;
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("Stack", () => {
  it("is last-in-first-out", () => {
    const stack = new Stack<string>();
    stack.push("a");
    stack.push("b");

    expect(stack.pop()).toBe("b");
    expect(stack.pop()).toBe("a");
    expect(stack.pop()).toBeUndefined();
  });

  it("peeks without removing", () => {
    const stack = new Stack<number>();
    stack.push(1);

    expect(stack.peek()).toBe(1);
    expect(stack.size).toBe(1);
  });

  it("tracks size and emptiness", () => {
    const stack = new Stack<number>();
    expect(stack.isEmpty).toBe(true);
    expect(stack.size).toBe(0);

    stack.push(1);
    expect(stack.isEmpty).toBe(false);
    expect(stack.size).toBe(1);
  });
});

describe("InMemoryRepository", () => {
  const stocked = (): InMemoryRepository<User> => {
    const repo = new InMemoryRepository<User>();
    repo.add(ada);
    repo.add(bob);
    return repo;
  };

  it("adds and finds", () => {
    expect(stocked().findById("1")).toEqual(ada);
    expect(stocked().findById("nope")).toBeUndefined();
  });

  it("lists in insertion order", () => {
    expect([...stocked().all()].map((u) => u.id)).toEqual(["1", "2"]);
  });

  it("replaces an item with the same id", () => {
    const repo = stocked();
    repo.add({ ...ada, name: "Ada L" });

    expect(repo.all()).toHaveLength(2);
    expect(repo.findById("1")?.name).toBe("Ada L");
  });

  it("removes and reports whether anything went", () => {
    const repo = stocked();
    expect(repo.remove("1")).toBe(true);
    expect(repo.remove("1")).toBe(false);
    expect(repo.all()).toHaveLength(1);
  });
});

describe("Cache", () => {
  it("stores and reads", () => {
    const cache = new Cache<string, number>();
    cache.set("a", 1);

    expect(cache.get("a")).toBe(1);
    expect(cache.has("a")).toBe(true);
    expect(cache.get("b")).toBeUndefined();
    expect(cache.has("b")).toBe(false);
    expect(cache.size).toBe(1);
  });

  it("computes once and reuses", () => {
    const cache = new Cache<string, number>();
    const factory = vi.fn(() => 42);

    expect(cache.getOrCompute("k", factory)).toBe(42);
    expect(cache.getOrCompute("k", factory)).toBe(42);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("caches falsy values too", () => {
    const cache = new Cache<string, number>();
    const factory = vi.fn(() => 0);

    expect(cache.getOrCompute("zero", factory)).toBe(0);
    expect(cache.getOrCompute("zero", factory)).toBe(0);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("supports non-string keys", () => {
    const key = { id: 1 };
    const cache = new Cache<object, string>();
    cache.set(key, "value");

    expect(cache.get(key)).toBe("value");
    expect(cache.get({ id: 1 })).toBeUndefined(); // different reference
  });
});

describe("firstMatching", () => {
  it("finds through the interface", () => {
    const repo = new InMemoryRepository<User>();
    repo.add(ada);
    repo.add(bob);

    expect(firstMatching(repo, (user) => user.age < 40)?.name).toBe("Bob");
  });

  it("returns undefined when nothing matches", () => {
    const repo = new InMemoryRepository<User>();
    repo.add(ada);

    expect(firstMatching(repo, (user) => user.age > 100)).toBeUndefined();
  });

  it("works with any Repository implementation", () => {
    const fake: Repository<User> = {
      add: () => undefined,
      findById: () => undefined,
      remove: () => false,
      all: () => [bob],
    };

    expect(firstMatching(fake, () => true)?.name).toBe("Bob");
  });
});
