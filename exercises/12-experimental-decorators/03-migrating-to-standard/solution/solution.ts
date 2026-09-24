/**
 * Solution — 12/03 Migrating from legacy to standard decorators
 */

export type LogEntry = {
  flavour: "legacy" | "standard";
  method: string;
  args: readonly unknown[];
};

export const log: LogEntry[] = [];

export type StandardMethodDecorator<This, Args extends unknown[], Return> = (
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<
    This,
    (this: This, ...args: Args) => Return
  >,
) => ((this: This, ...args: Args) => Return) | void;

export function legacyLogged<Args extends unknown[], Return>(
  _target: object,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<(...args: Args) => Return>,
): void {
  const original = descriptor.value;
  if (original === undefined) return;

  // Legacy: reach into the descriptor and swap the value.
  descriptor.value = function (this: unknown, ...args: Args): Return {
    log.push({ flavour: "legacy", method: propertyKey, args });
    return original.call(this, ...args);
  };
}

export function standardLogged<This, Args extends unknown[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<
    This,
    (this: This, ...args: Args) => Return
  >,
): (this: This, ...args: Args) => Return {
  const method = String(context.name);

  // Standard: you are handed the function, you return its replacement. The
  // wrapper body is character-for-character the same as the legacy one — all
  // the difference is in the plumbing around it.
  return function (this: This, ...args: Args): Return {
    log.push({ flavour: "standard", method, args });
    return target.call(this, ...args);
  };
}

export function applyStandardMethodDecorator<
  Key extends string,
  Args extends unknown[],
  Return,
  This extends Record<Key, (this: This, ...args: Args) => Return>,
>(
  prototype: This,
  name: Key,
  method: (this: This, ...args: Args) => Return,
  decorator: StandardMethodDecorator<This, Args, Return>,
): (instance: This) => void {
  const initializers: ((this: This) => void)[] = [];
  let finished = false;

  const context: ClassMethodDecoratorContext<
    This,
    (this: This, ...args: Args) => Return
  > = {
    kind: "method",
    name,
    static: false,
    private: false,
    access: {
      has: (object: This): boolean => name in object,
      // `This extends Record<Key, …>` — the 08/02 trick — is what makes this
      // indexed read typed. Without it, `object[name]` for a `string` key is
      // untyped and the whole runtime needs a cast.
      get: (object: This): ((this: This, ...args: Args) => Return) =>
        object[name],
    },
    addInitializer(initializer: (this: This) => void): void {
      // The real runtime throws here too — once decoration is over there is
      // nowhere left to put an initializer.
      if (finished) {
        throw new TypeError(
          "Cannot add initializers after decoration has completed",
        );
      }
      initializers.push(initializer);
    },
    metadata: {},
  };

  const replacement = decorator(method, context);
  finished = true;

  if (replacement !== undefined) {
    // Methods are non-enumerable; installing with a plain assignment would make
    // the replacement show up in `Object.keys(prototype)`.
    Object.defineProperty(prototype, name, {
      value: replacement,
      configurable: true,
      writable: true,
      enumerable: false,
    });
  }

  return function (instance: This): void {
    for (const initializer of initializers) initializer.call(instance);
  };
}

export function standardBound<
  This extends object,
  Args extends unknown[],
  Return,
>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<
    This,
    (this: This, ...args: Args) => Return
  >,
): void {
  const name = context.name;

  context.addInitializer(function (this: This): void {
    Object.defineProperty(this, name, {
      value: target.bind(this),
      configurable: true,
      writable: true,
      enumerable: false,
    });
  });
}

export function legacyBound<Args extends unknown[], Return>(
  _target: object,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<(...args: Args) => Return>,
): TypedPropertyDescriptor<(...args: Args) => Return> {
  const original = descriptor.value;
  if (original === undefined) return descriptor;

  // Legacy has no per-instance hook, so the prototype member becomes a getter.
  // The first read from an instance binds, caches on that instance, and returns
  // the bound copy; later reads never reach the getter again.
  return {
    configurable: true,
    enumerable: false,
    get(this: unknown): (...args: Args) => Return {
      const bound = original.bind(this);
      Object.defineProperty(this, propertyKey, {
        value: bound,
        configurable: true,
        writable: true,
        enumerable: false,
      });
      return bound;
    },
  };
}

/* ── The subjects ─────────────────────────────────────────────────────────── */

export function makeLegacyGreeter() {
  class LegacyGreeter {
    @legacyLogged
    greet(name: string): string {
      return `hi ${name}`;
    }
  }

  return LegacyGreeter;
}

export function makeStandardGreeter() {
  class StandardGreeter {
    greet(name: string): string {
      return `hi ${name}`;
    }
  }

  applyStandardMethodDecorator(
    StandardGreeter.prototype,
    "greet",
    StandardGreeter.prototype.greet,
    standardLogged,
  );

  return StandardGreeter;
}

export function makeLegacyCounter() {
  class LegacyCounter {
    count = 0;

    @legacyBound
    inc(): void {
      this.count += 1;
    }

    unbound(): void {
      this.count -= 1;
    }
  }

  return LegacyCounter;
}

export function makeStandardCounter() {
  let initialize: (instance: StandardCounter) => void = () => {};

  class StandardCounter {
    count = 0;

    constructor() {
      initialize(this);
    }

    inc(): void {
      this.count += 1;
    }

    unbound(): void {
      this.count -= 1;
    }
  }

  initialize = applyStandardMethodDecorator(
    StandardCounter.prototype,
    "inc",
    StandardCounter.prototype.inc,
    standardBound,
  );

  return StandardCounter;
}
