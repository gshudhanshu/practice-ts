/**
 * Solution — 11/03 Class decorators and decorator factories
 */

export type AnyClass = {
  new (...args: never[]): object;
  readonly prototype: object;
  readonly name: string;
};

export const registry = new Map<string, AnyClass>();

export const trail: string[] = [];

// `Class | void` so that both a replacing decorator and a side-effect-only one
// fit the same alias.
export type StandardClassDecorator<Class extends AnyClass> = (
  target: Class,
  context: ClassDecoratorContext<Class>,
) => Class | void;

export function sealed<Class extends AnyClass>(
  target: Class,
  _context: ClassDecoratorContext<Class>,
): void {
  // Two separate objects: the constructor holds statics, the prototype holds
  // methods. Sealing one does not seal the other, and neither seals instances.
  Object.seal(target);
  Object.seal(target.prototype);
}

export function registerAs(id: string) {
  // Runs when the decorator EXPRESSION is evaluated — once, as the class is
  // being defined, before any decorator is applied.
  return function <Class extends AnyClass>(
    target: Class,
    _context: ClassDecoratorContext<Class>,
  ): void {
    // Runs when the decorator is APPLIED.
    registry.set(id, target);
  };
}

export function singleton<Class extends AnyClass>(
  target: Class,
  _context: ClassDecoratorContext<Class>,
): Class {
  let instance: object | undefined;

  // `new Proxy(target, handler)` is typed `<T extends object>(t: T, …) => T`,
  // so the return type is exactly `Class` — no cast, and no mixin constraint to
  // fight. Subclassing `target` would need `new (...args: any[]) => …`.
  return new Proxy(target, {
    construct(inner, args, newTarget): object {
      const existing = instance;
      if (existing !== undefined) return existing;

      // `Reflect.construct` returns `any`, so pin it to `object` on the way in
      // rather than letting `any` leak into the trap's return type.
      const created: object = Reflect.construct(inner, args, newTarget);
      instance = created;
      return created;
    },
  });
}

export function trace(label: string) {
  // Evaluation: the factory call itself.
  trail.push(`eval:${label}`);

  return function <Class extends AnyClass>(
    _target: Class,
    context: ClassDecoratorContext<Class>,
  ): void {
    // Application: the decorator running.
    trail.push(`apply:${label}`);

    // Initialization: after every decorator on the class has been applied, with
    // `this` bound to the finished class.
    context.addInitializer(function (this: Class): void {
      trail.push(`ready:${label}:${this.name}`);
    });
  };
}

/* ── The subjects ─────────────────────────────────────────────────────────── */

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
