# 06/06 — CHALLENGE: cart & pricing rules

**Tier:** Challenge · **Time:** ~40 min · **Course section:** 06 — Classes & interfaces

---

## Why this exercise exists

The last exercise of Phase 1, and it combines everything section 06 covered:

- an **interface** as the contract (06/04, 06/05)
- an **abstract class** implementing that interface once, on behalf of all rules (06/03)
- **concrete subclasses** supplying only the part that varies
- **polymorphic** aggregation over the interface type
- and money-as-integer-cents, from all the way back in 04/01

The shape — a fixed algorithm in the base, one varying step in the subclass — is
the template-method pattern, and pricing engines are its natural home.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `PricingRule` — `readonly name: string`, `discountCents(runningTotalCents, items): number`. Returns the **amount to subtract**. |
| 2 | `Cart` — `add`, `remove`, read-only `items` view, `subtotalCents` getter. |
| 3 | `ClampedRule` — abstract, implements `PricingRule` by clamping an abstract `rawDiscountCents` into `[0, runningTotalCents]`. |
| 4 | `PercentageOff` and `BuyOneGetOneFree`, both extending `ClampedRule`. |
| 5 | `checkout` — apply rules in order against the running total. |

### Details that the tests pin down

- **`add` with an existing sku** merges quantities and keeps the **original**
  unit price. Insertion order does not change.
- **`remove`** of an unknown sku is a silent no-op.
- **`PercentageOff`** rounds to the nearest cent.
- **`BuyOneGetOneFree`** discounts `floor(qty / 2) * unitPrice` for its sku;
  an sku not in the cart discounts nothing.
- **`checkout`** omits zero-value rules from `discounts`, never lets the total
  go below `0`, and always reports the pre-discount `subtotalCents`.

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.
- The clamping must live in `ClampedRule` **only** — a subclass that clamps
  its own result has missed the point.

## Done when

```bash
npm run check 06/06
```

<details>
<summary>Hint 1 — the abstract base</summary>

```ts
abstract class ClampedRule implements PricingRule {
  constructor(public readonly name: string) {}

  protected abstract rawDiscountCents(total: number, items: readonly CartItem[]): number;

  discountCents(total: number, items: readonly CartItem[]): number {
    // call rawDiscountCents, then clamp
  }
}
```

`protected` on the abstract member means subclasses must implement it, but
nothing outside the hierarchy can call it directly.
</details>

<details>
<summary>Hint 2 — merging cart lines</summary>

`Map.set` on a key that already exists **replaces the value and keeps the
original position**, so insertion order survives a merge for free. Build the
merged line from the existing one so the first unit price wins:

```ts
{ ...existing, qty: existing.qty + item.qty }
```
</details>

<details>
<summary>Hint 3 — a subclass only needs the arithmetic</summary>

`PercentageOff.rawDiscountCents` is one line and does not care about clamping
at all — the base guarantees it. That is exactly what you are testing when the
"200% off" and "-50%" cases both pass without either subclass mentioning zero.
</details>

<details>
<summary>Hint 4 — checkout's loop</summary>

Keep a `runningTotalCents` that starts at the subtotal. For each rule: ask for a
discount **against the running total**, skip it if it is `0`, otherwise record
it and subtract. Return the subtotal, the collected discounts, and whatever the
running total ended up as.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md).

**That completes Phase 1** — sections 02 to 06. See the
[repository README](../../../README.md) for what comes next.
