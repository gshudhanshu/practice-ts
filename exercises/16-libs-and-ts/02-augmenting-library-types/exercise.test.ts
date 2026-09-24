import type { IncomingMessage } from "node:http";
import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  attachContext,
  canMerge,
  contextOf,
  requireContext,
  techniqueFor,
  type ContextualRequest,
  type DeclarationKind,
  type RequestContext,
  type Scenario,
  type Technique,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

// The augmentation must land on the library's own interface, not on a copy.
type _augmented = Expect<
  Equal<IncomingMessage["context"], RequestContext | undefined>
>;

type _contextOfReturn = Expect<
  Equal<ReturnType<typeof contextOf>, RequestContext | null>
>;
type _requireReturn = Expect<
  Equal<ReturnType<typeof requireContext>, RequestContext>
>;
type _techniqueReturn = Expect<
  Equal<ReturnType<typeof techniqueFor>, Technique>
>;

function _compileTimeOnly(req: ContextualRequest): void {
  // @ts-expect-error — the context is a RequestContext, not a string.
  req.context = "abc";

  // @ts-expect-error — RequestContext is readonly.
  requireContext(req).requestId = "changed";

  // @ts-expect-error — headers are required on a ContextualRequest.
  attachContext({ method: "GET", url: "/" }, 0);

  // @ts-expect-error — not a declaration kind this exercise knows about.
  canMerge("enum");

  // @ts-expect-error — not a scenario this exercise knows about.
  techniqueFor("rewrite-the-library");
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

/** Built lazily inside tests — never at module scope (see CONVENTIONS §3.2). */
function request(
  headers: ContextualRequest["headers"] = {},
): ContextualRequest {
  return { method: "GET", url: "/orders", headers };
}

describe("attachContext", () => {
  it("uses the x-request-id header", () => {
    const req = request({ "x-request-id": "abc" });
    attachContext(req, 1_000);

    expect(req.context).toEqual({ requestId: "abc", startedAt: 1_000 });
  });

  it("falls back when the header is missing", () => {
    const req = request();
    attachContext(req, 2_000);

    expect(req.context).toEqual({ requestId: "generated", startedAt: 2_000 });
  });

  it("falls back when the header arrives more than once", () => {
    // Node hands you a string[] when a header is repeated. Picking [0] would
    // be a guess; this exercise says treat it as absent.
    const req = request({ "x-request-id": ["abc", "def"] });
    attachContext(req, 3_000);

    expect(req.context).toEqual({
      requestId: "generated",
      startedAt: 3_000,
    });
  });
});

describe("contextOf", () => {
  it("returns the context once it has been attached", () => {
    const req = request({ "x-request-id": "abc" });
    attachContext(req, 10);

    expect(contextOf(req)).toEqual({ requestId: "abc", startedAt: 10 });
  });

  it("returns null when no middleware ran", () => {
    expect(contextOf(request())).toBeNull();
  });
});

describe("requireContext", () => {
  it("returns the context", () => {
    const req = request();
    attachContext(req, 5);

    expect(requireContext(req).startedAt).toBe(5);
  });

  it("throws when the context is missing", () => {
    expect(() => requireContext(request())).toThrow("request has no context");
  });
});

describe("canMerge", () => {
  const cases: ReadonlyArray<readonly [DeclarationKind, boolean]> = [
    ["interface", true],
    ["namespace", true],
    ["type-alias", false],
    ["class", false],
  ];

  for (const [kind, expected] of cases) {
    it(`${kind} -> ${expected}`, () => {
      expect(canMerge(kind)).toBe(expected);
    });
  }
});

describe("techniqueFor", () => {
  const cases: ReadonlyArray<readonly [Scenario, Technique]> = [
    ["add-a-property-to-a-third-party-interface", "module-augmentation"],
    ["add-a-property-to-window", "global-augmentation"],
    [
      "the-library-exports-a-type-alias-not-an-interface",
      "wrap-it-in-your-own-type",
    ],
    [
      "one-function-needs-an-extra-field-and-no-other-file-should-see-it",
      "local-intersection",
    ],
  ];

  for (const [scenario, expected] of cases) {
    it(`${scenario} -> ${expected}`, () => {
      expect(techniqueFor(scenario)).toBe(expected);
    });
  }
});
