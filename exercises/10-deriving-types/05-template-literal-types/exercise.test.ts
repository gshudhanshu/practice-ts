import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  pathParamNames,
  type EventHandlerName,
  type HttpsUrl,
  type Pixels,
  type RouteParams,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _handlerOne = Expect<Equal<EventHandlerName<"click">, "onClick">>;
type _handlerUnion = Expect<
  Equal<EventHandlerName<"click" | "focus">, "onClick" | "onFocus">
>;

type _paramsOne = Expect<Equal<RouteParams<"/users/:userId">, "userId">>;
type _paramsTwo = Expect<
  Equal<RouteParams<"/users/:userId/posts/:postId">, "userId" | "postId">
>;
type _paramsThree = Expect<
  Equal<RouteParams<"/a/:one/b/:two/c/:three">, "one" | "two" | "three">
>;
type _paramsNone = Expect<Equal<RouteParams<"/users">, never>>;
type _paramsRoot = Expect<Equal<RouteParams<"/">, never>>;

function _compileTimeOnly(): void {
  const secure: HttpsUrl = "https://example.com";
  const nested: HttpsUrl = "https://example.com/a/b?c=d";
  void secure;
  void nested;

  // @ts-expect-error — must start with https://
  const _insecure: HttpsUrl = "http://example.com";

  // @ts-expect-error — not a URL at all.
  const _notUrl: HttpsUrl = "example.com";

  const size: Pixels = "12px";
  const negative: Pixels = "-4px";
  void size;
  void negative;

  // @ts-expect-error — wrong unit.
  const _rem: Pixels = "12rem";

  // @ts-expect-error — no number.
  const _bare: Pixels = "px";
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("pathParamNames", () => {
  it("finds a single parameter", () => {
    expect(pathParamNames("/users/:userId")).toEqual(["userId"]);
  });

  it("finds several, in order", () => {
    expect(pathParamNames("/users/:userId/posts/:postId")).toEqual([
      "userId",
      "postId",
    ]);
    expect(pathParamNames("/a/:one/b/:two/c/:three")).toEqual([
      "one",
      "two",
      "three",
    ]);
  });

  it("returns [] when there are none", () => {
    expect(pathParamNames("/users")).toEqual([]);
    expect(pathParamNames("/")).toEqual([]);
    expect(pathParamNames("")).toEqual([]);
  });

  it("handles underscores and digits in names", () => {
    expect(pathParamNames("/x/:user_id2")).toEqual(["user_id2"]);
  });

  it("agrees with the type-level version", () => {
    // The same path, computed both ways.
    const path = "/users/:userId/posts/:postId";
    type Expected = RouteParams<typeof path>;
    const fromTypes: Expected[] = ["userId", "postId"];

    expect(pathParamNames(path)).toEqual(fromTypes);
  });
});
