/**
 * Exercise 21/02 — Union tricks
 *
 * The types in this file are the ones that make people say "how does that even
 * work?". Each exploits a rule of the type system that exists for another
 * reason entirely:
 *
 *   IsAny                `any` is assignable in both directions at once
 *   IsUnknown            `unknown` absorbs everything — but so does `any`
 *   UnionToIntersection  function parameters are CONTRAVARIANT
 *   IsUnion              a distributed copy can be compared with an undistributed one
 *
 * Distribution itself was taught in 10/04, and `IsNever` in 20/03 — this
 * exercise assumes both and uses them without re-deriving them.
 *
 * Read README.md first. Replace every TODO.
 */

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Two detectors for the two types that break normal reasoning.
//   IsAny<any>          ->  true      IsUnknown<unknown>  ->  true
//   IsAny<unknown>      ->  false     IsUnknown<any>      ->  false
//   IsAny<never>        ->  false     IsUnknown<never>    ->  false
//   IsAny<string>       ->  false     IsUnknown<string>   ->  false
//
// `IsAny` has a famous one-liner: `any` is the only type that makes
// `0 extends 1 & T` true. Work out why before you write it — the explanation
// spells it out afterwards.
//
// `IsUnknown` looks easy — `unknown extends T` — until you notice that is also
// true for `any`. Rule `any` out first, with the detector you just wrote.
export type IsAny<T> = unknown;
export type IsUnknown<T> = unknown;

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// Turn a union into an intersection.
//   UnionToIntersection<{ a: string } | { b: number }>
//     ->  { a: string } & { b: number }
//   UnionToIntersection<string | number>   ->  never
//
// The trick, in two steps:
//   1. Distribute the union into a union of FUNCTIONS that take T as a
//      parameter: `T extends unknown ? (arg: T) => void : never`.
//   2. `infer` the parameter back out of that union.
//
// Step 2 is where the magic is. To be assignable to a union of function types,
// a single function must accept every one of their parameter types — parameters
// are contravariant — so the inferred parameter is the INTERSECTION.
export type UnionToIntersection<T> = unknown;

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Is this type a union of two or more members?
//   IsUnion<string | number>  ->  true
//   IsUnion<string>           ->  false
//   IsUnion<boolean>          ->  true    (boolean IS `true | false`)
//   IsUnion<never>            ->  false
//
// The idiom: give the type a SECOND, defaulted type parameter — `<T, U = T>`.
// `T` distributes and `U` does not, so inside the distributed branch you can
// compare one member against the whole original union.
//
// Handle `never` before you distribute — `[T] extends [never]`, from 20/03.
export type IsUnion<T> = unknown;

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Turn a union into a tuple.
//   UnionToTuple<"a" | "b" | "c">  ->  ["a", "b", "c"]
//   UnionToTuple<never>            ->  []
//
// The hard part is getting ONE member out of a union. Reuse
// UnionToIntersection: distribute into `() => T` instead of `(arg: T) => void`,
// and RETURN types are covariant, so intersecting them makes an overloaded
// signature — and `infer` on an overload picks the LAST one.
//
// With "the last member" in hand, `Exclude` gives you the rest, and recursion
// does the walk. Build the tuple with the last member at the end.
export type UnionToTuple<T> = unknown;

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// The runtime side of TODO 2. Merging two objects at runtime produces exactly
// the intersection of their types — which is what `UnionToIntersection` computes
// from the union of them.
//
//   mergeConfigs({ retries: 2 }, { verbose: true })
//     ->  { retries: 2, verbose: true }   typed { retries: number } & { verbose: boolean }
//
// Later keys win, as with `Object.assign`. Do not mutate either argument.
export function mergeConfigs<A extends object, B extends object>(
  base: A,
  override: B,
): unknown {
  throw new Error("TODO 5: implement mergeConfigs");
}
