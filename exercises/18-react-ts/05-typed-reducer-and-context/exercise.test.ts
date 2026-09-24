import { describe, expect, it, vi } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import type {
  Context,
  Dispatch,
  createContext,
  useContext,
  useReducer,
} from "react";
import {
  cartReducer,
  emptyCart,
  makeCartActions,
  requireContext,
  type CartAction,
  type CartActions,
  type CartContextRef,
  type CartContextValue,
  type CartItem,
  type CartState,
} from "./exercise";

/* ── Fixtures ───────────────────────────────────────────────────────────── */

const mug: CartItem = { id: "mug", name: "Mug", unitPrice: 900, quantity: 1 };
const tee: CartItem = { id: "tee", name: "T-shirt", unitPrice: 2500, quantity: 2 };

const cartWith = (...items: readonly CartItem[]): CartState => ({
  items,
  discountCode: null,
});

/* React's real types, reached through a type-only import: no runtime import,
   no renderer, but the flow below is checked against the genuine signatures. */
declare const useReducerRef: typeof useReducer;
declare const createContextRef: typeof createContext;
declare const useContextRef: typeof useContext;

/* ── Compile-time spec ──────────────────────────────────────────────────── */

/* TODO 1 — five actions, each with exactly its own payload. */
type _action = Expect<
  Equal<
    CartAction,
    | { type: "add"; item: CartItem }
    | { type: "remove"; id: string }
    | { type: "setQuantity"; id: string; quantity: number }
    | { type: "applyDiscount"; code: string }
    | { type: "clear" }
  >
>;

/* TODO 2 */
type _reducer = Expect<
  Equal<typeof cartReducer, (state: CartState, action: CartAction) => CartState>
>;

/* TODO 3 */
type _actions = Expect<Equal<ReturnType<typeof makeCartActions>, CartActions>>;

/* TODO 4 — the value is readonly, and the context admits `undefined` because
   that is the truth about a consumer rendered outside its provider. */
type _contextValue = Expect<
  Equal<
    CartContextValue,
    {
      readonly state: CartState;
      readonly actions: CartActions;
      readonly dispatch: Dispatch<CartAction>;
    }
  >
>;
type _contextRef = Expect<
  Equal<CartContextRef, Context<CartContextValue | undefined>>
>;

/* TODO 5 */
type _require = Expect<
  Equal<
    typeof requireContext,
    <T>(value: T | undefined, providerName: string) => T
  >
>;

function _compileTimeOnly(): void {
  /* The reducer plugs into React's own useReducer with no adaptation, and
     `dispatch` comes back typed by the action union. */
  const [state, dispatch] = useReducerRef(cartReducer, emptyCart);
  type _state = Expect<Equal<typeof state, CartState>>;
  type _dispatch = Expect<Equal<typeof dispatch, Dispatch<CartAction>>>;

  /* The whole provider/consumer round trip. */
  const CartContext: CartContextRef = createContextRef<
    CartContextValue | undefined
  >(undefined);

  const raw = useContextRef(CartContext);
  type _raw = Expect<Equal<typeof raw, CartContextValue | undefined>>;

  const value = requireContext(raw, "CartProvider");
  type _value = Expect<Equal<typeof value, CartContextValue>>;

  // No optional chaining and no `!` anywhere downstream — that is the payoff.
  value.state.items.length;
  value.actions.clear();
  value.dispatch({ type: "clear" });

  // @ts-expect-error — a context value is not reassigned field by field.
  value.state = emptyCart;

  // @ts-expect-error — `items` is readonly; the reducer owns it.
  value.state.items.push(mug);

  /* Actions carry exactly their own payload. */
  const add: CartAction = { type: "add", item: mug };
  const clear: CartAction = { type: "clear" };
  void add;
  void clear;

  // @ts-expect-error — `add` needs an item.
  const addNothing: CartAction = { type: "add" };
  void addNothing;

  const clearWithPayload: CartAction = {
    type: "clear",
    // @ts-expect-error — `clear` carries no payload.
    id: "mug",
  };
  void clearWithPayload;

  // @ts-expect-error — `remove` takes an id, not an item.
  const removeItem: CartAction = { type: "remove", item: mug };
  void removeItem;

  // @ts-expect-error — not a member of the union.
  const unknownAction: CartAction = { type: "explode" };
  void unknownAction;

  /* Narrowing gives each branch its own payload. */
  const narrow = (action: CartAction): void => {
    if (action.type === "setQuantity") {
      const quantity = action.quantity;
      type _quantity = Expect<Equal<typeof quantity, number>>;
      // @ts-expect-error — `item` belongs to the add action.
      action.item;
    }
    if (action.type === "applyDiscount") {
      const code = action.code;
      type _code = Expect<Equal<typeof code, string>>;
    }
  };
  void narrow;
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("cartReducer — add", () => {
  it("appends an item that is not in the cart", () => {
    expect(cartReducer(emptyCart, { type: "add", item: mug })).toEqual({
      items: [mug],
      discountCode: null,
    });
  });

  it("increases the quantity of an item already in the cart", () => {
    const state = cartWith(mug);
    const next = cartReducer(state, {
      type: "add",
      item: { ...mug, quantity: 3 },
    });

    expect(next.items).toEqual([{ ...mug, quantity: 4 }]);
  });

  it("keeps the existing name and price when merging", () => {
    const state = cartWith(mug);
    const next = cartReducer(state, {
      type: "add",
      item: { id: "mug", name: "MUG (renamed)", unitPrice: 1, quantity: 1 },
    });

    expect(next.items).toEqual([
      { id: "mug", name: "Mug", unitPrice: 900, quantity: 2 },
    ]);
  });

  it("keeps the other items in place", () => {
    const state = cartWith(mug, tee);
    const next = cartReducer(state, {
      type: "add",
      item: { ...tee, quantity: 1 },
    });

    expect(next.items).toEqual([mug, { ...tee, quantity: 3 }]);
  });

  it("does not mutate the previous state", () => {
    const state = cartWith(mug);
    const next = cartReducer(state, { type: "add", item: tee });

    expect(state.items).toEqual([mug]);
    expect(next.items).not.toBe(state.items);
  });
});

describe("cartReducer — remove", () => {
  it("drops the matching item", () => {
    expect(cartReducer(cartWith(mug, tee), { type: "remove", id: "mug" })).toEqual(
      { items: [tee], discountCode: null },
    );
  });

  it("returns the same state object when the id is unknown", () => {
    const state = cartWith(mug);
    expect(cartReducer(state, { type: "remove", id: "nope" })).toBe(state);
  });
});

describe("cartReducer — setQuantity", () => {
  it("sets the quantity", () => {
    const next = cartReducer(cartWith(mug), {
      type: "setQuantity",
      id: "mug",
      quantity: 5,
    });

    expect(next.items).toEqual([{ ...mug, quantity: 5 }]);
  });

  it("removes the item at zero or below", () => {
    expect(
      cartReducer(cartWith(mug, tee), {
        type: "setQuantity",
        id: "mug",
        quantity: 0,
      }).items,
    ).toEqual([tee]);

    expect(
      cartReducer(cartWith(mug), {
        type: "setQuantity",
        id: "mug",
        quantity: -2,
      }).items,
    ).toEqual([]);
  });

  it("returns the same state object when the id is unknown", () => {
    const state = cartWith(mug);
    expect(
      cartReducer(state, { type: "setQuantity", id: "nope", quantity: 4 }),
    ).toBe(state);
  });
});

describe("cartReducer — applyDiscount", () => {
  it("trims and upper-cases the code", () => {
    expect(
      cartReducer(cartWith(mug), { type: "applyDiscount", code: "  save10 " })
        .discountCode,
    ).toBe("SAVE10");
  });

  it("clears the code when it is blank", () => {
    const state: CartState = { items: [mug], discountCode: "SAVE10" };

    expect(
      cartReducer(state, { type: "applyDiscount", code: "   " }).discountCode,
    ).toBeNull();
    expect(
      cartReducer(state, { type: "applyDiscount", code: "" }).discountCode,
    ).toBeNull();
  });

  it("leaves the items alone", () => {
    const state = cartWith(mug, tee);
    expect(
      cartReducer(state, { type: "applyDiscount", code: "x" }).items,
    ).toEqual([mug, tee]);
  });
});

describe("cartReducer — clear", () => {
  it("empties the cart and drops the discount", () => {
    const state: CartState = { items: [mug, tee], discountCode: "SAVE10" };

    expect(cartReducer(state, { type: "clear" })).toEqual({
      items: [],
      discountCode: null,
    });
  });
});

describe("cartReducer — unhandled actions", () => {
  it("throws on an action the union does not contain", () => {
    // Unions are erased at runtime, so an action replayed from storage or
    // arriving from an untyped source can still reach the reducer. `JSON.parse`
    // returns `any`, which is exactly that door.
    const rogue: CartAction = JSON.parse('{"type":"explode"}');

    // `assertNever` stringifies the action, so the offending type shows up
    // in the message.
    expect(() => cartReducer(emptyCart, rogue)).toThrow(/explode/);
  });
});

describe("makeCartActions", () => {
  it("dispatches the right action for each call", () => {
    const dispatch = vi.fn();
    const actions = makeCartActions(dispatch);

    actions.add(mug);
    actions.remove("mug");
    actions.setQuantity("tee", 3);
    actions.applyDiscount("save10");
    actions.clear();

    expect(dispatch.mock.calls.map(([action]) => action)).toEqual([
      { type: "add", item: mug },
      { type: "remove", id: "mug" },
      { type: "setQuantity", id: "tee", quantity: 3 },
      { type: "applyDiscount", code: "save10" },
      { type: "clear" },
    ]);
  });

  it("dispatches nothing until an action is called", () => {
    const dispatch = vi.fn();
    makeCartActions(dispatch);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("drives the reducer end to end", () => {
    let state = emptyCart;
    const actions = makeCartActions((action) => {
      state = cartReducer(state, action);
    });

    actions.add(mug);
    actions.add({ ...mug, quantity: 2 });
    actions.applyDiscount(" save10 ");
    actions.setQuantity("mug", 1);

    expect(state).toEqual({
      items: [{ ...mug, quantity: 1 }],
      discountCode: "SAVE10",
    });
  });
});

describe("requireContext", () => {
  it("returns the value when there is one", () => {
    const value = { state: emptyCart };
    expect(requireContext(value, "CartProvider")).toBe(value);
  });

  it("returns falsy values unchanged", () => {
    expect(requireContext(0, "NumberProvider")).toBe(0);
    expect(requireContext("", "StringProvider")).toBe("");
    expect(requireContext(false, "FlagProvider")).toBe(false);
    expect(requireContext(null, "NullProvider")).toBeNull();
  });

  it("throws when the value is missing, naming the provider", () => {
    expect(() => requireContext(undefined, "CartProvider")).toThrow(
      /CartProvider/,
    );
  });
});
