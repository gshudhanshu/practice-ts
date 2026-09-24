import { describe, expect, it, vi } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import type { Dispatch, SetStateAction, useState } from "react";
import {
  addItem,
  applySetState,
  makeToggleApi,
  type ListOptions,
  type SelectionApi,
} from "./exercise";

/* ── Fixtures ───────────────────────────────────────────────────────────── */

type User = { id: string; name: string };

const byLetter = (a: string, b: string): number => a.localeCompare(b);

/* React is not installed, and nothing here renders. `import type` gives us the
   real `useState` TYPE with no runtime import at all, so the hand-written types
   below are checked against React's own. */
declare const useStateRef: typeof useState;

/* ── Compile-time spec ──────────────────────────────────────────────────── */

/* TODO 1 */
type _applyReturn = Expect<
  Equal<typeof applySetState, <S>(previous: S, action: SetStateAction<S>) => S>
>;

/* TODO 2 — a readonly two-element tuple, with React's own setter type. */
type _selection = Expect<
  Equal<
    SelectionApi<User>,
    readonly [User | null, Dispatch<SetStateAction<User | null>>]
  >
>;

/* TODO 3 — inferred, and it must be a tuple. */
type _toggle = Expect<
  Equal<ReturnType<typeof makeToggleApi>, readonly [boolean, () => void]>
>;

/* TODO 4 */
type _listOptions = Expect<
  Equal<
    ListOptions<User>,
    {
      onAdd?: ((item: User) => void) | undefined;
      compare?: ((a: User, b: User) => number) | undefined;
      limit?: number | undefined;
    }
  >
>;

function _compileTimeOnly(): void {
  /* TODO 1 — both shapes of action, and the inferred S. */
  const count: number = 1;
  const replaced = applySetState(count, 2);
  type _replaced = Expect<Equal<typeof replaced, number>>;

  // Inference detail worth knowing: with two literal arguments and nothing to
  // widen against, `S` collects a candidate from each and stays literal.
  const bothLiterals = applySetState(1, 2);
  type _bothLiterals = Expect<Equal<typeof bothLiterals, 1 | 2>>;

  const updated = applySetState("a", (previous) => {
    type _previous = Expect<Equal<typeof previous, string>>;
    return previous.toUpperCase();
  });
  type _updated = Expect<Equal<typeof updated, string>>;

  // @ts-expect-error — the action must be S or an updater over S, not a string.
  applySetState(1, "two");

  // @ts-expect-error — an updater must return S.
  applySetState(1, (previous: number) => String(previous));

  /* TODO 2 — what `useState<User | null>(null)` returns must fit SelectionApi
     with no adaptation. This is the real React type, not a stand-in. */
  const fromUseState: SelectionApi<User> = useStateRef<User | null>(null);
  const [selected, select] = fromUseState;
  type _selected = Expect<Equal<typeof selected, User | null>>;
  type _select = Expect<
    Equal<typeof select, Dispatch<SetStateAction<User | null>>>
  >;
  select({ id: "1", name: "Ada" });
  select((current) => (current === null ? { id: "1", name: "Ada" } : null));

  // The tuple is readonly, so a caller cannot rewrite the hook's return value.
  // @ts-expect-error — index signature in type 'readonly […]' only permits reading.
  fromUseState[0] = null;

  /* Why the annotation on `useState` matters: with no type argument and a
     `null` initial value, S is inferred as `null` and the setter is useless. */
  const [, setUnannotated] = useStateRef(null);
  // @ts-expect-error — useState(null) infers S = null; the setter refuses a User.
  setUnannotated({ id: "1", name: "Ada" });

  /* TODO 3 — destructuring gives two distinct types, not a union. */
  const [open, toggle] = makeToggleApi(false, () => undefined);
  type _open = Expect<Equal<typeof open, boolean>>;
  type _toggleFn = Expect<Equal<typeof toggle, () => void>>;

  /* TODO 4 / 5 — the callbacks are typed in terms of T. */
  const users: readonly User[] = [];
  const next = addItem(users, { id: "1", name: "Ada" }, {
    onAdd: (item) => {
      type _item = Expect<Equal<typeof item, User>>;
    },
    compare: (a, b) => a.name.localeCompare(b.name),
  });
  type _next = Expect<Equal<typeof next, readonly User[]>>;

  // options is optional.
  addItem(users, { id: "2", name: "Grace" });

  // @ts-expect-error — the item must match the list's element type.
  addItem(users, "not a user");

  // @ts-expect-error — limit is a number.
  addItem(users, { id: "3", name: "Bea" }, { limit: "2" });
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("applySetState", () => {
  it("uses a plain value as the next state", () => {
    expect(applySetState(1, 2)).toBe(2);
    expect(applySetState("a", "b")).toBe("b");
  });

  it("calls an updater with the previous state", () => {
    expect(applySetState(1, (previous) => previous + 1)).toBe(2);
    expect(applySetState({ a: 1 }, (previous) => ({ a: previous.a + 1 }))).toEqual(
      { a: 2 },
    );
  });

  it("handles falsy states", () => {
    expect(applySetState(1, 0)).toBe(0);
    expect(applySetState("a", "")).toBe("");
    expect(applySetState(true, false)).toBe(false);
    expect(applySetState(5, (previous) => previous - 5)).toBe(0);
  });

  it("cannot store a function directly — React's documented trap", () => {
    const stored = (): string => "stored";

    // Passing the function is legal TypeScript (it matches `S`), but at runtime
    // it is indistinguishable from an updater, so it gets CALLED.
    expect(applySetState<() => string>(() => "old", stored)).toBe("stored");

    // The fix is React's own: wrap it in an updater that returns it.
    expect(applySetState<() => string>(() => "old", () => stored)).toBe(stored);
  });
});

describe("makeToggleApi", () => {
  it("hands back the current value", () => {
    const [open] = makeToggleApi(true, () => undefined);
    expect(open).toBe(true);
  });

  it("flips through the updater form, not the captured value", () => {
    let received: SetStateAction<boolean> | undefined;
    const setValue: Dispatch<SetStateAction<boolean>> = (action) => {
      received = action;
    };

    const [, toggle] = makeToggleApi(false, setValue);
    toggle();

    if (received === undefined) {
      throw new Error("toggle() did not call the setter");
    }

    // An updater flips whatever the CURRENT value is, so it is correct from
    // both — which is exactly what `setValue(!value)` would get wrong when two
    // toggles land in the same React batch.
    expect(applySetState(false, received)).toBe(true);
    expect(applySetState(true, received)).toBe(false);
  });

  it("does not call the setter until the toggle runs", () => {
    const setValue = vi.fn();
    makeToggleApi(false, setValue);
    expect(setValue).not.toHaveBeenCalled();
  });
});

describe("addItem", () => {
  it("appends without mutating", () => {
    const items: readonly string[] = ["b"];
    const next = addItem(items, "a");

    expect(next).toEqual(["b", "a"]);
    expect(items).toEqual(["b"]);
    expect(next).not.toBe(items);
  });

  it("sorts with the injected comparator", () => {
    expect(addItem(["b", "d"], "a", { compare: byLetter })).toEqual([
      "a",
      "b",
      "d",
    ]);
  });

  it("applies the limit after sorting", () => {
    expect(addItem(["b", "c"], "a", { compare: byLetter, limit: 2 })).toEqual([
      "a",
      "b",
    ]);
    expect(addItem(["b", "c"], "a", { limit: 2 })).toEqual(["b", "c"]);
  });

  it("notifies onAdd exactly once, with the added item", () => {
    const onAdd = vi.fn();
    addItem(["b"], "a", { onAdd });

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith("a");
  });

  it("works with no options at all", () => {
    expect(addItem([], "a")).toEqual(["a"]);
    expect(addItem(["a"], "b", {})).toEqual(["a", "b"]);
  });

  it("treats limit 0 as a limit, not as absent", () => {
    expect(addItem(["b"], "a", { limit: 0 })).toEqual([]);
  });
});
