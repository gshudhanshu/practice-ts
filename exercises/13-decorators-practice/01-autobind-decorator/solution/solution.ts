/**
 * Solution — 13/01 The autobind decorator
 */

export const callLog: string[] = [];

export const warnings: string[] = [];

// A method decorator receives the method and a context object, and RETURNS a
// replacement. The replacement is an ordinary function expression (not an
// arrow) so it has its own `this`, which the caller supplies — that is what
// keeps it usable as a method.
export function logCalls<This, Args extends unknown[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<
    This,
    (this: This, ...args: Args) => Return
  >,
): (this: This, ...args: Args) => Return {
  // `context.name` is `string | symbol`, so it needs `String(…)`. Reading it
  // once here rather than on every call is free — the decorator runs once.
  const label = String(context.name);

  return function (this: This, ...args: Args): Return {
    callLog.push(label);
    return target.call(this, ...args);
  };
}

// Autobind deliberately returns NOTHING. Returning a replacement would leave
// the method on the prototype, still detachable. Instead we register an
// initializer that runs during construction, when `this` finally exists.
export function autobind<This, Args extends unknown[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<
    This,
    (this: This, ...args: Args) => Return
  >,
): void {
  context.addInitializer(function (this: This) {
    // An OWN property shadows the prototype method, so `instance.save` is
    // already bound before anyone can detach it.
    Object.defineProperty(this, context.name, {
      value: target.bind(this),
      // Writable and configurable so a subclass, a spy or a test double can
      // still replace it. `enumerable` stays false, matching a real method —
      // otherwise the bound copy would show up in `Object.keys` and in
      // `{ ...instance }`.
      writable: true,
      configurable: true,
    });
  });
}

export function once<This extends object, Args extends unknown[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<
    This,
    (this: This, ...args: Args) => Return
  >,
): (this: This, ...args: Args) => Return {
  void context;

  // The decorator body runs ONCE per decorated method, so this map is private
  // state belonging to that method. A WeakMap keyed by instance means a
  // discarded instance takes its cache entry with it.
  //
  // The `{ value }` wrapper matters: `cache.get(this)` returning `undefined`
  // would otherwise be ambiguous between "not cached" and "cached undefined".
  const cache = new WeakMap<This, { value: Return }>();

  return function (this: This, ...args: Args): Return {
    const hit = cache.get(this);
    if (hit !== undefined) return hit.value;

    const value = target.call(this, ...args);
    cache.set(this, { value });
    return value;
  };
}

// A factory: `deprecate("…")` is called first and RETURNS the decorator. The
// returned function has to stay generic, because it will be applied to methods
// with different signatures.
export function deprecate(reason: string): <This, Args extends unknown[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<
    This,
    (this: This, ...args: Args) => Return
  >,
) => (this: This, ...args: Args) => Return {
  return function <This, Args extends unknown[], Return>(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<
      This,
      (this: This, ...args: Args) => Return
    >,
  ): (this: This, ...args: Args) => Return {
    const label = String(context.name);
    // Per-METHOD, not per-instance: one warning for the whole process, which is
    // what you want from a deprecation notice.
    let warned = false;

    return function (this: This, ...args: Args): Return {
      if (!warned) {
        warned = true;
        warnings.push(`${label} is deprecated: ${reason}`);
      }
      return target.call(this, ...args);
    };
  };
}

export class Toolbar {
  #tickets = 0;

  constructor(readonly title: string) {}

  // Applied bottom-up: `logCalls` wraps the raw method, then `autobind` binds
  // THAT wrapper. Swap the two lines and the detached copy stops logging,
  // because autobind would have captured the unwrapped method.
  @autobind
  @logCalls
  save(): string {
    return `saved: ${this.title}`;
  }

  @logCalls
  reset(): string {
    return `reset: ${this.title}`;
  }

  @once
  ticket(): number {
    this.#tickets += 1;
    return this.#tickets;
  }

  @deprecate("use save() instead")
  store(): string {
    return `stored: ${this.title}`;
  }
}
