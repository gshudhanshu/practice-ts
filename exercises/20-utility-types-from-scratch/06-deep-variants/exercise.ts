/**
 * Exercise 20/06 — CHALLENGE: deep variants
 *
 * `Partial<T>` is one level deep. Nested objects come out untouched, which is
 * almost never what you want for a config patch, a test fixture builder or a
 * frozen store:
 *
 *   Partial<{ server: { host: string; port: number } }>
 *     ->  { server?: { host: string; port: number } }
 *           …the inner object is still fully required.
 *
 * The fix is recursion, and the recursion is three lines. The interesting part
 * — and the reason `DeepPartial` is not in the standard library — is that
 * "recurse into objects" is a lie. Arrays are objects. Functions are objects.
 * `Date`, `Map`, `Set` and every class instance are objects. Recurse into all
 * of them and you produce nonsense: a `Date` becomes `{}`, a function loses its
 * call signature, and a `Map` becomes a bag of readonly methods that can still
 * mutate.
 *
 * This exercise is that honesty exercise. Everything you have built in this
 * section, plus recursion, plus knowing where it breaks.
 *
 * Read README.md first. Replace every TODO.
 */

/**
 * Given — the leaf guard: the types the recursion must NOT walk into.
 *
 * Every serious implementation has this list, and every one of them draws the
 * line in a slightly different place (`type-fest` calls the concept
 * `BuiltIns`). A function is included via `(...args: never[]) => unknown`, which
 * matches any function because parameters are contravariant (20/04).
 *
 * `Map` and `Set` are deliberately NOT in this list — the tests pin down what
 * happens to them, and the explanation covers how a library fixes it.
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

/** Given — the depth budget for TODO 4. */
export type Depth = 0 | 1 | 2 | 3 | 4 | 5;

/** Given — a self-referential type, to prove the recursion terminates. */
export interface Category {
  name: string;
  children: Category[];
}

/** Given — the fixture the runtime half uses. */
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

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// `readonly`, all the way down.
//
//   DeepReadonly<Config>["server"]["tls"]  ->  { readonly enabled: boolean }
//   DeepReadonly<Config>["tags"]           ->  readonly string[]
//   DeepReadonly<Config>["range"]          ->  readonly [number, number]
//   DeepReadonly<Config>["createdAt"]      ->  Date          (NOT walked into)
//   DeepReadonly<Config>["onSave"]         ->  (value: string) => void
//
// Two moves: stop at an `Atom`, otherwise map homomorphically and recurse.
//
// You do not need to special-case arrays or tuples. A homomorphic mapped type
// over an array produces an array, and over a tuple produces a tuple — one of
// the few pieces of genuine compiler magic in mapped types (20/01).
export type DeepReadonly<T> = unknown;

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// The inverse. `DeepMutable<DeepReadonly<Config>>` must be `Config` again.
export type DeepMutable<T> = unknown;

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Optional, all the way down — the config-patch type.
//
//   DeepPartial<Config>  ->  { name?: string; server?: { host?: string; … }; … }
//
// One caveat the test pins down rather than hides: an array's ELEMENTS become
// optional too, so `string[]` becomes `(string | undefined)[]`. That falls out
// of the homomorphic mapping over arrays and is why real libraries special-case
// them.
export type DeepPartial<T> = unknown;

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Recursion with a budget: stop after D levels and leave the rest alone.
//
//   DeepReadonlyUpTo<{ a: { b: { c: string } } }, 1>
//     ->  { readonly a: { b: { c: string } } }
//   DeepReadonlyUpTo<{ a: { b: { c: string } } }, 2>
//     ->  { readonly a: { readonly b: { c: string } } }
//   DeepReadonlyUpTo<X, 0>  ->  X
//
// TypeScript has no type-level arithmetic, so you count DOWN through a tuple:
// index a tuple of the previous numbers with D to get D - 1. This is how
// `type-fest` and friends keep recursive types from exploding, and it is a
// standard trick worth having in your hands.
export type DeepReadonlyUpTo<T, D extends Depth = 3> = unknown;

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// The runtime half. Freeze an object graph, and return it typed as deeply
// readonly:
//
//   const frozen = deepFreeze(config);
//   frozen.server.port = 1;    // compile error
//   config.server.port = 1;    // TypeError at runtime
//
// `Object.freeze` is one level deep, exactly like `Readonly<T>` — walk the graph
// yourself. Do not recurse into a frozen object twice (a cycle would hang), and
// no casts: a mutable value is already assignable to its deeply-readonly type.
export function deepFreeze(config: Config): DeepReadonly<Config> {
  throw new Error("TODO 5: implement deepFreeze");
}
