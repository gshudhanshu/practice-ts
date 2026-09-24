/**
 * Exercise 18/01 — Typing props
 *
 * A React component is a function from props to UI. Everything TypeScript has
 * to say about React is therefore mostly about ONE object type: the props.
 *
 * Four things separate a props type that survives review from one that does not:
 *
 *   1. required vs optional, and — under `exactOptionalPropertyTypes` — whether
 *      an EXPLICIT `undefined` is allowed as well as an absent key
 *   2. `ReactNode` for anything renderable, including `children`
 *   3. extending a native element's props instead of re-declaring them
 *   4. resolving defaults in ONE place, with a type that says so
 *
 * There is no JSX here on purpose. Every guarantee above is a property of the
 * TYPES, and that is the half interviews probe.
 *
 * Read README.md first. Replace every TODO.
 */

import type {
  ComponentPropsWithoutRef,
  PropsWithChildren,
  ReactNode,
} from "react";

export type Tone = "info" | "success" | "danger";

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// The props of a <Badge>:
//
//   label  — required, a string
//   tone   — optional, one of Tone
//   count  — optional, a number
//
// Write the optional props as EXACT optionals (`tone?: Tone`). Under this
// repo's `exactOptionalPropertyTypes`, that means the key may be ABSENT but may
// not be present holding `undefined`:
//
//   { label: "New" }                    // ok
//   { label: "New", tone: "info" }      // ok
//   { label: "New", tone: undefined }   // compile error
export type BadgeProps = unknown;

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// The same three props, except every optional one ALSO accepts an explicit
// `undefined`:
//
//   { label: "New", tone: undefined }   // ok here
//
// This is the shape you need at a boundary where props arrive by spreading —
// `<Badge {...props} />` passes `tone: undefined` when the key exists but holds
// undefined. It is also, verbatim, how `@types/react` declares every single DOM
// prop: `className?: string | undefined`.
export type SpreadableBadgeProps = unknown;

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// The props of a <Panel>:
//
//   heading   — required, a string
//   footer    — optional, ANYTHING React can render (an element, a string, a
//               number, an array of them, null…)
//   children  — the wrapped content, same "anything renderable" type
//
// `ReactNode` is that "anything renderable" type. `PropsWithChildren<P>` is the
// helper that adds `children` to P — use it and see what it expands to.
export type PanelProps = unknown;

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// The props of an <IconButton>: everything a native <button> accepts, plus
//
//   icon  — required, a string
//
// …except that `type` must be narrowed to `"button"` only. An icon button
// inside a form that defaults to `type="submit"` is a genuine, common bug, so
// the component forbids the other values at the type level.
//
// `ComponentPropsWithoutRef<"button">` is the whole native prop set. Removing a
// prop before re-adding your own version of it is what `Omit` is for.
export type IconButtonProps = unknown;

/**
 * Given: what a Badge looks like once every default has been applied.
 *
 * `Required<T>` strips the `?`. Note it is derived from `BadgeProps` (the exact
 * optionals) — see solution/EXPLANATION.md for why deriving it from
 * `SpreadableBadgeProps` would NOT give you what you expect.
 */
export type ResolvedBadgeProps = Required<BadgeProps>;

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// Resolve the defaults, once, in a pure function — the thing a component would
// do in its parameter list.
//
//   tone  defaults to "info"
//   count defaults to 0
//
// A default applies when the prop is ABSENT *or* explicitly `undefined` — that
// is exactly what a destructuring default (or `??`) does, and exactly what `||`
// gets wrong:
//
//   resolveBadgeProps({ label: "New" })              -> { label: "New", tone: "info", count: 0 }
//   resolveBadgeProps({ label: "New", count: 0 })    -> { label: "New", tone: "info", count: 0 }
//   resolveBadgeProps({ label: "x", tone: "danger" })-> { label: "x", tone: "danger", count: 0 }
//
// No casts.
export function resolveBadgeProps(
  props: SpreadableBadgeProps,
): ResolvedBadgeProps {
  throw new Error("TODO 5: implement resolveBadgeProps");
}
