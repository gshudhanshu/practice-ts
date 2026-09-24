# Section 18 — React + TypeScript

Maps to `18-react-ts` in the course repo.

Almost everything TypeScript has to say about React is about **types, not
rendering**: what a component accepts, which prop combinations are legal, what a
hook hands back, what a reducer can be told to do. That is also what interviews
probe — nobody asks you to render a list on a whiteboard, they ask you to type
one.

| # | Exercise | Tier | Time | Covers |
|---|---|---|---|---|
| 01 | [Typing props](01-typing-props/) | Drill → Core | 20 min | Required/optional under `exactOptionalPropertyTypes`, `ReactNode`, `PropsWithChildren`, `ComponentPropsWithoutRef`, why `React.FC` is discouraged |
| 02 | [Discriminated union props](02-discriminated-union-props/) | Core | 25 min | Tagged variants, `?: never`, controlled vs uncontrolled, `assertNever` |
| 03 | [Typing hooks](03-typing-hooks/) | Core | 30 min | `SetStateAction` narrowing, when `useState` needs a type argument, tuple returns, injected callbacks |
| 04 | [Generic & polymorphic components](04-generic-and-polymorphic-components/) | **Challenge** | 40 min | Generic function types, the `as` prop, `Omit<…, keyof P>` |
| 05 | [Typed reducer & context](05-typed-reducer-and-context/) | **Challenge** | 45 min | Action unions, exhaustive reducers, state identity, the `createContext` default footgun |

**Run one:** `npm run check 18/03` · **Run the section:** `npm run check 18`

## No JSX here, and that is the point

React itself is not installed in this repo. There is no renderer, no jsdom, no
`jsx` compiler option, and every file is a plain `.ts`. React's types come in
through **type-only imports**:

```ts
import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { useState } from "react";          // the TYPE of useState

declare const useStateRef: typeof useState;      // no runtime import at all
```

`import type` is erased entirely, so the specs can be checked against React's
genuine `useState`, `useReducer`, `createContext` and `useContext` signatures
without a single runtime dependency.

This is a deliberate choice, not a limitation. Two reasons:

- **It is where the difficulty actually is.** Rendering a component is the part
  you can see going wrong. A props type that silently accepts an illegal
  combination, a hook returning `(string | (() => void))[]` instead of a tuple,
  an `as` prop whose `size` collapsed to `never` — none of those show up on
  screen, and all of them are what an interviewer asks about.
- **It keeps the exercises honest.** Every runtime test here runs against a
  **pure function** — a reducer, a prop normaliser, hook logic lifted out of the
  hook. That split is worth making on purpose in real code too: it is the
  difference between a suite that runs in 40 ms and one that needs `act()`,
  fake timers and a DOM.

So the two layers are the same as everywhere else in this repo:

| Layer | Question |
|---|---|
| `Expect<Equal<…>>` and `@ts-expect-error` | Is the type right — and are the wrong things actually rejected? |
| Vitest, on pure functions | Does the logic produce the right values? |

## What to take away

- **A component is a function from props to UI**, so nearly all React typing is
  one object type. Get the props right and the rest follows.
- **`exactOptionalPropertyTypes` splits "optional" in two.** `tone?: Tone` means
  absent; `tone?: Tone | undefined` also allows an explicit undefined. Use the
  first for your own contract, the second where props arrive by spreading —
  which is what `@types/react` does for every DOM prop.
- **Extend the native element** with `ComponentPropsWithoutRef<"button">` rather
  than re-declaring props. `Omit` before overriding, always.
- **Make illegal prop combinations unrepresentable** with a discriminated union.
  Excess-property checking catches the literal case; `?: never` catches the rest.
- **`SetStateAction<S>` does not narrow with `typeof`** when `S` is generic —
  and the reason is the same reason React cannot store a function in state.
- **A hook returning a tuple must say so**, with `as const` or an explicit tuple
  type. Otherwise callers destructure a union.
- **`React.FC` cannot express a generic component.** That, not the `children`
  history, is the reason it lost.
- **An action union plus `assertNever`** turns "somebody forgot a case" into a
  build failure — and a reducer must return the *same* state object when nothing
  changed, because React compares by identity.
- **Admit `undefined` in a context's type and discharge it once**, in a hook
  that throws with the provider's name. `undefined!` and `{} as T` are both
  lies, and the second one does not even crash.

## Interview questions this section prepares you for

- How would you type a component that wraps a native `<button>` and adds a prop?
- Do you use `React.FC`? Why or why not?
- How do you stop someone passing `href` and `onClick` to the same component?
- How would you type a component that is either controlled or uncontrolled?
- Why does `useState` sometimes need a type argument?
- My custom hook returns `[value, setValue]` — why are the destructured types
  wrong?
- **Write a `<List>` that infers its item type from `items`.** (18/04.)
- How would you type an `as` prop?
- How do you type a `useReducer`, and how do you keep the switch exhaustive?
- `createContext` needs a default value. What do you pass, and why?
