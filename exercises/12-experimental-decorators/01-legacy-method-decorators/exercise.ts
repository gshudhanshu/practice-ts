/**
 * Exercise 12/01 — Legacy method decorators
 *
 * This section is the OTHER decorator implementation: the one TypeScript
 * shipped in 2015, years before TC39 settled on a design. It is enabled per
 * project by `"experimentalDecorators": true`, which is already in this
 * exercise's own `tsconfig.json`.
 *
 * Why learn it at all, when section 11 is the future? Because Angular and
 * NestJS still require it, TypeORM and class-validator still require it, and
 * you cannot mix the two flavours in one compilation. Recognising which one a
 * codebase uses — and being able to write both — is the practical skill.
 *
 * A legacy METHOD decorator receives three arguments:
 *
 *   (target, propertyKey, descriptor)
 *
 *   target       the PROTOTYPE for an instance method, the CONSTRUCTOR for a
 *                static one. Not the instance, ever.
 *   propertyKey  the member's name
 *   descriptor   the PropertyDescriptor, before it is installed
 *
 * You change behaviour by mutating `descriptor.value` — or by returning a new
 * descriptor, which replaces it. Compare that with section 11, where you are
 * handed the function itself and return a replacement.
 *
 * Read README.md first. Replace every TODO.
 */

/** What `logged` records. */
export type CallRecord = { method: string; args: readonly unknown[] };

/** What `describeTarget` records. */
export type TargetRecord = { key: string; isStatic: boolean };

export const log: CallRecord[] = [];
export const descriptions: TargetRecord[] = [];

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Record the call, then run the original method unchanged.
//
//   calculator.add(1, 2)  ->  pushes { method: "add", args: [1, 2] }, returns 3
//
// Mutate `descriptor.value`. The replacement must be a `function` expression
// with an explicit `this` parameter, forwarding with `original.call(this, …)` —
// exactly as in 11/01, because the wrapping problem is the same.
//
// `TypedPropertyDescriptor<T>` is the built-in typed form of
// `PropertyDescriptor`; its `value` is `T | undefined`, so narrow before use
// rather than reaching for `!`.
export function logged<Args extends unknown[], Return>(
  _target: object,
  _propertyKey: string,
  _descriptor: TypedPropertyDescriptor<(...args: Args) => Return>,
): void {
  throw new Error("TODO 1: implement logged");
}

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// Make the method non-writable, so nobody can monkey-patch it.
//
//   instance.frozen = () => "hacked"   ->  throws TypeError (modules are strict)
//
// This one needs no wrapping at all — a descriptor has flags as well as a
// value, and a legacy decorator can set them. There is no equivalent in the
// standard flavour, which never exposes the descriptor.
export function readonlyMethod(
  _target: object,
  _propertyKey: string,
  _descriptor: PropertyDescriptor,
): void {
  throw new Error("TODO 2: implement readonlyMethod");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// A FACTORY: if the method throws, swallow the error and return `fallback`.
//
//   @defaultOnError(-1)
//   risky(n: number): number { if (n < 0) throw new RangeError("nope"); return n * 2 }
//
//   risky(5)   ->  10
//   risky(-1)  ->  -1
//
// Factories work identically in both flavours: a function returning a decorator.
// The only difference is the signature of what it returns.
export function defaultOnError<Return>(
  _fallback: Return,
): <Args extends unknown[]>(
  target: object,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<(...args: Args) => Return>,
) => void {
  throw new Error("TODO 3: implement defaultOnError");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Record what `target` actually is.
//
//   an instance method  ->  { key: "instanceMethod", isStatic: false }
//   a static method     ->  { key: "staticMethod",   isStatic: true  }
//
// This is the legacy quirk worth knowing: `target` is the PROTOTYPE for an
// instance member and the CONSTRUCTOR for a static one. A constructor is a
// function; a prototype is not — that is the whole test.
//
// (Section 11 replaces this guessing game with `context.static`.)
export function describeTarget(
  _target: object,
  _propertyKey: string,
  _descriptor: PropertyDescriptor,
): void {
  throw new Error("TODO 4: implement describeTarget");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// Make the method enumerable — by RETURNING a new descriptor rather than
// mutating the one you were given.
//
//   Object.keys(Widget.prototype)  ->  ["shown"]     (not "hidden")
//
// Class methods are non-enumerable by default, which is why `hidden` never
// appears. Returning a descriptor is the second of the two mechanisms a legacy
// decorator has; the returned object replaces the original wholesale, so copy
// the rest of it across.
export function visible(
  _target: object,
  _propertyKey: string,
  _descriptor: PropertyDescriptor,
): PropertyDescriptor {
  throw new Error("TODO 5: implement visible");
}

/* ── The subjects ──────────────────────────────────────────────────────────
 * Inside factories so a starter that throws during decoration cannot kill test
 * collection (CONVENTIONS rule 2), and so each test gets a fresh class.
 * ----------------------------------------------------------------------- */

export function makeCalculator() {
  class Calculator {
    @logged
    add(a: number, b: number): number {
      return a + b;
    }
  }

  return Calculator;
}

export function makeSafe() {
  class Safe {
    @readonlyMethod
    frozen(): string {
      return "frozen";
    }

    open(): string {
      return "open";
    }
  }

  return Safe;
}

export function makeRisky() {
  class Risky {
    @defaultOnError(-1)
    parse(n: number): number {
      if (n < 0) throw new RangeError("negative");
      return n * 2;
    }
  }

  return Risky;
}

export function makeProbe() {
  class Probe {
    @describeTarget
    instanceMethod(): void {}

    @describeTarget
    static staticMethod(): void {}
  }

  return Probe;
}

export function makeWidget() {
  class Widget {
    @visible
    shown(): string {
      return "shown";
    }

    hidden(): string {
      return "hidden";
    }
  }

  return Widget;
}
