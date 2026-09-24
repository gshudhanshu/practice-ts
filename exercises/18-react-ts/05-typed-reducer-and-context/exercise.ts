/**
 * Exercise 18/05 — CHALLENGE: a typed reducer and context
 *
 * The end of the section, and the piece of a React codebase that TypeScript
 * pays for most: state that only changes through a closed set of actions.
 *
 *   - the ACTION UNION is the state machine's alphabet. Nothing else can be
 *     dispatched, and each action carries exactly the payload it needs
 *   - the REDUCER is a pure function `(state, action) => state`, so it can be
 *     tested to death with no renderer at all
 *   - `assertNever` in the default branch turns "somebody added an action and
 *     forgot to handle it" into a build failure
 *   - the CONTEXT VALUE has to survive a consumer rendered outside its
 *     provider, and every way of doing that except one is a lie
 *
 * Read README.md first. Replace every TODO.
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

/** Given: the empty cart. */
export const emptyCart: CartState = { items: [], discountCode: null };

/**
 * Given: the exhaustiveness guard from 02/06. Anything other than `never`
 * passed here is a compile error.
 */
export function assertNever(value: never, message: string): never {
  throw new Error(`${message}: ${JSON.stringify(value)}`);
}

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// The cart's alphabet. Five actions, discriminated by `type`, each carrying
// exactly the payload it needs and nothing more:
//
//   add          — the whole CartItem to add
//   remove       — the id to drop
//   setQuantity  — an id and the new quantity
//   applyDiscount— a discount code
//   clear        — no payload at all
//
// An action with a payload it does not need is an action somebody will one day
// read and believe.
export type CartAction = unknown;

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// The reducer. Pure: it never mutates `state`, and it returns a NEW state
// object whenever anything changed.
//
//   add          — an item already in the cart has its quantity INCREASED by
//                  the incoming quantity, keeping the existing name and price;
//                  otherwise the item is appended
//   remove       — drops the matching item; an unknown id changes nothing
//   setQuantity  — sets it; a quantity of 0 or less REMOVES the item;
//                  an unknown id changes nothing
//   applyDiscount— trims and upper-cases the code; a blank code clears it
//                  back to null
//   clear        — back to `emptyCart`'s shape
//
// One extra rule, and it matters more in React than anywhere else: an action
// that changes NOTHING must return the state object it was given, by
// reference. React re-renders on identity, so a reducer that always returns
// `{ ...state }` re-renders every consumer on every no-op dispatch.
//
// The `default` branch must call `assertNever`, so adding a sixth action breaks
// the build here.
export function cartReducer(state: CartState, action: CartAction): CartState {
  throw new Error("TODO 2: implement cartReducer");
}

/** Given: the bound actions a consumer actually wants to call. */
export type CartActions = {
  add: (item: CartItem) => void;
  remove: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  applyDiscount: (code: string) => void;
  clear: () => void;
};

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// Bind the actions to a dispatch. This is what a provider builds once and puts
// on the context, so that consumers call `actions.remove(id)` and never have to
// know the action union exists.
//
//   const actions = makeCartActions(dispatch);
//   actions.remove("a");     // dispatches { type: "remove", id: "a" }
//   actions.clear();         // dispatches { type: "clear" }
//
// `Dispatch<CartAction>` is React's own type for what `useReducer` hands back —
// it is `(value: CartAction) => void`.
export function makeCartActions(dispatch: Dispatch<CartAction>): CartActions {
  throw new Error("TODO 3: implement makeCartActions");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Two types.
//
// `CartContextValue` — what a consumer gets: the current state, the bound
// actions, and the raw dispatch for anything the actions do not cover. All
// three are `readonly`; nobody reassigns fields on a context value.
//
// `CartContextRef` — the type of the context object itself.
//
// The footgun this is about: `createContext` demands a default value, and there
// is no honest default for "the provider is missing". The three ways out are
//
//   createContext<CartContextValue>(undefined!)          // a lie, and `!` is banned
//   createContext<CartContextValue>({} as CartContextValue) // a lie that renders
//   createContext<CartContextValue | undefined>(undefined)  // the truth
//
// Take the third. It makes `useContext` return `CartContextValue | undefined`,
// which is exactly what is true — and TODO 5 turns it back into a non-optional
// value at ONE place instead of at every consumer.
export type CartContextValue = unknown;
export type CartContextRef = unknown;

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// The one place the `| undefined` is discharged.
//
//   const value = requireContext(useContext(CartContext), "CartProvider");
//   value.state.items          // no optional chaining, no non-null assertion
//
// Throw when the value is missing, and name the provider in the message — that
// error is the entire user experience of forgetting a provider, so make it the
// one a tired developer can act on. "Cannot read properties of undefined" is
// what you get instead if you skip this.
//
// It is generic on purpose: every context in the codebase wants it.
export function requireContext<T>(value: T | undefined, providerName: string): T {
  throw new Error("TODO 5: implement requireContext");
}
