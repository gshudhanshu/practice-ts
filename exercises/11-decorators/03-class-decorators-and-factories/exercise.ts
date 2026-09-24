/**
 * Exercise 11/03 — Class decorators and decorator factories
 *
 * A class decorator is the same two-argument function as everything else:
 *
 *   (target, context) => replacement | void
 *
 * `target` is the constructor, `context` is a `ClassDecoratorContext`. Return a
 * constructor to replace the class; return nothing to decorate for effect.
 *
 * The second idea here is the FACTORY. A decorator takes fixed arguments, so to
 * parameterise one you write a function that RETURNS a decorator:
 *
 *   @registerAs("connection")     ->  registerAs("connection") is called first,
 *                                     and the decorator it returns is applied
 *
 * That distinction — EVALUATION (calling the factory) versus APPLICATION
 * (running the decorator) — is the whole of TODO 5, and it is a stock interview
 * question. They happen at different times and in opposite orders.
 *
 * Read README.md first. Replace every TODO.
 */

/** Any concrete class, with the two static members these decorators touch. */
export type AnyClass = {
  new (...args: never[]): object;
  readonly prototype: object;
  readonly name: string;
};

/** Where `registerAs` files classes away. */
export const registry = new Map<string, AnyClass>();

/** Where `trace` records what happened, and when. */
export const trail: string[] = [];

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Name the shape of a class decorator.
//
//   Parameters<StandardClassDecorator<C>>[0]         ->  C
//   Parameters<StandardClassDecorator<C>>[1]["kind"] ->  "class"
//   ReturnType<StandardClassDecorator<C>>            ->  C | void
//
// The `| void` matters: a decorator that only causes a side effect returns
// nothing, and both forms have to fit the same alias.
export type StandardClassDecorator<Class extends AnyClass> = unknown;

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// Seal the class and its prototype, so no new static or prototype member can be
// added afterwards.
//
//   Object.isSealed(Settings)            ->  true
//   Object.isSealed(Settings.prototype)  ->  true
//
// Return nothing. Instances are NOT sealed — sealing the prototype does not
// touch objects created from it, and the tests check that.
export function sealed<Class extends AnyClass>(
  _target: Class,
  _context: ClassDecoratorContext<Class>,
): void {
  throw new Error("TODO 2: implement sealed");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// A FACTORY: takes an id, returns a class decorator that files the class in
// `registry` under that id.
//
//   @registerAs("connection")
//   class Connection {}
//
//   registry.get("connection")  ->  Connection
//
// The outer function runs when the decorator EXPRESSION is evaluated; the inner
// one when it is APPLIED. Note the return type: a factory's job is to produce a
// decorator, and keeping the produced one generic is what lets it fit any class.
export function registerAs(
  _id: string,
): <Class extends AnyClass>(
  target: Class,
  context: ClassDecoratorContext<Class>,
) => void {
  throw new Error("TODO 3: implement registerAs");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Replace the class with one that can only ever be constructed once.
//
//   const a = new Pool(10);
//   const b = new Pool(20);   ->  b === a, and b.size is still 10
//
// Returning a subclass is the obvious move and it does not work here: TypeScript
// requires a mixin base to be `new (...args: any[]) => …`, and `any` is banned
// in this repo (see the explanation).
//
// A `Proxy` with a `construct` trap does the job with no cast at all, because
// `new Proxy(target, handler)` is typed to return the target's own type.
export function singleton<Class extends AnyClass>(
  _target: Class,
  _context: ClassDecoratorContext<Class>,
): Class {
  throw new Error("TODO 4: implement singleton");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// A factory that records the three moments in a class decorator's life:
//
//   trace(label)                      ->  push `eval:${label}`
//   the returned decorator runs       ->  push `apply:${label}`
//   context.addInitializer callback   ->  push `ready:${label}:${this.name}`
//
// For a class with two of them stacked, the order is fixed by the language, and
// the test asserts it exactly. Work out what it must be before you look.
//
// The initializer runs with `this` bound to the finished class, so `this.name`
// is the class name.
export function trace(
  _label: string,
): <Class extends AnyClass>(
  target: Class,
  context: ClassDecoratorContext<Class>,
) => void {
  throw new Error("TODO 5: implement trace");
}

/* ── The subjects ──────────────────────────────────────────────────────────
 * Inside factories so a starter that throws during decoration cannot kill test
 * collection (CONVENTIONS rule 2), and so each test gets a fresh class.
 * ----------------------------------------------------------------------- */

export function makeSettings() {
  @sealed
  class Settings {
    theme = "dark";
  }

  return Settings;
}

export function makeConnection() {
  @registerAs("connection")
  class Connection {
    constructor(readonly host: string) {}
  }

  return Connection;
}

export function makePool() {
  @singleton
  class Pool {
    constructor(readonly size: number) {}
  }

  return Pool;
}

export function makeService() {
  @trace("outer")
  @trace("inner")
  class Service {
    run(): string {
      return "ok";
    }
  }

  return Service;
}
