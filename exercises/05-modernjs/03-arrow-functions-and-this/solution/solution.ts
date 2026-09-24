/**
 * Solution — 05/03 Arrow functions, closures and `this`
 */

export type Person = {
  name: string;
  age: number;
};

export function makeCounter(): { increment: () => void; value: () => number } {
  // `count` lives in the closure. It is not a property of anything, so there
  // is no `this` to lose and nothing for a caller to reach.
  let count = 0;

  return {
    increment: () => {
      count += 1;
    },
    value: () => count,
  };
}

export class Timer {
  #ticks = 0;

  // An arrow function stored as a class FIELD. Arrows have no `this` of their
  // own — they close over the `this` in scope where they were created, which
  // for a field initialiser is the instance. So the binding travels with the
  // function value and survives detachment.
  tick = (): void => {
    this.#ticks += 1;
  };

  get count(): number {
    return this.#ticks;
  }
}

export class Greeter {
  constructor(private readonly greeting: string) {}

  greetAll(names: readonly string[]): string[] {
    // The arrow callback inherits `this` from `greetAll`. A `function () {}`
    // here would get its own `this` (undefined in a module, which is strict
    // mode) and throw on `this.greeting`.
    return names.map((name) => `${this.greeting}, ${name}`);
  }
}

// A `this` parameter must come FIRST and is not a real argument — it exists
// only for type checking and is erased from the emitted JavaScript.
export function describePerson(this: Person): string {
  return `${this.name} (${this.age})`;
}

export function once(fn: () => number): () => number {
  // Storing the result in an optional BOX rather than a bare variable means a
  // falsy result (0, NaN) is still recognised as "already computed".
  let cached: { value: number } | undefined;

  return () => {
    if (cached === undefined) {
      cached = { value: fn() };
    }
    return cached.value;
  };
}
