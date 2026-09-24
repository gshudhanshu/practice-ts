import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  InMemoryRepository,
  type AppConfig,
  type Entity,
  type Id,
  type Identified,
  type Repository,
  type Timestamped,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _identified = Expect<Equal<Identified, { id: string }>>;
type _timestamped = Expect<
  Equal<Timestamped, { createdAt: string; updatedAt: string }>
>;

// Entity must carry all four members (inherited + its own).
type _entityId = Expect<Equal<Entity["id"], string>>;
type _entityCreated = Expect<Equal<Entity["createdAt"], string>>;
type _entityUpdated = Expect<Equal<Entity["updatedAt"], string>>;
type _entityName = Expect<Equal<Entity["name"], string>>;
type _entityKeys = Expect<
  Equal<keyof Entity, "id" | "createdAt" | "updatedAt" | "name">
>;

// An Entity must be usable wherever its parents are expected.
type _entityIsIdentified = Expect<Entity extends Identified ? true : false>;
type _entityIsTimestamped = Expect<Entity extends Timestamped ? true : false>;

// A union — impossible to express as an interface.
type _id = Expect<Equal<Id, string | number>>;

// Declaration merging: both members must be present on the single merged type.
type _configKeys = Expect<Equal<keyof AppConfig, "apiUrl" | "debug">>;
type _configUrl = Expect<Equal<AppConfig["apiUrl"], string>>;
type _configDebug = Expect<Equal<AppConfig["debug"], boolean>>;

// The class must satisfy the interface.
type _implements = Expect<InMemoryRepository extends Repository ? true : false>;
type _size = Expect<Equal<Repository["size"], number>>;

function _compileTimeOnly(): void {
  const repo = new InMemoryRepository();

  // @ts-expect-error — size is readonly on the contract.
  repo.size = 5;

  // @ts-expect-error — an Entity needs every member.
  const _incomplete: Entity = { id: "1", name: "x" };

  // A Repository-typed variable accepts the concrete class.
  const asContract: Repository = repo;
  void asContract;
}

/* ── Fixtures ───────────────────────────────────────────────────────────── */

const entity = (id: string, name: string): Entity => ({
  id,
  name,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-02",
});

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("InMemoryRepository", () => {
  it("starts empty", () => {
    expect(new InMemoryRepository().size).toBe(0);
  });

  it("stores and retrieves entities", () => {
    const repo = new InMemoryRepository();
    repo.add(entity("1", "first"));
    repo.add(entity("2", "second"));

    expect(repo.size).toBe(2);
    expect(repo.findById("1")?.name).toBe("first");
    expect(repo.findById("2")?.name).toBe("second");
  });

  it("returns undefined for an unknown id", () => {
    expect(new InMemoryRepository().findById("nope")).toBeUndefined();
  });

  it("replaces an entity with the same id", () => {
    const repo = new InMemoryRepository();
    repo.add(entity("1", "original"));
    repo.add(entity("1", "replacement"));

    expect(repo.size).toBe(1);
    expect(repo.findById("1")?.name).toBe("replacement");
  });

  it("is usable through the interface type", () => {
    const repo: Repository = new InMemoryRepository();
    repo.add(entity("1", "via interface"));
    expect(repo.size).toBe(1);
  });
});
