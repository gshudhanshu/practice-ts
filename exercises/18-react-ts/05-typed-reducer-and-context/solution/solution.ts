/**
 * Solution — 18/05 A typed reducer and context
 */

import type { Context, Dispatch } from "react";

export type CartItem = {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
};

export type CartState = {
  items: readonly CartItem[];
  discountCode: string | null;
};

export const emptyCart: CartState = { items: [], discountCode: null };

export function assertNever(value: never, message: string): never {
  throw new Error(`${message}: ${JSON.stringify(value)}`);
}

// The state machine's alphabet. Each member carries exactly its own payload —
// `clear` carries none, `remove` carries an id and not a whole item — so a
// reader of any single branch knows what is available without checking.
export type CartAction =
  | { type: "add"; item: CartItem }
  | { type: "remove"; id: string }
  | { type: "setQuantity"; id: string; quantity: number }
  | { type: "applyDiscount"; code: string }
  | { type: "clear" };

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "add": {
      const alreadyThere = state.items.some(
        (item) => item.id === action.item.id,
      );

      if (!alreadyThere) {
        return { ...state, items: [...state.items, action.item] };
      }

      // Merge: the cart's own name and price win. The incoming item is a
      // request to add quantity, not to restate the catalogue.
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.item.id
            ? { ...item, quantity: item.quantity + action.item.quantity }
            : item,
        ),
      };
    }

    case "remove": {
      const items = state.items.filter((item) => item.id !== action.id);

      // Nothing changed — return the SAME object. React re-renders on
      // identity, so `{ ...state }` here would re-render every consumer of the
      // context on a dispatch that did nothing.
      if (items.length === state.items.length) return state;

      return { ...state, items };
    }

    case "setQuantity": {
      if (!state.items.some((item) => item.id === action.id)) return state;

      const items =
        action.quantity <= 0
          ? state.items.filter((item) => item.id !== action.id)
          : state.items.map((item) =>
              item.id === action.id
                ? { ...item, quantity: action.quantity }
                : item,
            );

      return { ...state, items };
    }

    case "applyDiscount": {
      const code = action.code.trim();
      return {
        ...state,
        discountCode: code === "" ? null : code.toUpperCase(),
      };
    }

    case "clear":
      return { items: [], discountCode: null };

    default:
      // `action` is `never` here only while every member is handled. Add a
      // sixth action and this line stops compiling.
      return assertNever(action, "unhandled cart action");
  }
}

export type CartActions = {
  add: (item: CartItem) => void;
  remove: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  applyDiscount: (code: string) => void;
  clear: () => void;
};

// The provider builds this once and puts it on the context, so consumers never
// construct an action object themselves. That is what keeps the action union an
// implementation detail — and what makes renaming an action a one-file change.
export function makeCartActions(dispatch: Dispatch<CartAction>): CartActions {
  return {
    add: (item) => dispatch({ type: "add", item }),
    remove: (id) => dispatch({ type: "remove", id }),
    setQuantity: (id, quantity) =>
      dispatch({ type: "setQuantity", id, quantity }),
    applyDiscount: (code) => dispatch({ type: "applyDiscount", code }),
    clear: () => dispatch({ type: "clear" }),
  };
}

// `readonly` on every field: a context value is replaced wholesale by the
// provider, never patched by a consumer.
export type CartContextValue = {
  readonly state: CartState;
  readonly actions: CartActions;
  readonly dispatch: Dispatch<CartAction>;
};

// `| undefined` is the honest type. `createContext` needs a default value and
// there is no honest default for "no provider above me", so the alternatives
// are `undefined!` (banned, and a lie) or a fake object (a lie that renders an
// empty cart instead of failing). Admitting the undefined costs one guard, at
// one place — the next function.
export type CartContextRef = Context<CartContextValue | undefined>;

export function requireContext<T>(
  value: T | undefined,
  providerName: string,
): T {
  // `=== undefined`, not truthiness: a context value of `0`, `""` or `false` is
  // perfectly legal, and this helper is generic on purpose.
  if (value === undefined) {
    throw new Error(
      `Missing <${providerName}>. This hook must be called inside it.`,
    );
  }

  return value;
}
