import { describe, expect, it, vi } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  describeAction,
  resolveToggle,
  type ActionProps,
  type AsyncButtonProps,
  type ToggleProps,
  type ToggleState,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

/* TODO 1 — three mutually exclusive modes, tagged by `variant`. */
type _action = Expect<
  Equal<
    ActionProps,
    | { variant: "link"; href: string; label: string }
    | { variant: "button"; onClick: () => void; label: string }
    | { variant: "submit"; formId: string; label: string }
  >
>;

/* TODO 3 — all-or-nothing. */
type _asyncButton = Expect<
  Equal<
    AsyncButtonProps,
    | { loading: true; loadingLabel: string }
    | { loading?: false; loadingLabel?: never }
  >
>;

/* TODO 4 — controlled vs uncontrolled. */
type _toggle = Expect<
  Equal<
    ToggleProps,
    | {
        checked: boolean;
        onChange: (next: boolean) => void;
        defaultChecked?: never;
      }
    | {
        checked?: undefined;
        defaultChecked?: boolean | undefined;
        onChange?: ((next: boolean) => void) | undefined;
      }
  >
>;

type _describeReturn = Expect<Equal<ReturnType<typeof describeAction>, string>>;
type _resolveReturn = Expect<Equal<ReturnType<typeof resolveToggle>, ToggleState>>;

function _compileTimeOnly(): void {
  const link: ActionProps = { variant: "link", href: "/docs", label: "Docs" };
  const button: ActionProps = {
    variant: "button",
    onClick: () => undefined,
    label: "Save",
  };
  const submit: ActionProps = { variant: "submit", formId: "cart", label: "Pay" };
  void link;
  void button;
  void submit;

  const linkWithClick: ActionProps = {
    variant: "link",
    href: "/docs",
    label: "Docs",
    // @ts-expect-error — a link has no onClick.
    onClick: () => undefined,
  };
  void linkWithClick;

  const buttonWithHref: ActionProps = {
    variant: "button",
    onClick: () => undefined,
    label: "Save",
    // @ts-expect-error — a button has no href.
    href: "/docs",
  };
  void buttonWithHref;

  // @ts-expect-error — `href` is required for a link.
  const linkWithoutHref: ActionProps = { variant: "link", label: "Docs" };
  void linkWithoutHref;

  // @ts-expect-error — unknown variant.
  const unknownVariant: ActionProps = { variant: "toggle", label: "x" };
  void unknownVariant;

  /* Narrowing hands you the right extra prop in each branch. */
  const branchTypes = (props: ActionProps): void => {
    if (props.variant === "link") {
      const href = props.href;
      type _href = Expect<Equal<typeof href, string>>;
      // @ts-expect-error — onClick does not exist on the link member.
      props.onClick;
    }
    if (props.variant === "submit") {
      const formId = props.formId;
      type _formId = Expect<Equal<typeof formId, string>>;
    }
  };
  void branchTypes;

  /* TODO 3 */
  const idle: AsyncButtonProps = {};
  const notLoading: AsyncButtonProps = { loading: false };
  const loading: AsyncButtonProps = { loading: true, loadingLabel: "Saving…" };
  void idle;
  void notLoading;
  void loading;

  // @ts-expect-error — loading needs a label.
  const loadingNoLabel: AsyncButtonProps = { loading: true };
  void loadingNoLabel;

  // @ts-expect-error — a label for a state this button never enters.
  const labelNoLoading: AsyncButtonProps = { loadingLabel: "Saving…" };
  void labelNoLoading;

  // @ts-expect-error — same, spelled out.
  const labelNotLoading: AsyncButtonProps = {
    loading: false,
    loadingLabel: "Saving…",
  };
  void labelNotLoading;

  /* TODO 4 */
  const controlled: ToggleProps = {
    checked: true,
    onChange: () => undefined,
  };
  const uncontrolled: ToggleProps = { defaultChecked: true };
  const bare: ToggleProps = {};
  const uncontrolledWithHandler: ToggleProps = {
    defaultChecked: false,
    onChange: () => undefined,
  };
  void controlled;
  void uncontrolled;
  void bare;
  void uncontrolledWithHandler;

  // @ts-expect-error — a controlled toggle with no onChange can never change.
  const stuck: ToggleProps = { checked: true };
  void stuck;

  // @ts-expect-error — pick one owner, not both.
  const both: ToggleProps = {
    checked: true,
    defaultChecked: false,
    onChange: () => undefined,
  };
  void both;

  /* Presence of `checked` is the discriminant, so it narrows. */
  const narrowing = (props: ToggleProps): void => {
    if (props.checked !== undefined) {
      const checked = props.checked;
      type _checked = Expect<Equal<typeof checked, boolean>>;
      // onChange is required on this member, so it is safe to call.
      props.onChange(!checked);
    } else {
      const fallback = props.defaultChecked;
      type _fallback = Expect<Equal<typeof fallback, boolean | undefined>>;
    }
  };
  void narrowing;
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("describeAction", () => {
  it("describes a link by its href", () => {
    expect(
      describeAction({ variant: "link", href: "/docs", label: "Docs" }),
    ).toBe("link → /docs");
  });

  it("describes a button by its label", () => {
    expect(
      describeAction({
        variant: "button",
        onClick: () => undefined,
        label: "Save",
      }),
    ).toBe("button → Save");
  });

  it("describes a submit by its form id", () => {
    expect(
      describeAction({ variant: "submit", formId: "cart", label: "Pay" }),
    ).toBe("submit → #cart");
  });

  it("throws on a variant the type system says cannot exist", () => {
    // The only way an unhandled variant reaches this function is from outside
    // the type system — a stale action replayed from storage, an untyped API
    // payload. `JSON.parse` returns `any`, which is exactly that door.
    const rogue: ActionProps = JSON.parse('{"variant":"modal","label":"x"}');

    // `assertNever` stringifies the value it was handed, so the offending
    // variant appears in the message.
    expect(() => describeAction(rogue)).toThrow(/modal/);
  });
});

describe("resolveToggle", () => {
  it("uses the prop when controlled", () => {
    expect(
      resolveToggle({ checked: true, onChange: () => undefined }, false),
    ).toEqual({ checked: true, controlled: true });
  });

  it("treats a controlled `false` as a value, not as absent", () => {
    expect(
      resolveToggle({ checked: false, onChange: () => undefined }, true),
    ).toEqual({ checked: false, controlled: true });
  });

  it("uses the internal value when uncontrolled", () => {
    expect(resolveToggle({ defaultChecked: true }, false)).toEqual({
      checked: false,
      controlled: false,
    });
    expect(resolveToggle({}, true)).toEqual({
      checked: true,
      controlled: false,
    });
  });

  it("never reads the parent's handler to decide the mode", () => {
    const onChange = vi.fn();

    expect(resolveToggle({ defaultChecked: false, onChange }, true)).toEqual({
      checked: true,
      controlled: false,
    });
    expect(onChange).not.toHaveBeenCalled();
  });
});
