/**
 * Solution — 12/01 Legacy method decorators
 */

export type CallRecord = { method: string; args: readonly unknown[] };
export type TargetRecord = { key: string; isStatic: boolean };

export const log: CallRecord[] = [];
export const descriptions: TargetRecord[] = [];

export function logged<Args extends unknown[], Return>(
  _target: object,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<(...args: Args) => Return>,
): void {
  const original = descriptor.value;
  // `TypedPropertyDescriptor.value` is optional, because a descriptor may be an
  // accessor pair instead. Narrowing beats `!`, and it documents the assumption.
  if (original === undefined) return;

  // Mutating the descriptor IS the legacy mechanism. The object has not been
  // installed on the prototype yet, so this is not monkey-patching.
  descriptor.value = function (this: unknown, ...args: Args): Return {
    log.push({ method: propertyKey, args });
    return original.call(this, ...args);
  };
}

export function readonlyMethod(
  _target: object,
  _propertyKey: string,
  descriptor: PropertyDescriptor,
): void {
  // No wrapping at all — the descriptor's flags are part of what a legacy
  // decorator can reach. The standard flavour never exposes them.
  descriptor.writable = false;
}

export function defaultOnError<Return>(
  fallback: Return,
): <Args extends unknown[]>(
  target: object,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<(...args: Args) => Return>,
) => void {
  // The factory runs at evaluation time and closes over `fallback`; the
  // decorator it returns runs at application time. Identical to section 11 —
  // only the inner signature differs.
  return function <Args extends unknown[]>(
    _target: object,
    _propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: Args) => Return>,
  ): void {
    const original = descriptor.value;
    if (original === undefined) return;

    descriptor.value = function (this: unknown, ...args: Args): Return {
      try {
        return original.call(this, ...args);
      } catch {
        return fallback;
      }
    };
  };
}

export function describeTarget(
  target: object,
  propertyKey: string,
  _descriptor: PropertyDescriptor,
): void {
  // A constructor is callable; a prototype object is not. That is the only way
  // a legacy decorator can tell a static member from an instance one.
  descriptions.push({ key: propertyKey, isStatic: typeof target === "function" });
}

export function visible(
  _target: object,
  _propertyKey: string,
  descriptor: PropertyDescriptor,
): PropertyDescriptor {
  // The second mechanism: return a descriptor and it replaces the original
  // wholesale — so spread the old one first or you lose `value`.
  return { ...descriptor, enumerable: true };
}

/* ── The subjects ─────────────────────────────────────────────────────────── */

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
