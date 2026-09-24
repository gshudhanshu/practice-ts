# 22/01 — Branded types

**Tier:** Core · **Time:** ~25 min · **Course section:** 22 — Real-world patterns

---

## The bug this prevents

```ts
type UserId = string;
type OrderId = string;

declare function refund(userId: UserId, orderId: OrderId): void;

refund(orderId, userId); // ✔ compiles. Ships. Refunds the wrong thing.
```

Those aliases are documentation, not types. TypeScript is **structural**: two
types are compatible when their shapes match, and both of these are `string`.
In a nominal language (Java, C#, Rust) the *name* is part of the type and this
would not compile.

TypeScript has no nominal types, so we fake them by attaching a property that
exists only in the type system:

```ts
type UserId = string & { readonly __brand: "UserId" };
```

No actual string has a `__brand`, so no raw string is assignable, and `UserId`
and `OrderId` stop mixing. At runtime it is still a plain string — the brand is
erased along with every other type.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `Brand<T, B>`, the three branded aliases, and the private `brand()` helper. |
| 2 | `toUserId` — a smart constructor that **throws**. |
| 3 | `isOrderId` (a type predicate) and `toOrderId` (**returns `null`**). |
| 4 | `toCents`, `addCents`, `formatCents` — branding a number, and its cost. |
| 5 | `Assignment`, `assign`, `describeAssignment`. |

### Validation the tests pin down

| Constructor | Valid | Error |
|---|---|---|
| `toUserId` | `/^usr_[a-z0-9]+$/` | `TypeError` — `invalid UserId: <raw>` |
| `isOrderId` / `toOrderId` | `/^ord_[0-9]+$/` | `null` |
| `toCents` | a non-negative integer | `TypeError` — `invalid Cents: <value>` |

`formatCents(8999)` is `"£89.99"`; `formatCents(5)` is `"£0.05"`.

## Rules

- Do not edit `exercise.test.ts`.
- **This exercise permits exactly one `as`**, inside `brand()`. Branding is
  unavoidably a claim the compiler cannot check; the discipline is to contain
  that claim in one unexported two-line function, so every branded value in the
  program came through a constructor that validated it. Any other cast, and any
  `any` or `!`, is out.
- `brand()` is **not exported**. Anything that can reach it can brand a value
  without validating it.
- `toOrderId` must be written in terms of `isOrderId` — a predicate needs no
  cast, which is the point of TODO 3.

## Done when

```bash
npm run check 22/01
```

<details>
<summary>Hint 1 — the machinery</summary>

```ts
export type Brand<T, B extends string> = T & { readonly __brand: B };
export type UserId = Brand<string, "UserId">;

function brand<T, B extends string>(value: T): Brand<T, B> {
  return value as Brand<T, B>;
}
```

Call it with both type arguments — `brand<string, "UserId">(raw)` — since
nothing in the argument can tell TypeScript which brand you meant.
</details>

<details>
<summary>Hint 2 — a predicate is a checked cast</summary>

```ts
export function isOrderId(value: string): value is OrderId {
  return /^ord_[0-9]+$/.test(value);
}

export function toOrderId(raw: string): OrderId | null {
  return isOrderId(raw) ? raw : null;
}
```

Inside the `true` branch `raw` has been narrowed from `string` to `OrderId`, so
returning it needs no `as`. The predicate *is* the assertion — expressed in a
form the compiler tracks through control flow.
</details>

<details>
<summary>Hint 3 — arithmetic strips the brand</summary>

`a + b` where both are `Cents` produces a plain `number`, because the result of
`+` is not one of the operands. So `addCents` must re-brand:

```ts
return toCents(a + b);
```

That is the *cost* of branding, and it is worth naming out loud. It is also not
pure overhead — routing back through the constructor re-checks the invariant on
a value you just computed.
</details>

<details>
<summary>Hint 4 — throw, or return null?</summary>

Both are in this exercise on purpose. Throwing suits a value that arrives from
your own code and being wrong is a bug; returning `null` suits a value that
arrives from a user or a network and being wrong is Tuesday. 22/02 gives you a
third option that carries the *reason* as well.
</details>

<details>
<summary>Hint 5 — no unwrapping needed</summary>

```ts
return `${assignment.userId} owes ${formatCents(assignment.totalCents)} for ${assignment.orderId}`;
```

`UserId` is a subtype of `string`, so every string operation still works —
`.toUpperCase()`, `.length`, template interpolation, `JSON.stringify`. Branding
only restricts what can flow *in*.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md).

Next: [22/02 — `Result<T, E>`](../02-result-type/).
