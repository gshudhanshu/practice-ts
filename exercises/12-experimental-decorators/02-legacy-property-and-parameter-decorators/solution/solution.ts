/**
 * Solution — 12/02 Legacy property and parameter decorators
 */

export const labels = new Map<string, string>();

export const requiredParams = new Map<string, number[]>();

export const injectionTokens = new WeakMap<object, (string | undefined)[]>();

export function label(
  text: string,
): (target: object, propertyKey: string) => void {
  return function (_target: object, propertyKey: string): void {
    // Two arguments, no descriptor. Recording is genuinely all this can do:
    // the property does not exist yet — it is created per instance, later.
    labels.set(propertyKey, text);
  };
}

export function required(
  _target: object,
  propertyKey: string,
  parameterIndex: number,
): void {
  const existing = requiredParams.get(propertyKey);
  if (existing === undefined) {
    requiredParams.set(propertyKey, [parameterIndex]);
    return;
  }
  existing.push(parameterIndex);
}

export function validate<Args extends unknown[], Return>(
  _target: object,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<(...args: Args) => Return>,
): void {
  const original = descriptor.value;
  if (original === undefined) return;

  descriptor.value = function (this: unknown, ...args: Args): Return {
    // Read the side table at CALL time, not at decoration time. Parameter
    // decorators run before method decorators on the same member, but reading
    // late is the habit to keep — it is what lets separate decorators cooperate.
    const indices = requiredParams.get(propertyKey) ?? [];
    for (const index of indices) {
      if (args[index] === undefined) {
        throw new Error(`${propertyKey}: argument ${index} is required`);
      }
    }
    return original.call(this, ...args);
  };
}

export function Inject(
  token: string,
): (
  target: object,
  propertyKey: string | symbol | undefined,
  parameterIndex: number,
) => void {
  return function (
    target: object,
    _propertyKey: string | symbol | undefined,
    parameterIndex: number,
  ): void {
    // For a CONSTRUCTOR parameter, `target` is the class itself and
    // `propertyKey` is `undefined` — there is no member to name.
    const tokens = injectionTokens.get(target) ?? [];
    // Assign by index. Parameter decorators are applied right to left, so a
    // `push` would record the tokens backwards.
    tokens[parameterIndex] = token;
    injectionTokens.set(target, tokens);
  };
}

export function resolve<T>(
  ctor: {
    new (...args: never[]): T;
    readonly length: number;
    readonly name: string;
  },
  container: ReadonlyMap<string, unknown>,
): T {
  const tokens = injectionTokens.get(ctor) ?? [];
  const args: unknown[] = [];

  // Walk the constructor's declared arity, not the recorded tokens: an
  // undecorated trailing parameter leaves no entry, and constructing with too
  // few arguments would silently pass `undefined`.
  for (let index = 0; index < ctor.length; index += 1) {
    const token = tokens[index];
    if (token === undefined) {
      throw new Error(`${ctor.name}: parameter ${index} is not injectable`);
    }
    if (!container.has(token)) {
      throw new Error(`no provider for ${token}`);
    }
    args.push(container.get(token));
  }

  // `Reflect.construct` is the only way to spread a runtime array into `new`.
  // It returns `any`, so pin it to `T` on the way out rather than casting.
  const instance: T = Reflect.construct(ctor, args);
  return instance;
}

/* ── The subjects ─────────────────────────────────────────────────────────── */

export function makeProfile() {
  class Profile {
    @label("Email address")
    email = "";

    @label("Display name")
    name = "";

    id = 0;
  }

  return Profile;
}

export function makeNoteService() {
  class NoteService {
    readonly saved: string[] = [];

    @validate
    save(@required name: string, note?: string): string {
      const entry = note === undefined ? name : `${name}: ${note}`;
      this.saved.push(entry);
      return entry;
    }
  }

  return NoteService;
}

export function makeGreeting() {
  class Greeting {
    constructor(
      @Inject("greeting") readonly greeting: string,
      @Inject("name") readonly name: string,
    ) {}

    say(): string {
      return `${this.greeting}, ${this.name}`;
    }
  }

  return Greeting;
}

export function makePartial() {
  class Partial {
    constructor(
      @Inject("greeting") readonly greeting: string,
      readonly name: string,
    ) {}
  }

  return Partial;
}
