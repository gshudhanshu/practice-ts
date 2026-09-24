/**
 * Exercise 05/03 — Arrow functions, closures and `this`
 *
 * `this` is the part of JavaScript that TypeScript can actually help with —
 * but only if you tell it what `this` is meant to be. This exercise covers the
 * three situations that come up constantly: detached methods, callbacks inside
 * methods, and explicit `this` parameters.
 *
 * Read README.md first. Replace every TODO.
 */

export type Person = {
  name: string;
  age: number;
};

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// A counter built from a CLOSURE — no class, no `this`, and the count must not
// be reachable from outside.
//   const c = makeCounter();
//   c.increment(); c.increment();
//   c.value();  // 2
//
// Two independent counters must not share state.
export function makeCounter(): { increment: () => void; value: () => number } {
  throw new Error("TODO 1: implement makeCounter");
}

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// `tick` must keep working when it is DETACHED from the instance:
//   const timer = new Timer();
//   const fn = timer.tick;   // no call, just a reference
//   fn(); fn();
//   timer.count;             // 2
//
// A normal method would lose `this` here and throw. Change how `tick` is
// declared so that it does not.
export class Timer {
  #ticks = 0;

  tick(): void {
    this.#ticks += 1;
  }

  get count(): number {
    return this.#ticks;
  }
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// `greetAll` must use `this.greeting` inside the callback passed to `.map`.
// Write the callback so that `this` still refers to the instance.
export class Greeter {
  constructor(private readonly greeting: string) {}

  greetAll(names: readonly string[]): string[] {
    throw new Error("TODO 3: implement greetAll");
  }
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// A standalone function that is only valid when called with a Person as its
// `this`. Declare that with a `this` PARAMETER — a fake first parameter that
// exists only at compile time and is erased from the output.
//   describePerson.call({ name: "Ada", age: 36 })  ->  "Ada (36)"
//
// Calling it as a plain `describePerson()` must be a compile error.
export function describePerson(): string {
  throw new Error("TODO 4: implement describePerson");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// Wrap a function so it runs AT MOST ONCE; every later call returns the first
// result without invoking `fn` again.
//   const load = once(expensive);
//   load(); load(); load();   // expensive ran exactly once
export function once(fn: () => number): () => number {
  throw new Error("TODO 5: implement once");
}
