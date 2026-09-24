/**
 * Solution — 20/06 Deep variants
 */

export type Atom =
  | string
  | number
  | boolean
  | bigint
  | symbol
  | null
  | undefined
  | Date
  | RegExp
  | ((...args: never[]) => unknown);

export type Depth = 0 | 1 | 2 | 3 | 4 | 5;

export interface Category {
  name: string;
  children: Category[];
}

export type Config = {
  name: string;
  createdAt: Date;
  onSave: (value: string) => void;
  server: {
    host: string;
    port: number;
    tls: { enabled: boolean };
  };
  tags: string[];
  range: [number, number];
  categories: Category[];
};

// Stop at a leaf, otherwise map homomorphically and recurse on the value type.
//
// Arrays and tuples need no special case: a homomorphic mapped type over an
// array produces an array and over a tuple produces a tuple, so `string[]`
// becomes `readonly string[]` and `[number, number]` becomes
// `readonly [number, number]` for free.
//
// The recursion is lazy, so a self-referential type such as `Category`
// terminates instead of expanding forever.
export type DeepReadonly<T> = T extends Atom
  ? T
  : { readonly [K in keyof T]: DeepReadonly<T[K]> };

// Exactly the mirror: `-readonly` instead of `readonly`.
export type DeepMutable<T> = T extends Atom
  ? T
  : { -readonly [K in keyof T]: DeepMutable<T[K]> };

// Same shape again with the optional modifier. The array caveat falls out of
// the homomorphic mapping: mapping `?` over `number[]` makes the ELEMENTS
// optional, giving `(number | undefined)[]`.
export type DeepPartial<T> = T extends Atom
  ? T
  : { [K in keyof T]?: DeepPartial<T[K]> };

// TypeScript has no type-level arithmetic, so you count down by INDEXING a
// tuple: `Prev[3]` is `2`. Position 0 is `never`, which can never be reached
// because the `D extends 0` branch fires first.
type Prev = [never, 0, 1, 2, 3, 4];

// The depth check comes FIRST: at zero budget the type is returned untouched,
// however deep it goes. Then the same two moves as `DeepReadonly`, with the
// budget decremented on the recursive call.
export type DeepReadonlyUpTo<T, D extends Depth = 3> = D extends 0
  ? T
  : T extends Atom
    ? T
    : { readonly [K in keyof T]: DeepReadonlyUpTo<T[K], Prev[D]> };

export function deepFreeze(config: Config): DeepReadonly<Config> {
  freeze(config);

  // No cast. A mutable object is assignable to its deeply-readonly type —
  // `readonly` is not enforced across assignment, and `string[]` is assignable
  // to `readonly string[]`. The type change is a promise to the CALLER; the
  // runtime enforcement is what `Object.freeze` just did.
  return config;
}

function freeze(value: unknown): void {
  // `typeof null === "object"`, so the null check is not optional (02/04).
  if (typeof value !== "object" || value === null) return;

  // The cycle guard, and the reason it must come before the recursion: a
  // graph that points back at itself would otherwise never terminate. It also
  // makes a second call to `deepFreeze` free.
  if (Object.isFrozen(value)) return;

  Object.freeze(value);

  // `Object.values` covers arrays (elements) and plain objects (own enumerable
  // properties) in one call. A frozen array rejects `push` at runtime, which is
  // what the readonly array type promises at compile time.
  for (const child of Object.values(value)) {
    freeze(child);
  }
}
