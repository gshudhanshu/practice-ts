import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import { Table, type FieldRule, type WriteResult } from "./exercise";

/* ── Fixtures ───────────────────────────────────────────────────────────── */

type User = {
  id: string;
  name: string;
  age: number;
};

const rules: FieldRule<User>[] = [
  {
    field: "name",
    check: (user) => (user.name.trim() === "" ? "is required" : null),
  },
  {
    field: "age",
    check: (user) =>
      user.age < 0 || user.age > 150 ? "must be between 0 and 150" : null,
  },
];

const ada: User = { id: "1", name: "Ada", age: 45 };
const bob: User = { id: "2", name: "Bob", age: 30 };

const stocked = (): Table<User> => {
  const table = new Table<User>(rules);
  table.insert(ada);
  table.insert(bob);
  return table;
};

/* ── Compile-time spec ──────────────────────────────────────────────────── */

function _compileTimeOnly(): void {
  const table = new Table<User>(rules);

  type _insert = Expect<Equal<ReturnType<Table<User>["insert"]>, WriteResult>>;
  type _find = Expect<Equal<ReturnType<Table<User>["findById"]>, User | undefined>>;
  type _all = Expect<Equal<ReturnType<Table<User>["all"]>, readonly User[]>>;

  table.update("1", { name: "Ada L" });
  table.update("1", { age: 46 });

  // @ts-expect-error — the id cannot be patched.
  table.update("1", { id: "9" });

  // @ts-expect-error — unknown field.
  table.update("1", { nope: true });

  // @ts-expect-error — a Table needs rows with an `id`.
  const _bad = new Table<{ name: string }>([]);

  // Narrowing the result union.
  const result = table.insert(ada);
  if (result.ok) {
    const id: string = result.id;
    void id;
  } else {
    const errors: readonly { field: string; message: string }[] = result.errors;
    void errors;
  }
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("insert", () => {
  it("stores a valid row", () => {
    const table = new Table<User>(rules);
    expect(table.insert(ada)).toEqual({ ok: true, id: "1" });
    expect(table.size).toBe(1);
    expect(table.findById("1")).toEqual(ada);
  });

  it("rejects an invalid row and stores nothing", () => {
    const table = new Table<User>(rules);
    const result = table.insert({ id: "1", name: "", age: 999 });

    expect(result).toEqual({
      ok: false,
      errors: [
        { field: "name", message: "is required" },
        { field: "age", message: "must be between 0 and 150" },
      ],
    });
    expect(table.size).toBe(0);
  });

  it("rejects a duplicate id before running the rules", () => {
    const table = stocked();
    // Invalid AND duplicate — the id error must be the only one reported.
    const result = table.insert({ id: "1", name: "", age: 999 });

    expect(result).toEqual({
      ok: false,
      errors: [{ field: "id", message: "already exists" }],
    });
    expect(table.findById("1")).toEqual(ada);
  });

  it("keeps insertion order", () => {
    expect([...stocked().all()].map((user) => user.id)).toEqual(["1", "2"]);
  });
});

describe("update", () => {
  it("patches an existing row", () => {
    const table = stocked();
    expect(table.update("1", { name: "Ada L" })).toEqual({ ok: true, id: "1" });
    expect(table.findById("1")).toEqual({ id: "1", name: "Ada L", age: 45 });
  });

  it("leaves untouched fields alone", () => {
    const table = stocked();
    table.update("1", { age: 46 });
    expect(table.findById("1")).toEqual({ id: "1", name: "Ada", age: 46 });
  });

  it("reports an unknown id", () => {
    expect(stocked().update("nope", { name: "X" })).toEqual({
      ok: false,
      errors: [{ field: "id", message: "not found" }],
    });
  });

  it("validates the MERGED row and rolls back on failure", () => {
    const table = stocked();
    const result = table.update("1", { age: 999 });

    expect(result).toEqual({
      ok: false,
      errors: [{ field: "age", message: "must be between 0 and 150" }],
    });
    // The stored row must be completely unchanged.
    expect(table.findById("1")).toEqual(ada);
  });

  it("does not change the row count", () => {
    const table = stocked();
    table.update("1", { name: "Ada L" });
    expect(table.size).toBe(2);
  });

  it("keeps the row in its original position", () => {
    const table = stocked();
    table.update("1", { name: "Ada L" });
    expect([...table.all()].map((user) => user.id)).toEqual(["1", "2"]);
  });
});

describe("remove", () => {
  it("removes and reports", () => {
    const table = stocked();
    expect(table.remove("1")).toBe(true);
    expect(table.remove("1")).toBe(false);
    expect(table.size).toBe(1);
  });
});

describe("where / count", () => {
  it("filters in insertion order", () => {
    expect(stocked().where((user) => user.age >= 30).map((u) => u.id)).toEqual([
      "1",
      "2",
    ]);
    expect(stocked().where((user) => user.age > 40).map((u) => u.id)).toEqual([
      "1",
    ]);
  });

  it("counts matches", () => {
    expect(stocked().count((user) => user.age >= 30)).toBe(2);
    expect(stocked().count(() => false)).toBe(0);
  });

  it("returns [] when nothing matches", () => {
    expect(stocked().where(() => false)).toEqual([]);
  });
});
