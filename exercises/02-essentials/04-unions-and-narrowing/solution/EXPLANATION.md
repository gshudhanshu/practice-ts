# 02/04 — Union types & narrowing

## Why each answer is what it is

### Narrowing, and the whole toolbox

"Narrowing" is the compiler shrinking a union based on a runtime check you
wrote. Every technique in this exercise is one of these:

| Check | Narrows | Use when |
|---|---|---|
| `typeof x === "string"` | primitives | union of primitives |
| `x.kind === "circle"` | discriminated union | **the default choice for objects** |
| `"email" in x` | object union | no shared discriminant available |
| `x instanceof Date` | class instances | real classes, not plain objects |
| `x === null`, `x != null` | nullish | optional values |
| `Array.isArray(x)` | arrays | `T \| T[]` |
| `isFoo(x): x is Foo` | anything | custom logic — see 02/03 |

### `formatValue` — early returns keep the union shrinking

```ts
if (typeof value === "string") { … return; }
if (typeof value === "number") { … return; }
return value ? "yes" : "no";   // value is `boolean` here
```

After two early returns the compiler has eliminated `string` and `number`, so
the final line needs no check at all. Structuring narrowing as early returns
rather than `else if` chains keeps the remaining type as small as possible and
reads better as the union grows.

### Discriminated unions — the important idea

```ts
type Shape =
  | { kind: "circle";    radius: number }
  | { kind: "rectangle"; width: number; height: number }
  | { kind: "triangle";  base: number;  height: number };
```

Two rules make this work:

1. the discriminant property has the **same name** in every member, and
2. its type is a distinct **literal** in each.

`kind: string` breaks it instantly — that is the starter's bug. With literals,
`switch (shape.kind)` narrows `shape` itself in each `case`, so `shape.radius`
is legal in one branch and a compile error in another.

**Compare with the alternative people reach for first:**

```ts
// The bag-of-optionals anti-pattern
type Shape = {
  kind: string;
  radius?: number;
  width?: number;
  height?: number;
};
```

Now every field is possibly `undefined` everywhere, `{ kind: "circle", width: 3 }`
is a legal value, and every read needs a `?.` or a `!`. The union encodes
"a circle has a radius and nothing else" as a fact the compiler enforces.

Notice too that the exhaustive `switch` needs **no `default` clause and no
return after it** — TypeScript proves every case is covered. Add a fourth shape
and `area` immediately fails to compile. That is the property you want. (02/06
shows how to make that failure explicit with `never`.)

### `??` vs `||` — a genuinely common production bug

```ts
value || fallback   // fires on 0, "", NaN, false, null, undefined
value ?? fallback   // fires on null and undefined ONLY
```

`||` checks *falsiness*; `??` checks *nullishness*. Whenever `0` or `""` is a
legitimate value — quantities, prices, search terms, comment bodies, "0 items
selected" — `||` silently replaces real data with your default.

```ts
const port = config.port || 3000;   // config.port = 0 -> 3000. Wrong.
const port = config.port ?? 3000;   // config.port = 0 -> 0.    Right.
```

Related: `??=`, and `?.` for optional chaining. Note that `a ?? b || c` is a
**syntax error** on purpose — TypeScript makes you parenthesise rather than
guess your intent.

### The `in` operator

`EmailContact` and `PhoneContact` share nothing, so `typeof` (both `"object"`)
and `switch` are useless. `"email" in contact` narrows to the member that
declares that property.

`in` is the right tool for third-party or legacy shapes you cannot change. When
you *do* control the types, add a discriminant instead — it is more explicit,
survives refactors, and scales past two members.

## Common mistakes

| Mistake | What happens |
|---|---|
| `kind: string` in `Shape` | Nothing narrows; `shape.radius` errors in every branch |
| `radius?: number` on a single object type | `_circle` assertion fails; every read needs `!` |
| `value \|\| fallback` in TODO 4 | `withDefault(0, 5)` returns 5, `withDefault("", …)` returns the fallback |
| `switch` with a `default: throw` | Passes today, but silently swallows a new shape tomorrow |
| Casting inside `area` (`(shape as Circle).radius`) | Compiles, defeats the entire exercise |
| `contact.email !== undefined` | Compile error — `email` does not exist on the union yet |

## Interview angle

> *"How would you type an API response that is either a success or a failure?"*

A discriminated union, every time:

```ts
type Result<T> =
  | { status: "success"; data: T }
  | { status: "error"; error: string };
```

Then say why: it makes the invalid state — having both `data` and `error`, or
neither — **unrepresentable**, rather than merely discouraged. "Make illegal
states unrepresentable" is the phrase; using it correctly signals you think in
types rather than just annotating.

> *"What is the difference between `??` and `||`?"*

Nullish vs falsy, as above. Reach for the `port = 0` example — it lands
immediately and shows you have been bitten by it in real code.
