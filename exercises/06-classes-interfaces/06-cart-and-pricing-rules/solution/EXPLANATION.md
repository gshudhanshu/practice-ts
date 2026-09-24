# 06/06 — Cart & pricing rules

## The architecture in one picture

```
PricingRule            (interface — the contract consumers depend on)
   ▲
   │ implements
ClampedRule            (abstract — implements discountCents ONCE, for everyone)
   ▲            ▲
   │ extends    │ extends
PercentageOff   BuyOneGetOneFree      (concrete — only the arithmetic)
```

`checkout` depends on the **interface** at the top. It never learns which
concrete classes exist, so adding a fourth rule tomorrow requires no change to
it at all.

## Enforcing an invariant in one place

The clamp is the load-bearing idea:

```ts
discountCents(runningTotalCents, items) {
  const raw = this.rawDiscountCents(runningTotalCents, items);
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  return Math.min(raw, Math.max(runningTotalCents, 0));
}
```

**No rule can ever produce a negative discount or push the total below zero** —
and no subclass author has to remember that. `PercentageOff` computes
`Math.round(total * percent / 100)` and nothing else; `-50%` and `200%` are
handled correctly without it containing a single guard.

That is the template-method pattern earning its keep: the base owns the
*algorithm and its invariants*, the subclass owns the *one varying step*. Push
the clamp down into each subclass and you have four copies of a rule that will
eventually disagree.

`protected abstract` is the right modifier for the varying step: subclasses must
supply it, but outside code cannot call it and bypass the clamp.

## Interface + abstract class together

06/04 asked "interface or abstract class?" — the answer here is **both**, and
that combination is common in real designs:

- The **interface** is what consumers depend on. It admits implementations that
  do not extend your base at all (a rule from another package, a test fake, a
  plain object).
- The **abstract class** is a *convenience* for implementers: extend it and the
  invariant comes for free.

`checkout(cart, rules: readonly PricingRule[])` deliberately takes the
interface, so someone can hand it a rule that never heard of `ClampedRule`.
Requiring the base class would have coupled every consumer to your hierarchy.

## `Map` for the cart lines

Three properties are being used at once:

- **O(1) lookup** by sku for the merge in `add`.
- **Guaranteed insertion order** for the `items` view.
- **`set` on an existing key keeps its original position** — which is why
  merging a repeated sku does not move the line to the end.

That last one is a genuinely useful detail, and it is why the merge is a single
`set` rather than a delete-and-reinsert.

Note that `add` copies the incoming item (`{ ...item }`). Storing the caller's
object directly would let them mutate your cart from the outside afterwards —
the same aliasing concern that `readonly` parameters address elsewhere.

## Sequential vs parallel discounts

```ts
const amountCents = rule.discountCents(runningTotalCents, items);
```

Each rule sees what is **left**, not the original subtotal. On a £40 cart, 10%
off then 10% off gives £4 + £3.60 = £7.60, not £8.

This is a **business** decision, not a technical one, and real pricing engines
argue about it constantly — along with rule ordering, which discounts stack, and
whether tax applies before or after. Worth noticing that the code makes the
choice explicit and easy to change: swap `runningTotalCents` for `subtotalCents`
in that one call and the policy flips.

## Zero-value rules are omitted

```ts
if (amountCents <= 0) continue;
```

A breakdown listing "Summer sale: -£0.00" is noise on a receipt. Filtering at
the point of collection keeps `discounts` meaningful: it is "what actually
applied", not "what we evaluated".

## Common mistakes

| Mistake | What happens |
|---|---|
| Clamping inside each subclass | Works, but duplicates the invariant — the thing the design exists to prevent |
| `public abstract rawDiscountCents` | Callers can bypass the clamp entirely |
| Merging with the NEW unit price | The merge test expects the first price kept |
| Delete-then-set when merging | The line moves to the end; the order test fails |
| Passing `subtotalCents` to every rule | Discounts stop compounding; the ordering test fails |
| Pushing zero discounts | The "omits nothing rules" test fails |
| `items` returning `CartItem[]` | The `@ts-expect-error` on `push` stops erroring |
| `Math.floor(qty / 2) * qty` | Multiplying by the wrong operand — use the unit price |

## Interview angle

> *"Design a discount system for a shopping cart."*

This exercise is a complete answer. Lead with the **interface** so consumers
depend on an abstraction, then introduce the abstract base as the place
invariants live, then show two rules that are three lines each. Finish by
raising the questions the code makes visible: do discounts stack? in what order?
against the running total or the subtotal? Surfacing those unprompted is what
separates a design answer from a coding answer.

> *"Where would you put a validation rule that every implementation must
> follow?"*

In a base class implementing the shared method, calling an abstract hook — the
clamp here. Then the trade-off worth naming: it couples implementers to your
hierarchy, so keep consumers depending on the interface and let the base class
be optional. That is precisely why `checkout` takes `PricingRule[]` and not
`ClampedRule[]`.
