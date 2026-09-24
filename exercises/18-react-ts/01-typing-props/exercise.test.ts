import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import type { ComponentPropsWithoutRef, FC, ReactNode } from "react";
import {
  resolveBadgeProps,
  type BadgeProps,
  type IconButtonProps,
  type PanelProps,
  type ResolvedBadgeProps,
  type SpreadableBadgeProps,
  type Tone,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

/* TODO 1 — exact optionals. */
type _badge = Expect<
  Equal<BadgeProps, { label: string; tone?: Tone; count?: number }>
>;

/* TODO 2 — the same props, but every optional one admits an explicit undefined.
   `Equal` distinguishes the two: they really are different types under
   `exactOptionalPropertyTypes`. */
type _spreadable = Expect<
  Equal<
    SpreadableBadgeProps,
    { label: string; tone?: Tone | undefined; count?: number | undefined }
  >
>;

/* TODO 3 — children and footer are both "anything renderable".
   `PropsWithChildren<P>` is an INTERSECTION (`P & { children?: … }`), so the
   spec checks the members rather than the whole type. */
type _panelHeading = Expect<Equal<PanelProps["heading"], string>>;
type _panelFooter = Expect<Equal<PanelProps["footer"], ReactNode>>;
type _panelChildren = Expect<Equal<PanelProps["children"], ReactNode>>;

/* TODO 4 — native button props, plus `icon`, with `type` narrowed. */
type _iconRequired = Expect<Equal<IconButtonProps["icon"], string>>;
type _iconType = Expect<Equal<IconButtonProps["type"], "button" | undefined>>;
type _iconClick = Expect<
  Equal<
    IconButtonProps["onClick"],
    ComponentPropsWithoutRef<"button">["onClick"]
  >
>;
type _iconDisabled = Expect<
  Equal<IconButtonProps["disabled"], boolean | undefined>
>;

/* TODO 5 — the resolved shape has no optionals left. */
type _resolved = Expect<
  Equal<ResolvedBadgeProps, { label: string; tone: Tone; count: number }>
>;
type _resolveReturn = Expect<
  Equal<
    ReturnType<typeof resolveBadgeProps>,
    { label: string; tone: Tone; count: number }
  >
>;
type _resolveParam = Expect<
  Equal<Parameters<typeof resolveBadgeProps>[0], SpreadableBadgeProps>
>;

/* Two facts about @types/react that the exercise depends on. Neither is your
   code — they are here so the surprises are on the record.

   1. `Required<T>` only strips `undefined` from an EXACT optional. A property
      written `tone?: Tone | undefined` keeps its undefined even after `-?`,
      which is why `ResolvedBadgeProps` derives from `BadgeProps`. */
type _requiredCaveat = Expect<
  Equal<Required<SpreadableBadgeProps>["tone"], Tone | undefined>
>;

/* 2. `React.FC` does NOT add `children` (it stopped in React 18's types), and
      it returns `ReactNode | Promise<ReactNode>`. Both are reasons to type the
      props and let the return type be inferred instead — see 18/04 for the
      reason that actually forces your hand. */
type _fcProps = Expect<Equal<Parameters<FC<{ a: string }>>[0], { a: string }>>;
type _fcReturn = Expect<
  Equal<ReturnType<FC<{ a: string }>>, ReactNode | Promise<ReactNode>>
>;

function _compileTimeOnly(): void {
  const minimal: BadgeProps = { label: "New" };
  const full: BadgeProps = { label: "New", tone: "success", count: 3 };
  void minimal;
  void full;

  // @ts-expect-error — `label` is required.
  const noLabel: BadgeProps = { tone: "info" };
  void noLabel;

  // @ts-expect-error — `tone` is a closed union.
  const badTone: BadgeProps = { label: "New", tone: "warning" };
  void badTone;

  // @ts-expect-error — exactOptionalPropertyTypes: absent is not the same as
  // present-and-undefined, and BadgeProps only allows absent.
  const explicitUndefined: BadgeProps = { label: "New", tone: undefined };
  void explicitUndefined;

  // The spreadable variant is exactly the one that accepts it.
  const spreadable: SpreadableBadgeProps = {
    label: "New",
    tone: undefined,
    count: undefined,
  };
  void spreadable;

  const panel: PanelProps = { heading: "Settings", children: "body text" };
  void panel;

  const panelWithNodes: PanelProps = {
    heading: "Settings",
    footer: [1, "two", null],
    children: null,
  };
  void panelWithNodes;

  // @ts-expect-error — `heading` is required.
  const noHeading: PanelProps = { children: "body" };
  void noHeading;

  const iconButton: IconButtonProps = {
    icon: "trash",
    onClick: () => undefined,
    disabled: true,
    "aria-label": "Delete",
  };
  void iconButton;

  // @ts-expect-error — an icon button may not submit a form.
  const submitting: IconButtonProps = { icon: "save", type: "submit" };
  void submitting;

  // @ts-expect-error — `icon` is required.
  const noIcon: IconButtonProps = { onClick: () => undefined };
  void noIcon;

  // @ts-expect-error — ComponentPropsWithoutRef drops `ref`.
  const withRef: IconButtonProps = { icon: "trash", ref: null };
  void withRef;
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("resolveBadgeProps", () => {
  it("fills in every missing optional", () => {
    expect(resolveBadgeProps({ label: "New" })).toEqual({
      label: "New",
      tone: "info",
      count: 0,
    });
  });

  it("treats an explicit undefined the same as an absent key", () => {
    expect(
      resolveBadgeProps({ label: "New", tone: undefined, count: undefined }),
    ).toEqual({ label: "New", tone: "info", count: 0 });
  });

  it("keeps values that are present", () => {
    expect(resolveBadgeProps({ label: "Sale", tone: "danger", count: 7 })).toEqual(
      { label: "Sale", tone: "danger", count: 7 },
    );
  });

  it("does not default away a falsy-but-present value", () => {
    // `count || 0` would pass this one, but `label: ""` is the giveaway: a
    // default must fire on undefined, not on falsiness.
    expect(resolveBadgeProps({ label: "", count: 0 })).toEqual({
      label: "",
      tone: "info",
      count: 0,
    });
  });

  it("returns a new object rather than mutating the props", () => {
    const props: SpreadableBadgeProps = { label: "New" };
    const resolved = resolveBadgeProps(props);

    expect(resolved).not.toBe(props);
    expect(props).toEqual({ label: "New" });
  });
});
