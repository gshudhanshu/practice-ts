/**
 * Exercise 18/04 — CHALLENGE: generic & polymorphic components
 *
 * Two patterns that every design system arrives at, and that TypeScript makes
 * genuinely hard until you have seen them once.
 *
 * GENERIC: <List items={users} renderItem={(u) => u.name} />
 *   The callback's parameter must follow the array's element type. That means
 *   the COMPONENT is generic — and it is the reason `React.FC` finally runs out
 *   of road: `FC<P>` fixes P, and there is nowhere to put the `<T>`.
 *
 * POLYMORPHIC: <Text as="a" href="/docs" /> renders an <a>; <Text /> a <span>.
 *   The props a caller may pass have to CHANGE with the `as` value. That means
 *   pulling the native props of whatever element `as` names, and removing the
 *   ones your own props already claim.
 *
 * Neither pattern needs JSX to state or to test: they are properties of the
 * types plus a small amount of pure prop-shuffling.
 *
 * Read README.md first. Replace every TODO.
 */

import type {
  ComponentPropsWithoutRef,
  ElementType,
  Key,
  ReactNode,
} from "react";

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// The props of a generic <List<T>>:
//
//   items       — the data, which the component must not mutate
//   renderItem  — turns one item (and its index) into something renderable
//   getKey      — the React key for one item; React's own `Key` type
//
// Type them so that `renderItem`'s parameter follows the element type of
// `items`: pass `User[]` and the callback's parameter is a `User`, with no
// annotation at the call site.
export type ListProps<T> = unknown;

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// The TYPE of the component itself.
//
// This is the part `React.FC` cannot express. `FC<ListProps<User>>` is a
// component that renders user lists and nothing else; there is no way to write
// `FC<ListProps<T>>` because `T` would have to be bound somewhere, and a type
// alias has nowhere to bind it *per call*.
//
// What you want is a GENERIC FUNCTION TYPE: one value, whose type parameter is
// resolved afresh at every call site.
//
//   const List: ListComponent = …
//   List({ items: users,   renderItem: (u) => u.name, getKey: (u) => u.id });
//   List({ items: ["a"],   renderItem: (s) => s,      getKey: (s) => s     });
//
// It returns whatever a component returns: `ReactNode`.
export type ListComponent = unknown;

/** One rendered row: the key React needs, and the content. */
export type ListEntry = {
  key: Key;
  node: ReactNode;
};

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// The pure core of that component — everything it does apart from emitting JSX.
//
//   renderList({ items: ["a", "b"], renderItem: (s, i) => `${i}:${s}`, getKey: (s) => s })
//     -> [{ key: "a", node: "0:a" }, { key: "b", node: "1:b" }]
//
// Two rules:
//   - one entry per item, in order, with the index passed to `renderItem`
//   - DUPLICATE KEYS THROW. React only warns, at runtime, in development, and
//     the resulting bug (rows keeping the wrong state after a reorder) is one
//     of the hardest in React to diagnose. The error message must name the key.
export function renderList<T>(props: ListProps<T>): readonly ListEntry[] {
  throw new Error("TODO 3: implement renderList");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// The polymorphic props helper: `P` is the component's OWN props, `E` is the
// element or component it renders.
//
//   PolymorphicProps<"a", { weight?: "bold" }>
//     -> { weight?: "bold" } & { as?: "a" } & <every <a> prop except `weight`>
//
// Three pieces, and the third is the one people miss:
//   - the component's own props, P
//   - an optional `as`, carrying E
//   - the native props of E, MINUS the keys P already claims (and minus `as`)
//
// Without that subtraction, a component whose own `size` prop is `"sm" | "lg"`
// intersects with the native `size?: number` and becomes unsatisfiable — the
// same trap as 18/01, except here it is invisible because `P` is a parameter.
export type PolymorphicProps<E extends ElementType, P> = unknown;

/**
 * Given: a concrete polymorphic component, built from your TODO 4.
 *
 * `<Text>` renders a `<span>` by default. `<Text as="a" href="/docs">` renders
 * an anchor — and only then does `href` become a legal prop.
 */
export type TextProps<E extends ElementType = "span"> = PolymorphicProps<
  E,
  { weight?: "bold" | "normal" | undefined }
>;

/** Given: what the component needs in order to render. */
export type TextSplit<E extends ElementType> = {
  /** The element or component to render. */
  tag: ElementType;
  /** Everything else, ready to spread onto it. */
  rest: Omit<TextProps<E>, "as">;
};

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// The pure core of <Text>: pull `as` off the props and default it.
//
//   splitTextProps({ as: "a", href: "/x", weight: "bold" })
//     -> { tag: "a",    rest: { href: "/x", weight: "bold" } }
//   splitTextProps({ weight: "bold" })
//     -> { tag: "span", rest: { weight: "bold" } }
//
// `as` must not survive into `rest` — spreading an `as` attribute onto a DOM
// element is a React warning and an invalid HTML attribute.
export function splitTextProps<E extends ElementType = "span">(
  props: TextProps<E>,
): TextSplit<E> {
  throw new Error("TODO 5: implement splitTextProps");
}
