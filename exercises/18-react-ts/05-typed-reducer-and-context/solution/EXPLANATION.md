# 18/05 — A typed reducer and context

## The action union is the design

```ts
type CartAction =
  | { type: "add"; item: CartItem }
  | { type: "remove"; id: string }
  | { type: "setQuantity"; id: string; quantity: number }
  | { type: "applyDiscount"; code: string }
  | { type: "clear" };
```

Everything else in the file is a consequence of this type.

- `useReducer(cartReducer, emptyCart)` infers `Dispatch<CartAction>` for free —
  React reads the reducer's second parameter. You never annotate `dispatch`.
- Each branch of the `switch` sees only the payload that branch's action
  carries. `action.item` does not exist in the `remove` branch, so it cannot be
  read there by accident.
- `dispatch({ type: "remove", item })` is a compile error at the *call site*,
  which is where the mistake was made.

The anti-pattern to name if asked: `{ type: string; payload?: unknown }`. It
compiles, it dispatches, and it gives you nothing — every branch has to
re-validate its own payload, which is the work the union was supposed to do.

## Identity, and why it matters more here

```ts
const items = state.items.filter((item) => item.id !== action.id);
if (items.length === state.items.length) return state;   // ← the important line
return { ...state, items };
```

React decides whether to re-render by comparing the previous value to the next
one with `Object.is`. A reducer that always returns a fresh object makes every
dispatch a re-render, including the ones that changed nothing — and a context
provider broadcasts that to *every* consumer in its subtree, not just the ones
that read the part that changed.

`filter` allocates unconditionally, so compare the lengths rather than the
arrays. For `setQuantity`, `some()` up front is simpler still.

This is also why `useReducer` beats a pile of `useState` calls once the state
has invariants: one dispatch produces one new state object, so one render. Three
`setState` calls in a handler are batched by React 18+, but the *logic* is still
spread across three places and nothing stops a fourth caller from setting two of
them and forgetting the third.

## `assertNever`, and what it actually buys

```ts
default:
  return assertNever(action, "unhandled cart action");
```

The compile-time half is the point: `action` is `never` in the default branch
only while every member is handled. Add a sixth action and *this line* stops
compiling, which is a far better place to find out than production.

The runtime half still earns its keep, because unions are erased. An action
replayed from `localStorage`, arriving over a websocket, or produced by an older
bundle in a stale tab can reach the reducer with a `type` no member declares.
The test builds one with `JSON.parse`, which returns `any` — genuinely the only
door such a value comes through.

Note the guard must be `return assertNever(...)`, not a bare call followed by
something else: a call to a `never`-returning function makes the rest of the
block unreachable, and narrowing is not computed there.

## Bound actions

```ts
export function makeCartActions(dispatch: Dispatch<CartAction>): CartActions {
  return {
    add: (item) => dispatch({ type: "add", item }),
    remove: (id) => dispatch({ type: "remove", id }),
    …
  };
}
```

Consumers call `actions.remove(id)` and never build an action object. Three
things follow: the action union becomes an implementation detail (renaming
`"remove"` is a one-file change), autocomplete on `actions.` is a genuine menu
of what the cart can do, and the awkward call sites — `setQuantity(id, quantity)`
rather than an object literal — read like ordinary methods.

In a real provider this object would be wrapped in `useMemo(…, [dispatch])`, so
that its identity is stable and consumers memoised on it do not re-render.
`dispatch` itself is guaranteed stable by React, which is what makes that
`useMemo` trivially correct.

## The context default, and two lies

`createContext` requires a default value, used when a consumer has no provider
above it. There is no honest default for "the cart provider is missing", so
there are three moves:

```ts
createContext<CartContextValue>(undefined!)
```
A non-null assertion over a value that really is `undefined`. The type says the
value is always present; at runtime a consumer outside the provider gets
`Cannot read properties of undefined (reading 'state')` from somewhere deep in
the component. `!` is banned in this repo precisely because of this shape.

```ts
createContext<CartContextValue>({} as CartContextValue)
```
Worse, because it does not even crash. The consumer renders an empty cart, and
the bug is a missing provider that looks like a data problem.

```ts
createContext<CartContextValue | undefined>(undefined)
```
The truth. `useContext` now returns `CartContextValue | undefined`, which is
exactly what is the case. The cost is one check — and `requireContext` pays it
**once**, at the boundary:

```ts
export function useCart(): CartContextValue {
  return requireContext(useContext(CartContext), "CartProvider");
}
```

Every consumer downstream sees a non-optional value with no `?.` and no `!`.
That is the whole pattern: **admit the undefined at the type level, discharge it
at one runtime check, hand out a clean type.** The same move as `safeJsonParse`
in 02/06 and the single cast in 08/05 — contain the awkwardness at one line
behind a good API.

`=== undefined` rather than truthiness, because `requireContext` is generic and
`0`, `""` and `false` are all legal context values. And name the provider in the
message: that error *is* the entire developer experience of forgetting a
provider, so make it the one a tired person can act on at 6pm.

## Where this goes next

Two things this exercise deliberately leaves out, worth knowing exist.

**Splitting the context.** `{ state, actions, dispatch }` in one context means
every consumer re-renders when the state changes, including ones that only
dispatch. The standard fix is two contexts — a state context and a stable
actions context — so that dispatch-only components never re-render. The types
are identical in shape; it is a rendering optimisation, not a typing one.

**`useReducer`'s lazy init.** `useReducer(reducer, initialArg, init)` runs
`init(initialArg)` once. It is typed the same way, and it is how you rehydrate a
cart from `localStorage` without doing the parse on every render.

## Common mistakes

| Mistake | What happens |
|---|---|
| `{ type: string; payload?: unknown }` | Every branch re-validates; no narrowing at all |
| Returning `{ ...state }` on a no-op | Every consumer of the context re-renders for nothing |
| `state.items.push(item)` | Mutation; React sees the same array and skips the render |
| `state.items.sort(…)` | Also mutation — `sort` is in place |
| `default: return state` | A forgotten action ships silently |
| `assertNever(action)` without `return` | Unreachable code after it; narrowing not computed |
| `createContext<T>(undefined!)` | Crashes deep in a consumer instead of at the boundary |
| `createContext<T>({} as T)` | Does not crash; renders wrong data instead |
| Checking `if (!value)` in `requireContext` | A context value of `0` or `false` is rejected |
| Building actions inline in each consumer | The action union leaks into every component |

## Interview angle

> *"How do you type a `useReducer`?"*

Lead with the action union discriminated on `type`, and point out what it buys:
`dispatch` is typed for free from the reducer's signature, each `case` narrows to
its own payload, and `assertNever` in the default makes a forgotten action a
build error rather than a silent no-op. If you get one more sentence, use it on
identity: an action that changes nothing must return the same state object,
because React compares by reference and a context provider broadcasts to its
whole subtree.

> *"`createContext` needs a default. What do you pass?"*

`undefined`, with `| undefined` in the type — then discharge it in one custom
hook that throws a message naming the provider. Say why the alternatives are
wrong, because that is the real question: `undefined!` lies and crashes deep in
a consumer, and a fake default object does not even crash — it renders empty
state, which is the harder bug. The pattern name is worth having: admit it in
the type, discharge it once at the boundary.
