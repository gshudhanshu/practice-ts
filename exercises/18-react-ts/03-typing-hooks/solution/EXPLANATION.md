# 18/03 — Typing hooks

## `SetStateAction<S>` and the uncallable half

```ts
type SetStateAction<S> = S | ((prevState: S) => S);
```

The obvious narrowing fails:

```ts
if (typeof action === "function") {
  return action(previous);
  //     ^ This expression is not callable.
  //       Not all constituents of type '((prevState: S) => S) | (S & Function)'
  //       are callable. Type 'S & Function' has no call signatures.
}
```

`typeof x === "function"` filters a union to its function-ish members. `S` is an
unresolved type parameter, so TypeScript cannot rule it out — the narrowed type
keeps `S & Function`, "whatever `S` is, given it is a function". That
intersection has no *call signature*, because nothing is known about the
parameters or the return type of an arbitrary `S`.

This is not a compiler shortcoming. It is the type-level version of a real
runtime hazard:

```ts
const [handler, setHandler] = useState<() => void>(doThing);  // calls doThing!
setHandler(otherThing);                                        // calls otherThing!
setHandler(() => otherThing);                                  // finally stores it
```

React cannot tell a state value that happens to be a function from an updater,
so it always treats a function as an updater. The compiler's refusal to narrow
is telling you the same thing.

The fix is a user-defined type predicate, which asserts the rule rather than
deriving it:

```ts
const isUpdater = <S,>(action: SetStateAction<S>): action is (prev: S) => S =>
  typeof action === "function";
```

`action(previous)` now typechecks, and the ambiguity is documented in one named
place instead of being papered over with a cast at the call site.

> `<S,>` rather than `<S>` is a `.tsx` habit: in a `.tsx` file a lone `<S>`
> parses as JSX. It is harmless in `.ts` and worth writing by default.

## When `useState` needs a type argument

The rule is short: **annotate when the initial value is not representative of
the state's whole domain.**

```ts
useState(0);                       // number             — fine
useState<Todo[]>([]);              // [] alone infers never[]
useState<User | null>(null);       // null alone infers null
useState<Status>("idle");          // "idle" alone infers string
```

The last one is the sneakiest: `useState("idle")` widens to `string`, so
`setStatus("idel")` compiles. Narrowing state to a union is the point of having
one.

The spec checks this directly:

```ts
const [, setUnannotated] = useStateRef(null);
setUnannotated({ id: "1", name: "Ada" });   // error: S was inferred as null
```

Do **not** annotate when the initial value already says everything —
`useState<number>(0)` is noise, and 08/01's "explicit type arguments are usually
a smell" applies here too.

## Tuple or array: `as const` versus an annotation

```ts
return [value, toggle];             // (boolean | (() => void))[]
return [value, toggle] as const;    // readonly [boolean, () => void]
```

An array literal infers an *array of the union*, because that is the type that
also describes `arr.push(…)`. For a hook that is useless: destructuring gives
every name the union, and `noUncheckedIndexedAccess` adds `| undefined` on top.

Two ways to fix it, and the choice is real:

| | Use when |
|---|---|
| `as const` | The tuple is anonymous and local. The type lives next to the value. |
| Explicit return type | The tuple type has a name worth reusing — `SelectionApi<T>` here — or it appears in a public API you version. |

`as const` also makes the tuple `readonly`, which is what you want: nobody
should be assigning into a hook's return value.

Note that `as const` is a **const assertion**, not a type assertion (02/03).
It is allowed everywhere in this repo, `as SomeType` is not, and they have
nothing to do with each other beyond the keyword.

## Why the updater form in `makeToggleApi`

```ts
setValue((current) => !current);   // correct
setValue(!value);                  // stale
```

`value` is the value *this render* closed over. React batches updates, so two
toggles in one event handler both compute `!value` from the same boolean and
produce one flip. The updater receives whatever React holds at the moment it
applies the update, so it composes.

The test proves it without React: it captures the action passed to the fake
setter and runs it from both `false` and `true`. Only an updater can pass both
assertions — a captured constant cannot.

## Dependency-injected callbacks

```ts
export type ListOptions<T> = {
  onAdd?: ((item: T) => void) | undefined;
  compare?: ((a: T, b: T) => number) | undefined;
  limit?: number | undefined;
};
```

Three details that make this a good options type:

- **Generic in `T`.** This is the whole reason `useList<Task>` can hand `onAdd`
  a `Task`. An options type that is not generic is an options type that gives
  callers `unknown`.
- **`| undefined` beside each `?`.** Options objects are assembled and spread
  more than any other kind of props object; see 18/01.
- **Function type in parentheses.** `onAdd?: (item: T) => void | undefined`
  parses as a function returning `void | undefined`, which is a different type
  and a bug the compiler will not point out.

At the call site, `onAdd?.(item)` invokes only when a callback was supplied.
`limit === undefined` rather than `!limit`, because `limit: 0` is a legitimate
limit — the same `??`-vs-`||` distinction as 02/04, in yet another costume.

## Why extract the logic at all

Everything in this file is a pure function, and the payoff is that it can be
tested with `expect(...)` and no renderer, no `act()`, no jsdom. A component
would then be a thin wrapper:

```ts
function useToggle(initial: boolean) {
  const [value, setValue] = useState(initial);
  return makeToggleApi(value, setValue);
}
```

The hook that remains has no branching left to test. That split is worth doing
on purpose, not only because React is not installed here — it is the difference
between a test suite that runs in 40 ms and one that runs in 40 s.

## Common mistakes

| Mistake | What happens |
|---|---|
| `typeof action === "function"` on a generic `SetStateAction` | Does not compile: `S & Function` is not callable |
| Casting the action instead of using a predicate | Compiles, and `as` is banned here for exactly this reason |
| `return [a, b]` from a hook | `(A \| B)[]`; destructuring gives both names the union |
| `useState([])` for a list | `never[]`; the first `setItems([todo])` fails |
| `useState("idle")` for a status union | Widens to `string`; typos compile |
| `setValue(!value)` in a toggle | Stale within a batch: two toggles, one flip |
| `onAdd?: (item: T) => void \| undefined` | Return type becomes `void \| undefined` |
| `items.push(item)` in `addItem` | Mutates a value React compares by reference |
| `if (limit)` | `limit: 0` silently ignored |

## Interview angle

> *"Why does `useState` need a type argument sometimes?"*

Because inference only sees the initial value. `[]` is `never[]`, `null` is
`null`, and `"idle"` widens to `string` — none of them describes the state's
domain. Give the rule ("annotate when the initial value is not representative"),
then the counterpart: `useState<number>(0)` is noise, and an explicit type
argument is usually a sign inference failed for a reason worth understanding.

> *"You have a custom hook returning `[value, setValue]`. Why does destructuring
> give me the wrong types?"*

Because an array literal infers an array of the union, not a tuple. Fix it with
`as const` or an explicit tuple return type, and say which you would pick and
why. The bonus point is knowing `as const` is a const assertion — it also makes
the tuple `readonly`, which for a hook's return value is a feature.
