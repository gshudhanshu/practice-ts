import { record } from "./registry";

record("codec");

/**
 * A class is a type AND a value. `import type { Codec }` would let you annotate
 * with it and then fail on `new Codec(…)` — which is the distinction this
 * exercise is about.
 */
export class Codec {
  constructor(readonly separator: string) {}

  encode(parts: readonly string[]): string {
    return parts.join(this.separator);
  }
}
