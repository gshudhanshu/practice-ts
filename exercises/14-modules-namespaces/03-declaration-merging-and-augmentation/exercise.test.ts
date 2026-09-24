import { describe, expect, it } from "vitest";
import type { Equal, Expect, Extends } from "../../../src/type-testing";
import { describeRequest, withHeader } from "./http-lite";
import type { Request as LibRequest } from "./http-lite";
import {
  Money,
  attachUser,
  createRequest,
  currentBuild,
  describeJob,
  formatJob,
  requestOwner,
  setBuild,
  type Job,
  type JobStatus,
  type SessionUser,
} from "./exercise";

/* ── Fixtures ───────────────────────────────────────────────────────────── */

const job: Job = {
  id: "j-1",
  title: "deploy",
  retries: 2,
  status: "running",
};

const ada: SessionUser = { id: "u-1", name: "Ada" };

/* ── Compile-time spec ──────────────────────────────────────────────────── */

// TODO 1 — the two declarations became one type.
type _jobKeys = Expect<
  Equal<keyof Job, "id" | "title" | "retries" | "status">
>;
type _jobRetries = Expect<Equal<Job["retries"], number>>;
type _jobStatus = Expect<Equal<Job["status"], JobStatus>>;

// TODO 2 — the function is still a function, and now has properties.
type _formatJob = Expect<Equal<ReturnType<typeof formatJob>, string>>;
// `Extends`, not `Equal`: a `const` in a namespace keeps its literal type
// unless you annotate it, and either is a fine answer.
type _unknown = Expect<Extends<typeof formatJob.UNKNOWN, string>>;
type _orUnknown = Expect<
  Equal<typeof formatJob.orUnknown, (job: Job | undefined) => string>
>;

// TODO 3 — the augmentation landed on ./http-lite's OWN Request, not a copy.
type _libRequestKeys = Expect<
  Equal<keyof LibRequest, "url" | "headers" | "user">
>;
type _libRequestUser = Expect<
  Equal<LibRequest["user"], SessionUser | undefined>
>;

// TODO 5 — statics arrived through the namespace, typed as the class.
type _zero = Expect<Equal<typeof Money.ZERO, Money>>;
type _fromPounds = Expect<
  Equal<typeof Money.fromPounds, (pounds: number) => Money>
>;

function _compileTimeOnly(): void {
  // @ts-expect-error — `status` must be a JobStatus.
  const _bad: Job = { id: "x", title: "y", retries: 0, status: "paused" };

  // @ts-expect-error — the merged interface requires every member.
  const _incomplete: Job = { id: "x", title: "y" };

  // @ts-expect-error — `appBuild` is `string | undefined`, not a number.
  globalThis.appBuild = 3;

  const build: string | undefined = globalThis.appBuild;
  type _build = Expect<Equal<typeof build, string | undefined>>;
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("interface merging", () => {
  it("reads members that came from both declarations", () => {
    expect(describeJob(job)).toBe("deploy (running, 2 retries)");
  });

  it("has no runtime footprint at all", () => {
    // Merging is a type-level operation; the object is just an object.
    expect(Object.keys(job)).toEqual(["id", "title", "retries", "status"]);
  });
});

describe("function + namespace merging", () => {
  it("is still callable", () => {
    expect(formatJob(job)).toBe("j-1: deploy");
  });

  it("carries the namespace members as properties", () => {
    expect(formatJob.UNKNOWN).toBe("unknown job");
    expect(typeof formatJob.orUnknown).toBe("function");
  });

  it("uses them together", () => {
    expect(formatJob.orUnknown(undefined)).toBe("unknown job");
    expect(formatJob.orUnknown(job)).toBe("j-1: deploy");
  });
});

describe("module augmentation", () => {
  it("attaches a user without disturbing the library's own fields", () => {
    const request = attachUser(createRequest("/orders"), ada);
    expect(request.url).toBe("/orders");
    expect(request.user).toEqual(ada);
  });

  it("leaves the original request untouched", () => {
    const original = createRequest("/orders");
    attachUser(original, ada);
    expect(original.user).toBeUndefined();
  });

  it("still works with the library's own functions", () => {
    const request = withHeader(attachUser(createRequest("/orders"), ada), "x", "1");
    expect(describeRequest(request)).toBe("/orders [1]");
    expect(requestOwner(request)).toBe("Ada");
  });

  it("falls back when nobody is attached", () => {
    expect(requestOwner(createRequest("/health"))).toBe("anonymous");
  });
});

describe("declare global", () => {
  it("falls back to dev when nothing is set", () => {
    globalThis.appBuild = undefined;
    expect(currentBuild()).toBe("dev");
  });

  it("really writes to globalThis", () => {
    setBuild("1.2.3");
    expect(currentBuild()).toBe("1.2.3");
    expect(globalThis.appBuild).toBe("1.2.3");
  });
});

describe("class + namespace merging", () => {
  it("adds statics to the class", () => {
    expect(Money.ZERO.cents).toBe(0);
    expect(Money.fromPounds(1.5).cents).toBe(150);
  });

  it("produces real instances", () => {
    expect(Money.fromPounds(2)).toBeInstanceOf(Money);
    expect(Money.ZERO.plus(Money.fromPounds(2)).cents).toBe(200);
  });

  it("leaves instances alone", () => {
    expect(Object.keys(new Money(5))).toEqual(["cents"]);
  });
});
