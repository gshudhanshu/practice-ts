import { describe, expect, it } from "vitest";
import type { Equal, Expect, Extends } from "../../../src/type-testing";
// Nothing else here may import "./catalogue" or "./index-barrel" directly:
// entering the cycle from a different module changes which half is half-built,
// and the bug this exercise is about would quietly stop reproducing.
import {
  TIERS,
  brokenDefaultTier,
  catalogue,
  lazyDefaultTier,
  loadOrder,
  priceOf,
  workingDefaultTier,
  type Plan,
  type Tier,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _tier = Expect<Equal<Tier, "free" | "pro" | "team">>;
type _plan = Expect<Equal<Plan, { tier: Tier; price: number }>>;
type _catalogue = Expect<Equal<ReturnType<typeof catalogue>, Plan[]>>;
type _tiers = Expect<Equal<typeof TIERS, readonly ["free", "pro", "team"]>>;
type _priceOf = Expect<Equal<typeof priceOf, (tier: Tier) => number>>;

// The point of the exercise, stated as a type: `brokenDefaultTier` is NOT
// nullable as far as the compiler is concerned. `Extends`, not `Equal`, so
// annotating it `Tier` or leaving it as `"free"` both pass — but widening it to
// `Tier | undefined` does not.
type _brokenIsNotNullable = Expect<Extends<typeof brokenDefaultTier, Tier>>;
type _workingIsNotNullable = Expect<Extends<typeof workingDefaultTier, Tier>>;
type _lazyIsNotNullable = Expect<
  Extends<ReturnType<typeof lazyDefaultTier>, Tier>
>;

function _compileTimeOnly(): void {
  // @ts-expect-error — not a tier.
  priceOf("enterprise");

  // @ts-expect-error — the catalogue is Plan[], not a record.
  const _bad: Record<Tier, number> = catalogue();
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("the failure", () => {
  it("is undefined at runtime, whatever the type says", () => {
    expect(brokenDefaultTier).toBeUndefined();
  });

  it("is not a type error anywhere — that is the problem", () => {
    // Nothing in the compile-time spec above flagged it. The only thing that
    // catches this class of bug is running the code.
    expect(typeof brokenDefaultTier).toBe("undefined");
  });
});

describe("fix 1 — import the leaf, not the barrel", () => {
  it("reads the same value at the same moment, and works", () => {
    expect(workingDefaultTier).toBe("free");
  });
});

describe("fix 2 — keep the barrel, defer the read", () => {
  it("resolves once every module has finished evaluating", () => {
    expect(lazyDefaultTier()).toBe("free");
  });

  it("proves the binding was only late, never wrong", () => {
    // Same binding `brokenDefaultTier` was read from — it simply has its value
    // now. Nothing was corrupted; the read was early.
    expect(lazyDefaultTier()).toBe(workingDefaultTier);
  });
});

describe("module evaluation", () => {
  it("evaluates each module exactly once, cycle or not", () => {
    expect(loadOrder.filter((name) => name === "pricing")).toHaveLength(1);
    expect(loadOrder.filter((name) => name === "catalogue")).toHaveLength(1);
  });

  it("records both of them", () => {
    expect([...loadOrder].sort()).toEqual(["catalogue", "pricing"]);
  });
});

describe("catalogue", () => {
  it("pairs every tier with its price, in TIERS order", () => {
    expect(catalogue()).toEqual([
      { tier: "free", price: 0 },
      { tier: "pro", price: 12 },
      { tier: "team", price: 40 },
    ]);
  });

  it("returns a fresh array each call", () => {
    expect(catalogue()).not.toBe(catalogue());
  });
});

describe("the acyclic public surface", () => {
  it("forwards the leaf's values", () => {
    expect(TIERS).toEqual(["free", "pro", "team"]);
    expect(priceOf("pro")).toBe(12);
    expect(priceOf("team")).toBe(40);
  });

  it("forwards the recorder", () => {
    expect(Array.isArray(loadOrder)).toBe(true);
  });
});
