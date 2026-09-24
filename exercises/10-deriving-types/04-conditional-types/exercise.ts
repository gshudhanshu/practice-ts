/**
 * Exercise 10/04 — Conditional types & `infer`
 *
 *   T extends U ? X : Y      a type-level if/else
 *   infer P                  capture a type from inside the pattern
 *
 * The part that surprises everyone is DISTRIBUTION: a conditional over a naked
 * type parameter runs once per union member. TODO 4 makes that concrete.
 *
 * Read README.md first. Replace every TODO.
 */

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// A type-level predicate.
//   IsArray<string[]>  ->  true
//   IsArray<string>    ->  false
export type IsArray<T> = unknown;

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// The element type of an array, or `never` for anything else.
//   ElementOf<string[]>           ->  string
//   ElementOf<readonly number[]>  ->  number
//   ElementOf<string>             ->  never
//
// `infer` declares a type variable inside the pattern and binds whatever
// matched there.
export type ElementOf<T> = unknown;

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Unwrap however many promises are nested.
//   DeepAwaited<Promise<number>>            ->  number
//   DeepAwaited<Promise<Promise<string>>>   ->  string
//   DeepAwaited<number>                     ->  number
//
// Conditional types may refer to themselves — this one recurses.
export type DeepAwaited<T> = unknown;

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Two types that LOOK the same and behave differently.
//
// Distributed<string | number>     must be  string[] | number[]
// Collected<string | number>       must be  (string | number)[]
//
// A conditional over a NAKED type parameter distributes across a union. Wrap
// both sides of the `extends` in a one-element tuple to switch that off.
export type Distributed<T> = unknown;
export type Collected<T> = unknown;

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// The runtime bridge: return the first element.
//   firstElement(["a", "b"])  ->  string | undefined
//   firstElement([1, 2])      ->  number | undefined
//
// Careful: `ElementOf<T>` will NOT work as the return type here, even though it
// resolves correctly at every call site. Inside the function `T` is still
// generic, so the conditional is DEFERRED and the compiler cannot prove
// anything is assignable to it.
//
// Use an indexed access instead — it needs no evaluation. The explanation
// covers why this distinction matters.
export function firstElement<T extends readonly unknown[]>(
  items: T,
): unknown {
  throw new Error("TODO 5: implement firstElement");
}
