/**
 * Solution — 18/03 Typing hooks
 */

import type { Dispatch, SetStateAction } from "react";

/**
 * The predicate that makes TODO 1 compile.
 *
 * `typeof action === "function"` narrows `S | ((prev: S) => S)` to
 * `((prev: S) => S) | (S & Function)`, and `S & Function` has no call
 * signature — TypeScript is being correct, because `S` may itself be a
 * function type. A user-defined predicate states the intent instead: "if it is
 * a function, treat it as the updater", which is precisely React's own rule.
 */
const isUpdater = <S,>(action: SetStateAction<S>): action is (prev: S) => S =>
  typeof action === "function";

export function applySetState<S>(previous: S, action: SetStateAction<S>): S {
  return isUpdater(action) ? action(previous) : action;
}

// `readonly` matters: it is what makes destructuring the only sensible thing to
// do with the result, and it stops a caller writing back into the hook's return
// value. `Dispatch<SetStateAction<T | null>>` is React's own setter type, so
// the value `useState<T | null>(null)` produces fits with no adaptation.
export type SelectionApi<T> = readonly [
  T | null,
  Dispatch<SetStateAction<T | null>>,
];

export function makeToggleApi(
  value: boolean,
  setValue: Dispatch<SetStateAction<boolean>>,
) {
  const toggle = (): void => {
    // The updater form. `setValue(!value)` would capture the value this render
    // closed over, so two toggles in one React batch would produce one flip.
    setValue((current) => !current);
  };

  // Without `as const` the inferred type is `(boolean | (() => void))[]` — an
  // array, so `const [open, toggle] = …` gives BOTH names that union and
  // neither is usable. `as const` produces `readonly [boolean, () => void]`.
  //
  // The alternative is to annotate the return type explicitly; `as const` keeps
  // the type next to the value it describes. (A const assertion is not a type
  // assertion — see 02/03.)
  return [value, toggle] as const;
}

// The hook's extension points. Typed in terms of T, so `useList<Task>` hands
// its caller a `Task` rather than an `unknown` — that is the whole reason the
// options type is generic.
//
// `| undefined` next to each `?` because an options object is nearly always
// built by the caller and spread; see 18/01.
export type ListOptions<T> = {
  onAdd?: ((item: T) => void) | undefined;
  compare?: ((a: T, b: T) => number) | undefined;
  limit?: number | undefined;
};

export function addItem<T>(
  items: readonly T[],
  item: T,
  options: ListOptions<T> = {},
): readonly T[] {
  const { onAdd, compare, limit } = options;

  // A fresh array. `items.push(item)` would mutate a value React compares by
  // reference, and the list would silently not re-render.
  const next = [...items, item];

  // `sort` mutates — but it mutates the copy, which is fine and avoids a
  // second allocation.
  if (compare !== undefined) next.sort(compare);

  // `!== undefined`, not truthiness: `limit: 0` is a real limit.
  const limited = limit === undefined ? next : next.slice(0, limit);

  // Optional call: `?.()` runs the callback only when one was supplied.
  onAdd?.(item);

  return limited;
}
