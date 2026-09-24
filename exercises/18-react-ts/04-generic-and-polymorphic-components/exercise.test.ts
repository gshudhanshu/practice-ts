import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import type {
  ComponentPropsWithoutRef,
  ElementType,
  FC,
  Key,
  ReactNode,
} from "react";
import {
  renderList,
  splitTextProps,
  type ListComponent,
  type ListEntry,
  type ListProps,
  type PolymorphicProps,
  type TextProps,
} from "./exercise";

/* ── Fixtures ───────────────────────────────────────────────────────────── */

type User = { id: string; name: string };

const users: readonly User[] = [
  { id: "u1", name: "Ada" },
  { id: "u2", name: "Grace" },
];

/* One value of each component type, so the compile-time spec can call them. */
declare const List: ListComponent;
declare const StringList: FC<ListProps<string>>;

/* ── Compile-time spec ──────────────────────────────────────────────────── */

/* TODO 1 */
type _listProps = Expect<
  Equal<
    ListProps<User>,
    {
      items: readonly User[];
      renderItem: (item: User, index: number) => ReactNode;
      getKey: (item: User) => Key;
    }
  >
>;

/* TODO 2 — a generic function type: one value, `T` resolved per call. */
type _listComponent = Expect<
  Equal<ListComponent, <T>(props: ListProps<T>) => ReactNode>
>;

/* TODO 3 */
type _renderReturn = Expect<
  Equal<ReturnType<typeof renderList>, readonly ListEntry[]>
>;

/* TODO 4 — `as` carries E, and the native props follow it. */
type _textWeight = Expect<
  Equal<TextProps["weight"], "bold" | "normal" | undefined>
>;
type _textAs = Expect<Equal<TextProps<"a">["as"], "a" | undefined>>;
type _textHref = Expect<
  Equal<TextProps<"a">["href"], ComponentPropsWithoutRef<"a">["href"]>
>;

/* The subtraction is what makes this work. A native <input> declares
   `size?: number`; a component that declares its own `size` must WIN, not
   intersect down to `undefined`. */
type SizedProps = PolymorphicProps<"input", { size?: "sm" | "lg" | undefined }>;
type _ownPropWins = Expect<Equal<SizedProps["size"], "sm" | "lg" | undefined>>;

function _compileTimeOnly(): void {
  /* TODO 1 / 2 — one component value, many element types, no annotations. */
  List({
    items: users,
    renderItem: (user, index) => {
      type _user = Expect<Equal<typeof user, User>>;
      type _index = Expect<Equal<typeof index, number>>;
      return user.name;
    },
    getKey: (user) => user.id,
  });

  List({
    items: [1, 2, 3],
    renderItem: (n) => {
      type _n = Expect<Equal<typeof n, number>>;
      return n;
    },
    getKey: (n) => n,
  });

  /* …which is exactly what `React.FC` cannot do. `FC<P>` fixes P at the point
     the type is written, so this value is stuck rendering string lists. */
  StringList({
    items: ["a"],
    renderItem: (s) => s.toUpperCase(),
    getKey: (s) => s,
  });

  // @ts-expect-error — FC<ListProps<string>> can never render a User list.
  StringList({ items: users, renderItem: (u) => u.name, getKey: (u) => u.id });

  // @ts-expect-error — a key must be a string, number or bigint.
  List({ items: users, renderItem: (u) => u.name, getKey: (u) => u });

  // @ts-expect-error — `items` is readonly; the component must not mutate it.
  List({ items: users, renderItem: (u) => u.name, getKey: (u) => u.id }).push;

  /* TODO 4 — the props a caller may pass change with `as`. */
  const span: TextProps = { weight: "bold" };
  const anchor: TextProps<"a"> = { as: "a", href: "/docs", weight: "normal" };
  const button: TextProps<"button"> = { as: "button", disabled: true };
  void span;
  void anchor;
  void button;

  // @ts-expect-error — a <span> has no href.
  const spanWithHref: TextProps = { href: "/docs" };
  void spanWithHref;

  // @ts-expect-error — `weight` is a closed union, whatever `as` says.
  const loud: TextProps<"a"> = { as: "a", weight: "loud" };
  void loud;

  /* TODO 5 */
  const split = splitTextProps({ as: "a", href: "/docs", weight: "bold" });
  const tag = split.tag;
  type _tag = Expect<Equal<typeof tag, ElementType>>;
  const weight = split.rest.weight;
  type _weight = Expect<Equal<typeof weight, "bold" | "normal" | undefined>>;

  // @ts-expect-error — `as` was removed; it must not reach the DOM.
  split.rest.as;
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("renderList", () => {
  it("produces one entry per item, in order", () => {
    expect(
      renderList({
        items: ["a", "b"],
        renderItem: (item, index) => `${index}:${item}`,
        getKey: (item) => item,
      }),
    ).toEqual([
      { key: "a", node: "0:a" },
      { key: "b", node: "1:b" },
    ]);
  });

  it("works with any element type", () => {
    expect(
      renderList({
        items: users,
        renderItem: (user) => user.name,
        getKey: (user) => user.id,
      }),
    ).toEqual([
      { key: "u1", node: "Ada" },
      { key: "u2", node: "Grace" },
    ]);
  });

  it("returns nothing for an empty list", () => {
    expect(
      renderList({
        items: [],
        renderItem: (item: string) => item,
        getKey: (item: string) => item,
      }),
    ).toEqual([]);
  });

  it("does not mutate the items", () => {
    const items: readonly string[] = ["a", "b"];
    renderList({ items, renderItem: (item) => item, getKey: (item) => item });
    expect(items).toEqual(["a", "b"]);
  });

  it("throws on a duplicate key, naming it", () => {
    expect(() =>
      renderList({
        items: [
          { id: "u1", name: "Ada" },
          { id: "u1", name: "Grace" },
        ],
        renderItem: (user: User) => user.name,
        getKey: (user: User) => user.id,
      }),
    ).toThrow(/u1/);
  });

  it("accepts numeric keys, including 0", () => {
    // A falsy key is a real key. `if (!key) throw` would fail this one.
    expect(
      renderList({
        items: [0, 1],
        renderItem: (item) => `#${item}`,
        getKey: (item) => item,
      }),
    ).toEqual([
      { key: 0, node: "#0" },
      { key: 1, node: "#1" },
    ]);
  });
});

describe("splitTextProps", () => {
  it("uses the `as` prop as the tag", () => {
    expect(splitTextProps({ as: "a", href: "/docs", weight: "bold" })).toEqual({
      tag: "a",
      rest: { href: "/docs", weight: "bold" },
    });
  });

  it("defaults to a span", () => {
    expect(splitTextProps({ weight: "normal" })).toEqual({
      tag: "span",
      rest: { weight: "normal" },
    });
  });

  it("never leaks `as` into the spread props", () => {
    const { rest } = splitTextProps({ as: "button", disabled: true });
    expect("as" in rest).toBe(false);
    expect(rest).toEqual({ disabled: true });
  });

  it("does not mutate the props it was given", () => {
    const props: TextProps<"a"> = { as: "a", href: "/docs" };
    splitTextProps(props);
    expect(props).toEqual({ as: "a", href: "/docs" });
  });
});
