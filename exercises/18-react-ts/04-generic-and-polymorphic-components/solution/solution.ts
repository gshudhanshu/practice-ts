/**
 * Solution — 18/04 Generic & polymorphic components
 */

import type {
  ComponentPropsWithoutRef,
  ElementType,
  Key,
  ReactNode,
} from "react";

// `readonly T[]` says the component will not mutate the caller's array — and,
// usefully, also accepts a mutable one. `T` appears three times, which is the
// test from 08/01 for whether a generic earns its keep: it RELATES the items to
// the callbacks.
export type ListProps<T> = {
  items: readonly T[];
  renderItem: (item: T, index: number) => ReactNode;
  getKey: (item: T) => Key;
};

// A GENERIC FUNCTION TYPE: the `<T>` sits on the call signature, so it is
// resolved afresh at every call site. One value; any element type.
//
// This is what `FC<P>` cannot express — `FC` fixes `P` where the type is
// written, and a type alias has nowhere to bind a per-call parameter.
export type ListComponent = <T>(props: ListProps<T>) => ReactNode;

export type ListEntry = {
  key: Key;
  node: ReactNode;
};

export function renderList<T>(props: ListProps<T>): readonly ListEntry[] {
  const { items, renderItem, getKey } = props;

  const seen = new Set<Key>();
  const entries: ListEntry[] = [];

  items.forEach((item, index) => {
    const key = getKey(item);

    // React only warns about this, in development, and then silently keeps the
    // wrong component instance when the list reorders. Failing loudly is
    // cheaper than debugging a row that kept the previous row's input value.
    if (seen.has(key)) {
      throw new Error(`Duplicate list key: ${key}`);
    }
    seen.add(key);

    entries.push({ key, node: renderItem(item, index) });
  });

  return entries;
}

/**
 * The three pieces, in order:
 *
 *   P                                       the component's own props
 *   { as?: E }                              which element to render
 *   Omit<ComponentPropsWithoutRef<E>, …>    that element's native props,
 *                                           minus the ones P already claims
 *
 * The `Omit` is the piece people leave out. Without it, a component declaring
 * `size?: "sm" | "lg"` over a native `<input size?: number>` produces
 * `("sm" | "lg" | undefined) & (number | undefined)` — which is `undefined`, so
 * the prop becomes unsatisfiable with no error at the declaration site.
 * `"as"` is removed for the same reason: `{ as?: E }` must win over anything
 * the element happens to declare.
 */
export type PolymorphicProps<E extends ElementType, P> = P & {
  as?: E | undefined;
} & Omit<ComponentPropsWithoutRef<E>, keyof P | "as">;

export type TextProps<E extends ElementType = "span"> = PolymorphicProps<
  E,
  { weight?: "bold" | "normal" | undefined }
>;

export type TextSplit<E extends ElementType> = {
  tag: ElementType;
  rest: Omit<TextProps<E>, "as">;
};

export function splitTextProps<E extends ElementType = "span">(
  props: TextProps<E>,
): TextSplit<E> {
  // Rest destructuring both removes `as` and copies the rest — one expression,
  // no mutation of the caller's object. TypeScript types `rest` as
  // `Omit<TextProps<E>, "as">` on its own, which is why `TextSplit` can say so
  // without a cast.
  const { as, ...rest } = props;

  // `??`, not `||`: the fallback is for an absent `as`, and `as` is never a
  // meaningful falsy value.
  return { tag: as ?? "span", rest };
}
