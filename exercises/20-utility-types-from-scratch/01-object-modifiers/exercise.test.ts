import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  applyPatch,
  type Draft,
  type LosesModifiers,
  type MyMutable,
  type MyPartial,
  type MyReadonly,
  type MyRequired,
  type Settings,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

/* MyPartial */

type _partial = Expect<
  Equal<
    MyPartial<Settings>,
    { theme?: "light" | "dark"; fontSize?: number; autosave?: boolean }
  >
>;

// Homomorphic: `readonly` and `?` are carried across, not invented or dropped.
type _partialKeepsReadonly = Expect<
  Equal<
    MyPartial<Draft>,
    { readonly id?: string; title?: string; wordCount?: number }
  >
>;

type _partialMatchesStdlib = Expect<
  Equal<MyPartial<Draft>, Partial<Draft>>
>;

/* MyRequired */

type _required = Expect<
  Equal<
    MyRequired<Settings>,
    { theme: "light" | "dark"; fontSize: number; autosave: boolean }
  >
>;

type _requiredUndoesPartial = Expect<
  Equal<MyRequired<MyPartial<Settings>>, MyRequired<Settings>>
>;

// Required removes `?` and leaves `readonly` alone.
type _requiredKeepsReadonly = Expect<
  Equal<
    MyRequired<Draft>,
    { readonly id: string; title: string; wordCount: number }
  >
>;

/* MyReadonly */

type _readonly = Expect<
  Equal<
    MyReadonly<Settings>,
    {
      readonly theme: "light" | "dark";
      readonly fontSize: number;
      readonly autosave?: boolean;
    }
  >
>;

type _readonlyMatchesStdlib = Expect<Equal<MyReadonly<Draft>, Readonly<Draft>>>;

/* MyMutable */

type _mutable = Expect<Equal<MyMutable<MyReadonly<Settings>>, Settings>>;

// Nothing to remove — an already-mutable type is unchanged.
type _mutableIdempotent = Expect<Equal<MyMutable<Settings>, Settings>>;

type _mutableStripsSourceReadonly = Expect<
  Equal<MyMutable<Draft>, { id: string; title?: string; wordCount: number }>
>;

/* The non-homomorphic specimen: both modifiers gone, and the optional property
   has decayed into a required one whose type includes `undefined`. */
type _losesModifiers = Expect<
  Equal<
    LosesModifiers<Draft>,
    { id: string; title: string | undefined; wordCount: number }
  >
>;

type _applyPatchReturn = Expect<
  Equal<ReturnType<typeof applyPatch>, MyRequired<Settings>>
>;

function _compileTimeOnly(): void {
  // A patch may be empty, or carry any subset.
  const empty: MyPartial<Settings> = {};
  const one: MyPartial<Settings> = { fontSize: 18 };
  void empty;
  void one;

  // @ts-expect-error — `exactOptionalPropertyTypes` (03/03): optional means the
  // key may be ABSENT, not present-and-undefined. `?` never implies `| undefined`.
  const explicitUndefined: MyPartial<Settings> = { fontSize: undefined };
  void explicitUndefined;

  // @ts-expect-error — MyRequired makes `autosave` mandatory.
  const missing: MyRequired<Settings> = { theme: "dark", fontSize: 14 };
  void missing;

  const frozen: MyReadonly<Settings> = { theme: "dark", fontSize: 14 };
  // @ts-expect-error — every property is readonly.
  frozen.fontSize = 16;

  const thawed: MyMutable<MyReadonly<Settings>> = { theme: "dark", fontSize: 14 };
  thawed.fontSize = 16; // …and mutable again once the modifier is stripped.
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

const base = (): MyRequired<Settings> => ({
  theme: "light",
  fontSize: 14,
  autosave: true,
});

describe("applyPatch", () => {
  it("overrides only the keys present in the patch", () => {
    expect(applyPatch(base(), { fontSize: 18 })).toEqual({
      theme: "light",
      fontSize: 18,
      autosave: true,
    });
  });

  it("accepts an empty patch", () => {
    expect(applyPatch(base(), {})).toEqual({
      theme: "light",
      fontSize: 14,
      autosave: true,
    });
  });

  it("keeps falsy patch values", () => {
    expect(applyPatch(base(), { autosave: false, fontSize: 0 })).toEqual({
      theme: "light",
      fontSize: 0,
      autosave: false,
    });
  });

  it("does not mutate the base object", () => {
    const original = base();
    applyPatch(original, { theme: "dark" });
    expect(original.theme).toBe("light");
  });
});
