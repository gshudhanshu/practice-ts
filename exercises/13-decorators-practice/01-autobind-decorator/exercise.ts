/**
 * Exercise 13/01 — The autobind decorator (decorators project, part 1 of 3)
 *
 * These are STANDARD (TC39) decorators — the ones TypeScript compiles when
 * `experimentalDecorators` is off and the target is ES2022 or newer. They are a
 * different feature from the old TypeScript-only decorators, with a different
 * signature and different runtime semantics.
 *
 * A method decorator is just a function:
 *
 *   (target, context) => replacementMethod | void
 *
 * `target` is the method itself. `context` describes where it was applied:
 * `context.name`, `context.kind`, `context.static`, `context.private`, and
 * `context.addInitializer(fn)` — a hook that runs when an instance is
 * constructed. Return a function to REPLACE the method; return nothing to
 * leave it alone.
 *
 * 05/03 solved "a detached method loses `this`" with an arrow-function class
 * field. This exercise solves the same problem with a decorator. The point is
 * the comparison, not the rediscovery — see the README.
 *
 * NOTE: a decorator runs when the CLASS is defined, i.e. at module load. So
 * unlike every other exercise, the starter bodies here cannot `throw` — they
 * are harmless no-ops instead. The tests still fail until you fill them in.
 *
 * Read README.md first. Replace every TODO.
 */

/** Every call to a `@logCalls` method appends its name here. */
export const callLog: string[] = [];

/** Every first call to a `@deprecate`d method appends a message here. */
export const warnings: string[] = [];

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// A method decorator that records each call, then delegates.
//
//   toolbar.reset()  ->  callLog becomes ["reset"], and "reset: …" is returned
//
// Return a REPLACEMENT method. It must forward `this` and every argument, and
// return whatever the original returned. Use `context.name` for the label
// (it is `string | symbol`, so wrap it in `String(…)`).
export function logCalls<This, Args extends unknown[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<
    This,
    (this: This, ...args: Args) => Return
  >,
): (this: This, ...args: Args) => Return {
  // TODO 1 — replace this no-op.
  void context;
  return target;
}

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// The headline decorator: make the method keep its `this` when it is detached.
//
//   const detached = toolbar.save;
//   detached();            // must work, and must still see the instance
//
// Do NOT return a replacement — a replacement still lives on the PROTOTYPE and
// is still detachable. Instead use `context.addInitializer(fn)`. For an
// instance method, `fn` runs during construction with `this` bound to the new
// instance, which is exactly when you can install a bound copy as an OWN
// property that shadows the prototype one.
//
// `Object.defineProperty(this, context.name, { … })` is the tool; make it
// `writable` and `configurable` so subclasses and test doubles can still
// replace it.
export function autobind<This, Args extends unknown[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<
    This,
    (this: This, ...args: Args) => Return
  >,
): void {
  // TODO 2 — replace this no-op.
  void target;
  void context;
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Memoise the first result, PER INSTANCE.
//
//   const a = new Toolbar("x");
//   a.ticket();   // 1
//   a.ticket();   // 1  — the body did not run again
//   new Toolbar("y").ticket();   // 1 — a different instance, its own cache
//
// The decorator body runs once per decorated method, so a `const` declared
// there is private per-method state. Key it by instance with a `WeakMap` so
// discarded instances can be collected. No `as` — a
// `WeakMap<This, { value: Return }>` is already precisely typed (the wrapper
// object distinguishes "cached `undefined`" from "not cached").
export function once<This extends object, Args extends unknown[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<
    This,
    (this: This, ...args: Args) => Return
  >,
): (this: This, ...args: Args) => Return {
  // TODO 3 — replace this no-op.
  void context;
  return target;
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// A decorator FACTORY: a function that takes configuration and returns a
// decorator. `@deprecate("use save() instead")` is a call; `@autobind` is not.
//
// On the FIRST call only, push `"<name> is deprecated: <reason>"` onto
// `warnings`, then delegate. Later calls stay silent — including calls on other
// instances, because the flag belongs to the method, not to an object.
export function deprecate(reason: string): <This, Args extends unknown[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<
    This,
    (this: This, ...args: Args) => Return
  >,
) => (this: This, ...args: Args) => Return {
  // TODO 4 — replace this no-op.
  void reason;
  return (target) => target;
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// Wire the decorators onto the class. Nothing below needs a new method body —
// only the `@…` lines are missing.
//
//   save()    @logCalls, and autobound so it survives detaching
//   reset()   @logCalls only — detaching it must still break
//   ticket()  @once
//   store()   @deprecate("use save() instead")
//
// ORDER MATTERS. Decorators are applied bottom-up: the one nearest the method
// runs first and its result is handed to the one above it. Put `@autobind`
// where it binds the LOGGING wrapper, not the raw method — otherwise the
// detached copy silently stops logging.
export class Toolbar {
  #tickets = 0;

  constructor(readonly title: string) {}

  save(): string {
    return `saved: ${this.title}`;
  }

  reset(): string {
    return `reset: ${this.title}`;
  }

  ticket(): number {
    this.#tickets += 1;
    return this.#tickets;
  }

  store(): string {
    return `stored: ${this.title}`;
  }
}
