/**
 * Solution — 14/03 Declaration merging & augmentation
 */

import { createRequest, type Request } from "./http-lite";

export type JobStatus = "queued" | "running" | "done";

export type SessionUser = {
  id: string;
  name: string;
};

export interface Job {
  id: string;
  title: string;
}

// Two declarations, one type. Order does not matter for members; it only
// matters for overload resolution, where later declarations come first.
export interface Job {
  retries: number;
  status: JobStatus;
}

export function describeJob(job: Job): string {
  return `${job.title} (${job.status}, ${job.retries} retries)`;
}

export function formatJob(job: Job): string {
  return `${job.id}: ${job.title}`;
}

// A namespace merges with the function of the same name, giving it properties.
// The namespace must come AFTER the function declaration.
export namespace formatJob {
  export const UNKNOWN = "unknown job";

  export function orUnknown(job: Job | undefined): string {
    // `formatJob` here is the merged entity: the function, callable, with
    // `UNKNOWN` hanging off it.
    return job === undefined ? UNKNOWN : formatJob(job);
  }
}

// Module augmentation. The specifier is the one you would import from, and the
// body is resolved in THIS file's scope — which is why `SessionUser` needs no
// import inside it.
declare module "./http-lite" {
  interface Request {
    user?: SessionUser;
  }
}

export function attachUser(request: Request, user: SessionUser): Request {
  // A new object, matching the library's own style. `user` is now a real member
  // of `Request`, so no cast and no widening.
  return { ...request, user };
}

export function requestOwner(request: Request): string {
  return request.user?.name ?? "anonymous";
}

// `declare global` reaches the global scope from inside a module. `var` (not
// `let` or `const`) is what puts the name on `globalThis`.
declare global {
  var appBuild: string | undefined;
}

export function setBuild(version: string): void {
  globalThis.appBuild = version;
}

export function currentBuild(): string {
  return globalThis.appBuild ?? "dev";
}

export class Money {
  constructor(readonly cents: number) {}

  plus(other: Money): Money {
    return new Money(this.cents + other.cents);
  }
}

// A class and a namespace merge, so these become statics — including `ZERO`,
// whose type is the class the namespace is merging into.
export namespace Money {
  export function fromPounds(pounds: number): Money {
    return new Money(Math.round(pounds * 100));
  }

  export const ZERO = new Money(0);
}

export { createRequest };
export type { Request };
