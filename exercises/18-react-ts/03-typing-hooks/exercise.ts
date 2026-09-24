/**
 * Exercise 18/03 — Typing hooks
 *
 * A custom hook is a plain function. Strip the `useState` call out of it and
 * what remains is pure logic — which is both testable without a renderer and
 * where all the interesting typing lives:
 *
 *   - `SetStateAction<S>` is `S | ((prev: S) => S)`, and narrowing it with a
 *     bare `typeof x === "function"` DOES NOT COMPILE when `S` is generic
 *   - a hook that returns a tuple must SAY it returns a tuple, or callers get
 *     `(A | B)[]` and destructuring gives both of them the union
 *   - the callbacks a hook accepts are its extension points, and typing them
 *     well is what makes `onAdd` receive `Item` rather than `unknown`
 *
 * Nothing here calls React. Where the spec needs React's real types it uses
 * `typeof useState` through a type-only import, so your hand-written types are
 * checked against the genuine article.
 *
 * Read README.md first. Replace every TODO.
 */

import type { Dispatch, SetStateAction } from "react";

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// The pure core of a state setter — what React does when you call `setCount`.
//
//   applySetState(1, 2)              -> 2      (a replacement value)
//   applySetState(1, (n) => n + 1)   -> 2      (an updater function)
//
// `SetStateAction<S>` is `S | ((prev: S) => S)`. Narrowing it is the whole
// exercise: writing
//
//   if (typeof action === "function") return action(previous);
//
// fails to compile, because when `S` is generic TypeScript narrows the union to
// `((prev: S) => S) | (S & Function)` — and the second half is not callable.
// `S` could itself be a function type, and TypeScript is right to say so.
//
// Reach for a user-defined type predicate (02/03) instead. No casts.
export function applySetState<S>(previous: S, action: SetStateAction<S>): S {
  throw new Error("TODO 1: implement applySetState");
}

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// The type a `useSelection<T>()` hook returns: the currently selected item (or
// null when nothing is selected), and a setter that accepts either shape of
// `SetStateAction`.
//
//   const [selected, select] = useSelection<User>();
//   select(user);
//   select((current) => (current === null ? user : null));
//
// Two requirements the tests check:
//   - it is a READONLY TUPLE of exactly two elements, not an array
//   - the setter is React's own `Dispatch<SetStateAction<…>>`, so the value
//     returned by `useState<T | null>(null)` fits it without adaptation
export type SelectionApi<T> = unknown;

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// The pure core of a `useToggle` hook: hand back the current value and a
// function that flips it.
//
//   const [open, toggle] = makeToggleApi(false, setOpen);
//
// The return type is deliberately NOT annotated. Return a plain array literal
// and TypeScript infers `(boolean | (() => void))[]` — an array, so destructuring
// gives BOTH `open` and `toggle` that union, and neither is usable. Make the
// inference produce `readonly [boolean, () => void]` instead.
//
// `toggle` must go through the UPDATER form of the setter — `setValue(!value)`
// captures a stale value when two toggles happen in one React batch.
export function makeToggleApi(
  value: boolean,
  setValue: Dispatch<SetStateAction<boolean>>,
) {
  throw new Error("TODO 3: implement makeToggleApi");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// The options a `useList<T>()` hook accepts — its dependency-injected
// behaviour. All three are optional, and all three are written the spreadable
// way (`| undefined`), because an options object is nearly always assembled by
// a caller and spread:
//
//   onAdd    — notified with the item that was just added
//   compare  — orders the list; same contract as Array.prototype.sort
//   limit    — the maximum number of items to keep
//
// `onAdd` and `compare` must be typed in terms of T, so a `useList<Task>` gives
// its caller a `Task` and not an `unknown`.
export type ListOptions<T> = unknown;

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// The pure core of `useList`'s `add` action. Given the current items, produce
// the next ones:
//
//   addItem(["b"], "a")                              -> ["b", "a"]
//   addItem(["b"], "a", { compare })                 -> ["a", "b"]
//   addItem(["b", "c"], "a", { compare, limit: 2 })  -> ["a", "b"]
//
// Rules:
//   - never mutate `items` — React compares by reference, and a mutated array
//     is the classic "why did my list not re-render" bug
//   - apply `compare` first, then `limit`
//   - call `onAdd` exactly once, with the added item
//   - `options` is optional; calling `addItem(items, item)` must work
export function addItem<T>(
  items: readonly T[],
  item: T,
  options?: ListOptions<T>,
): readonly T[] {
  throw new Error("TODO 5: implement addItem");
}
