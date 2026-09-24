/**
 * Exercise 07/03 — Function overloads
 *
 * Overloads let ONE function present several call signatures. They are the
 * right tool in two situations: different arities that mean different things,
 * and a return type that genuinely depends on the argument type.
 *
 * They are the WRONG tool most other times — TODO 3 is deliberately a case
 * where a plain union is better, and you should not overload it.
 *
 * Read README.md first. Replace every TODO.
 */

export type Item = {
  id: string;
  name: string;
  priceCents: number;
};

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Two arities, two meanings:
//   makeRange(3)      -> [0, 1, 2]        (count)
//   makeRange(2, 5)   -> [2, 3, 4]        (start, end — end exclusive)
//   makeRange(0)      -> []
//   makeRange(5, 2)   -> []               (inverted range)
//
// Declare two OVERLOAD SIGNATURES, then one implementation signature that
// satisfies both. The implementation signature is not callable from outside.
export function makeRange(count: number): number[] {
  throw new Error("TODO 1: implement makeRange");
}

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// The return type follows the argument type:
//   combine("ab", "cd")     -> "abcd"     typed string
//   combine([1, 2], [3])    -> [1, 2, 3]  typed number[]
//
// A caller passing a string must get a `string` back, NOT `string | number[]`.
export function combine(a: string, b: string): string {
  throw new Error("TODO 2: implement combine");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Every input produces a `string`, so the return type does NOT depend on the
// argument type. Overloading here would be pure noise.
//
// Implement it with a plain UNION parameter and `typeof` narrowing:
//   formatValue("  hi  ")  -> "hi"
//   formatValue(3.5)       -> "3.50"
//   formatValue(true)      -> "yes" / "no"
export function formatValue(value: string | number | boolean): string {
  throw new Error("TODO 3: implement formatValue");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// A METHOD overload — same idea, dispatching on the argument type:
//   repo.find("abc")                      -> by id
//   repo.find((item) => item.price > 100) -> by predicate
export class ItemRepository {
  #items: Item[] = [];

  add(item: Item): void {
    this.#items.push(item);
  }

  get size(): number {
    return this.#items.length;
  }

  find(id: string): Item | undefined {
    throw new Error("TODO 4: implement find");
  }
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// Overload resolution picks the FIRST signature that matches, so ordering is
// load-bearing. As written below, a string argument is swallowed by the broad
// signature and reports "mixed".
//
// Reorder these so a string gets "text" and a number still gets "mixed".
// Do not change the implementation.
export function describe(value: string | number): "mixed";
export function describe(value: string): "text";
export function describe(value: string | number): "text" | "mixed" {
  return typeof value === "string" ? "text" : "mixed";
}
