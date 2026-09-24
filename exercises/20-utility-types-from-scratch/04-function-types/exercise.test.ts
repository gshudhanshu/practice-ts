import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  callDescribe,
  describeUser,
  Job,
  Repository,
  type BrokenThenable,
  type DescribeArgs,
  type MyAwaited,
  type MyInstanceType,
  type MyParameters,
  type MyReturnType,
  type Thenable,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

/* MyReturnType */

type _returnPrimitive = Expect<Equal<MyReturnType<() => string>, string>>;
type _returnVoid = Expect<Equal<MyReturnType<(a: number) => void>, void>>;
type _returnNamed = Expect<Equal<MyReturnType<typeof describeUser>, string>>;
type _returnMatchesStdlib = Expect<
  Equal<MyReturnType<typeof describeUser>, ReturnType<typeof describeUser>>
>;
type _returnAsync = Expect<
  Equal<MyReturnType<() => Promise<number>>, Promise<number>>
>;

// An overloaded function resolves to its LAST signature, same as the built-in.
type Overloaded = {
  (input: string): string;
  (input: number): number;
};
type _returnOverloaded = Expect<Equal<MyReturnType<Overloaded>, number>>;

/* MyParameters */

type _paramsEmpty = Expect<Equal<MyParameters<() => void>, []>>;
type _paramsNamed = Expect<
  Equal<MyParameters<typeof describeUser>, [id: string, active: boolean]>
>;
type _paramsMatchesStdlib = Expect<
  Equal<MyParameters<typeof describeUser>, Parameters<typeof describeUser>>
>;
type _paramsRest = Expect<
  Equal<MyParameters<(first: string, ...rest: number[]) => void>, [first: string, ...rest: number[]]>
>;

/* MyInstanceType */

type _instance = Expect<Equal<MyInstanceType<typeof Repository>, Repository>>;
type _instanceMatchesStdlib = Expect<
  Equal<MyInstanceType<typeof Repository>, InstanceType<typeof Repository>>
>;

// The abstract case is why the pattern needs `abstract new`.
type _instanceAbstract = Expect<Equal<MyInstanceType<typeof Job>, Job>>;

// It works on library constructors too — this is how you name a type a package
// forgot to export (10/02).
type _instanceLib = Expect<
  Equal<MyInstanceType<MapConstructor>, Map<unknown, unknown>>
>;

/* MyAwaited */

type _awaitedPromise = Expect<Equal<MyAwaited<Promise<string>>, string>>;
type _awaitedNested = Expect<
  Equal<MyAwaited<Promise<Promise<Promise<number>>>>, number>
>;
type _awaitedPlain = Expect<Equal<MyAwaited<number>, number>>;
type _awaitedThenable = Expect<Equal<MyAwaited<Thenable<boolean>>, boolean>>;
type _awaitedThenablePromise = Expect<
  Equal<MyAwaited<Thenable<Promise<string>>>, string>
>;
type _awaitedBroken = Expect<Equal<MyAwaited<BrokenThenable>, never>>;
type _awaitedNull = Expect<Equal<MyAwaited<null>, null>>;

// It distributes, so a union of promises awaits to a union of values.
type _awaitedUnion = Expect<
  Equal<MyAwaited<Promise<string> | number>, string | number>
>;

type _awaitedMatchesStdlib = Expect<
  Equal<MyAwaited<Thenable<Promise<string>>>, Awaited<Thenable<Promise<string>>>>
>;

/* callDescribe */

type _describeArgs = Expect<Equal<DescribeArgs, [id: string, active: boolean]>>;
type _callDescribeReturn = Expect<Equal<ReturnType<typeof callDescribe>, string>>;

function _compileTimeOnly(): void {
  // @ts-expect-error — the tuple is fixed: two elements, in this order.
  callDescribe(["u1"]);

  // @ts-expect-error — and typed: `active` is a boolean.
  callDescribe(["u1", "yes"]);

  // @ts-expect-error — a string is not a function type.
  type _bad = MyReturnType<string>;

  // @ts-expect-error — an instance is not a constructor; `typeof Repository` is.
  type _bad2 = MyInstanceType<Repository>;
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("callDescribe", () => {
  it("spreads the tuple into the call", () => {
    expect(callDescribe(["u1", true])).toBe("u1 is active");
  });

  it("passes every argument through, including falsy ones", () => {
    expect(callDescribe(["u2", false])).toBe("u2 is inactive");
    expect(callDescribe(["", true])).toBe(" is active");
  });

  it("agrees with calling the function directly", () => {
    expect(callDescribe(["u3", true])).toBe(describeUser("u3", true));
  });
});
