/**
 * Solution — 18/01 Typing props
 */

import type {
  ComponentPropsWithoutRef,
  PropsWithChildren,
  ReactNode,
} from "react";

export type Tone = "info" | "success" | "danger";

// Exact optionals: the key may be absent, but not present holding `undefined`.
// Under `exactOptionalPropertyTypes` that is a real, checked distinction.
export type BadgeProps = {
  label: string;
  tone?: Tone;
  count?: number;
};

// The boundary shape. Writing `| undefined` next to the `?` re-admits an
// explicit undefined — which is what a spread produces, and what `@types/react`
// writes for every DOM prop it declares.
export type SpreadableBadgeProps = {
  label: string;
  tone?: Tone | undefined;
  count?: number | undefined;
};

// `PropsWithChildren<P>` is `P & { children?: ReactNode | undefined }` — an
// intersection, nothing more. Using it documents intent; writing `children`
// out by hand is equally correct.
//
// `ReactNode` is the "anything React can render" type: elements, strings,
// numbers, bigints, iterables of those, portals, booleans, null and undefined.
// Note it already CONTAINS undefined, so `footer?: ReactNode` accepts an
// explicit undefined even under exactOptionalPropertyTypes.
export type PanelProps = PropsWithChildren<{
  heading: string;
  footer?: ReactNode;
}>;

// Extend the native element rather than re-declaring 200 attributes: you get
// `onClick`, `disabled`, `aria-*`, `data-*` and the correct event element type
// (`MouseEvent<HTMLButtonElement>`) for free.
//
// `Omit` removes `type` so the intersection can re-add a narrower version.
// Without the Omit, `"button" & ("button" | "submit" | "reset")` would still
// resolve to "button", but the intent would be invisible — and for a prop whose
// types do not overlap you would silently get `never`.
export type IconButtonProps = Omit<
  ComponentPropsWithoutRef<"button">,
  "type"
> & {
  icon: string;
  type?: "button" | undefined;
};

// `Required<T>` strips the `?`. It is derived from BadgeProps, NOT from
// SpreadableBadgeProps — see EXPLANATION.md.
export type ResolvedBadgeProps = Required<BadgeProps>;

export function resolveBadgeProps(
  props: SpreadableBadgeProps,
): ResolvedBadgeProps {
  // A destructuring default fires on `undefined` only — absent key and
  // explicit undefined both land on it, and `0`, `""` and `false` do not.
  // `??` is the expression-level equivalent; `||` is the bug.
  const { label, tone = "info", count = 0 } = props;

  // A fresh object: props are read-only by convention in React, and returning
  // a mutated input makes memoisation lie about what changed.
  return { label, tone, count };
}
