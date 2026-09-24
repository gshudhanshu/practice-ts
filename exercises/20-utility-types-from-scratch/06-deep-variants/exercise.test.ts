import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  deepFreeze,
  type Atom,
  type Category,
  type Config,
  type DeepMutable,
  type DeepPartial,
  type DeepReadonly,
  type DeepReadonlyUpTo,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

/* DeepReadonly */

type _deepReadonly = Expect<
  Equal<
    DeepReadonly<{ a: { b: { c: string } } }>,
    { readonly a: { readonly b: { readonly c: string } } }
  >
>;

type _deepReadonlyServer = Expect<
  Equal<
    DeepReadonly<Config>["server"],
    {
      readonly host: string;
      readonly port: number;
      readonly tls: { readonly enabled: boolean };
    }
  >
>;

// The stdlib's Readonly stops at the first level — that is why this exists.
type _shallowIsNotEnough = Expect<
  Equal<Readonly<Config>["server"], Config["server"]>
>;

/* The caveats, asserted rather than hidden */

// Arrays stay arrays, tuples stay tuples: a homomorphic mapped type over them
// does the right thing with no special case.
type _array = Expect<Equal<DeepReadonly<Config>["tags"], readonly string[]>>;
type _tuple = Expect<
  Equal<DeepReadonly<Config>["range"], readonly [number, number]>
>;

// Date and functions are leaves — walking into them would destroy them.
type _date = Expect<Equal<DeepReadonly<Config>["createdAt"], Date>>;
type _fn = Expect<
  Equal<DeepReadonly<Config>["onSave"], (value: string) => void>
>;
type _atomIsLeaf = Expect<Equal<Date extends Atom ? true : false, true>>;
type _objectIsNotLeaf = Expect<
  Equal<{ a: string } extends Atom ? true : false, false>
>;

// A self-referential type recurses lazily, so it terminates.
type _selfReferential = Expect<
  Equal<DeepReadonly<Config>["categories"], readonly DeepReadonly<Category>[]>
>;

// Map and Set are NOT leaves, and the result is a mess: it is no longer a Map,
// and every mutating method survives with a `readonly` in front of it — so the
// type says "frozen" while `.set()` is still right there. The explanation shows
// how a library fixes this.
type _mapIsNotAMapAnyMore = Expect<
  Equal<
    Equal<DeepReadonly<Map<string, number>>, Map<string, number>>,
    false
  >
>;
type _mapKeepsSet = Expect<
  Equal<"set" extends keyof DeepReadonly<Map<string, number>> ? true : false, true>
>;
type _mapValuesUnchanged = Expect<
  Equal<DeepReadonly<Map<string, number>>["size"], number>
>;

/* DeepMutable */

type _roundTrip = Expect<Equal<DeepMutable<DeepReadonly<Config>>, Config>>;
type _mutableIdempotent = Expect<Equal<DeepMutable<Config>, Config>>;
type _mutableDeep = Expect<
  Equal<
    DeepMutable<{ readonly a: { readonly b: readonly string[] } }>,
    { a: { b: string[] } }
  >
>;

/* DeepPartial */

type _deepPartial = Expect<
  Equal<
    DeepPartial<{ a: { b: string }; when: Date }>,
    { a?: { b?: string }; when?: Date }
  >
>;

type _deepPartialConfig = Expect<
  Equal<
    DeepPartial<Config>["server"],
    { host?: string; port?: number; tls?: { enabled?: boolean } } | undefined
  >
>;

// The array caveat, stated out loud: the ELEMENTS become optional too.
type _deepPartialArray = Expect<
  Equal<DeepPartial<{ list: number[] }>, { list?: (number | undefined)[] }>
>;

/* DeepReadonlyUpTo */

type Nested = { a: { b: { c: { d: string } } } };

type _depth0 = Expect<Equal<DeepReadonlyUpTo<Nested, 0>, Nested>>;
type _depth1 = Expect<
  Equal<DeepReadonlyUpTo<Nested, 1>, { readonly a: { b: { c: { d: string } } } }>
>;
type _depth2 = Expect<
  Equal<
    DeepReadonlyUpTo<Nested, 2>,
    { readonly a: { readonly b: { c: { d: string } } } }
  >
>;
type _depthDefault = Expect<
  Equal<
    DeepReadonlyUpTo<Nested>,
    { readonly a: { readonly b: { readonly c: { d: string } } } }
  >
>;
type _depthStopsAtAtoms = Expect<
  Equal<DeepReadonlyUpTo<{ when: Date }, 5>, { readonly when: Date }>
>;

/* deepFreeze */

type _deepFreezeReturn = Expect<
  Equal<ReturnType<typeof deepFreeze>, DeepReadonly<Config>>
>;

function _compileTimeOnly(): void {
  const frozen = deepFreeze(config());

  // @ts-expect-error — readonly all the way down, not just at the top.
  frozen.server.tls.enabled = false;

  // @ts-expect-error — a readonly array has no `push`.
  frozen.tags.push("x");

  // The Date survived as a Date, so its methods are still there.
  const year: number = frozen.createdAt.getFullYear();
  void year;

  // …and the function survived as a function.
  frozen.onSave("value");

  // A deeply-readonly value still reads normally.
  const host: string = frozen.server.host;
  void host;
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

const config = (): Config => ({
  name: "api",
  createdAt: new Date(0),
  onSave: () => undefined,
  server: { host: "localhost", port: 8080, tls: { enabled: true } },
  tags: ["a", "b"],
  range: [1, 10],
  categories: [{ name: "core", children: [] }],
});

describe("deepFreeze", () => {
  it("freezes the top level", () => {
    const value = config();
    deepFreeze(value);
    expect(Object.isFrozen(value)).toBe(true);
  });

  it("freezes nested objects, arrays and tuples", () => {
    const value = config();
    deepFreeze(value);
    expect(Object.isFrozen(value.server)).toBe(true);
    expect(Object.isFrozen(value.server.tls)).toBe(true);
    expect(Object.isFrozen(value.tags)).toBe(true);
    expect(Object.isFrozen(value.range)).toBe(true);
    expect(Object.isFrozen(value.categories[0])).toBe(true);
  });

  it("actually prevents mutation at runtime", () => {
    const value = config();
    deepFreeze(value);
    expect(() => {
      value.server.port = 9090;
    }).toThrow();
    expect(() => value.tags.push("c")).toThrow();
  });

  it("returns the same object, values intact", () => {
    const value = config();
    const frozen = deepFreeze(value);
    expect(frozen).toBe(value);
    expect(frozen.server.host).toBe("localhost");
    expect(frozen.createdAt.getTime()).toBe(0);
  });

  it("terminates on a cyclic graph", () => {
    const value = config();
    const root: Category = { name: "cycle", children: [] };
    root.children.push(root);
    value.categories.push(root);
    expect(() => deepFreeze(value)).not.toThrow();
    expect(Object.isFrozen(root)).toBe(true);
  });
});
