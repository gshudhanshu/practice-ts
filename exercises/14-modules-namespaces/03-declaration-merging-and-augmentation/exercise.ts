/**
 * Exercise 14/03 — Declaration merging & augmentation
 *
 * 06/04 introduced the rule: an interface declared twice MERGES, a type alias
 * declared twice is an error. This exercise is about what that rule is *for* —
 * reaching into declarations you do not own and adding to them.
 *
 * Four shapes, all built on the same mechanic:
 *
 *   interface X {} + interface X {}    two halves of one type
 *   function f() {} + namespace f {}   properties on a function
 *   class C {} + namespace C {}        statics on a class
 *   declare module "./m" { … }         reach into another module
 *   declare global { … }               reach into the global scope
 *
 * `./http-lite.ts` sits next to this file and stands in for a library you
 * cannot edit. TODO 3 adds a field to its `Request` interface from here, and
 * the test checks the change landed on the ORIGINAL type, not a copy.
 *
 * Read README.md first. Replace every TODO.
 */

import { createRequest, type Request } from "./http-lite";

export type JobStatus = "queued" | "running" | "done";

export type SessionUser = {
  id: string;
  name: string;
};

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Merge a second declaration into `Job` so the finished interface has FOUR
// members: `id` and `title` from here, plus `retries: number` and
// `status: JobStatus`.
//
// Do not edit the declaration below — add another one. The point is that two
// separate declarations become one type, which is what makes every other TODO
// in this file possible.
export interface Job {
  id: string;
  title: string;
}

export function describeJob(job: Job): string {
  // "deploy (running, 2 retries)"
  throw new Error("TODO 1: implement describeJob");
}

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// A function and a namespace of the same name merge, which is how a function
// gets properties without anyone writing `Object.assign`.
//
//   formatJob(job)                 -> "j-1: deploy"
//   formatJob.UNKNOWN              -> "unknown job"
//   formatJob.orUnknown(undefined) -> "unknown job"
//   formatJob.orUnknown(job)       -> "j-1: deploy"
//
// Write the function body, then add the namespace beneath it.
export function formatJob(job: Job): string {
  throw new Error("TODO 2: implement formatJob");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// MODULE AUGMENTATION. `./http-lite` has no idea about sessions, and you cannot
// edit it. Reach in from here and add an optional `user?: SessionUser` to its
// `Request` interface:
//
//   declare module "./http-lite" {
//     interface Request { … }
//   }
//
// The specifier has to be the same one you would `import` from, and the
// augmentation body can see this file's own types — which is how `SessionUser`
// is in scope.
//
// Then implement the two functions. `attachUser` returns a NEW request; the
// library's own `withHeader` shows the style.
export function attachUser(request: Request, user: SessionUser): Request {
  throw new Error("TODO 3: implement attachUser");
}

export function requestOwner(request: Request): string {
  // The user's name, or "anonymous" when there is none.
  throw new Error("TODO 3: implement requestOwner");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// `declare global` — the same trick aimed at the global scope. Declare a global
//
//   var appBuild: string | undefined;
//
// so `globalThis.appBuild` typechecks anywhere in the project, then implement
// the two functions below. `currentBuild()` falls back to "dev".
//
// `declare global` is only legal inside a module. This file already is one.
export function setBuild(version: string): void {
  throw new Error("TODO 4: implement setBuild");
}

export function currentBuild(): string {
  throw new Error("TODO 4: implement currentBuild");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// A class and a namespace merge too, which is how you attach statics to a class
// from outside its body — including ones whose type mentions the class itself.
//
//   Money.ZERO.cents            -> 0
//   Money.fromPounds(1.5).cents -> 150
//
// Add the namespace under the class. Do not add `static` members to the class
// itself; the exercise is the merge.
export class Money {
  constructor(readonly cents: number) {}

  plus(other: Money): Money {
    return new Money(this.cents + other.cents);
  }
}

// Re-exported so the test can prove the augmentation landed on the real type.
export { createRequest };
export type { Request };
