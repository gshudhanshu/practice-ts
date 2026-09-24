# 18/05 — CHALLENGE: a typed reducer and context

**Tier:** Challenge · **Time:** ~45 min · **Course section:** 18 — React + TypeScript

---

## Why this exercise exists

This is the part of a React codebase TypeScript pays for most: state that can
only change through a **closed set of actions**.

- The **action union** is the state machine's alphabet. Nothing else can be
  dispatched, and each action carries exactly the payload it needs.
- The **reducer** is `(state, action) => state` — a pure function, so it can be
  tested to exhaustion with no renderer, no `act()`, no jsdom. This exercise
  does exactly that.
- **`assertNever`** in the `default` branch turns "somebody added an action and
  forgot to handle it" from a code-review comment into a build failure.
- The **context value** has to survive a consumer rendered outside its provider,
  and every way of handling that except one is a lie:

  ```ts
  createContext<CartContextValue>(undefined!)              // `!` is banned, and it lies
  createContext<CartContextValue>({} as CartContextValue)  // a lie that renders an empty cart
  createContext<CartContextValue | undefined>(undefined)   // true, and costs one guard
  ```

It is a challenge because all four have to hold at once, and because a reducer
that *works* is easy while a reducer that also preserves object identity on a
no-op is the one that does not re-render your whole tree.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `CartAction` — five actions, each with exactly its own payload. |
| 2 | `cartReducer` — pure, exhaustive, and identity-preserving on a no-op. |
| 3 | `makeCartActions` — bind the actions to a `Dispatch<CartAction>`. |
| 4 | `CartContextValue` / `CartContextRef` — readonly value, honest `\| undefined`. |
| 5 | `requireContext` — discharge the `undefined` once, with a usable message. |

### The reducer's rules, precisely

| Action | Behaviour |
|---|---|
| `add` | Item already present → its quantity **increases**, keeping the cart's existing name and price. Otherwise appended. |
| `remove` | Drops the matching item. **Unknown id → the same state object, by reference.** |
| `setQuantity` | Sets it; `0` or less **removes** the item. **Unknown id → the same state object.** |
| `applyDiscount` | Trimmed and upper-cased; a blank code sets `discountCode` back to `null`. |
| `clear` | Empty items, no discount. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.
- Never mutate `state`. No `push`, no `sort`, no assignment into `state.items`.
- The `default` branch must go through `assertNever`.

## Done when

```bash
npm run check 18/05
```

<details>
<summary>Hint 1 — payload per action, not one shared payload</summary>

```ts
type CartAction =
  | { type: "add"; item: CartItem }
  | { type: "remove"; id: string }
  | { type: "clear" };
```

Not `{ type: …; payload?: unknown }`. The point of the union is that each branch
of the reducer sees only what that action actually carries.
</details>

<details>
<summary>Hint 2 — returning the same state</summary>

```ts
const items = state.items.filter((item) => item.id !== action.id);
if (items.length === state.items.length) return state;
return { ...state, items };
```

`filter` always allocates, so compare the lengths rather than the arrays. For
`setQuantity`, `some()` before doing any work is simpler.

React compares by identity, so `{ ...state }` on a no-op dispatch re-renders
every consumer of the context for nothing.
</details>

<details>
<summary>Hint 3 — the context types</summary>

```ts
type CartContextRef = Context<CartContextValue | undefined>;
```

`Context<T>` is React's own type for the object `createContext` returns. The
spec proves the round trip against the real `createContext` and `useContext`
through a type-only import — you never call them.
</details>

<details>
<summary>Hint 4 — TODO 5 narrows for free</summary>

```ts
if (value === undefined) throw new Error(`Missing <${providerName}>. …`);
return value;
```

`=== undefined`, never truthiness — the helper is generic, and `0`, `""` and
`false` are all legal context values. One test checks each of them.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
why identity matters more in a reducer than anywhere else, the three ways to
handle `createContext`'s default and why two of them are lies, and how to split
one context into two when re-renders become a problem.

**That completes section 18.** Back to the [section index](../README.md).
