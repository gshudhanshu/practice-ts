# Section 06 — Classes & interfaces

Maps to `06-classes-interfaces` in the course repo.

The object-oriented half of TypeScript, and the section that produces the most
interview questions per line of code. Six exercises, ending with a challenge
that combines an interface, an abstract base, and two concrete implementations.

| # | Exercise | Tier | Time | Covers |
|---|---|---|---|---|
| 01 | [Class fundamentals](01-class-fundamentals/) | Drill → Core | 20 min | Parameter properties, `private` vs `#`, throw vs return |
| 02 | [static, getters & setters](02-static-getters-setters/) | Core | 20 min | Static members, private constructor + factories, accessors |
| 03 | [Abstract & inheritance](03-abstract-and-inheritance/) | Core | 25 min | `abstract`, `protected`, `super`, `override` |
| 04 | [Interfaces vs type aliases](04-interfaces-vs-type-aliases/) | Core | 20 min | Declaration merging, `extends` vs `&`, `implements` |
| 05 | [Implementing interfaces](05-implementing-interfaces/) | Core → Challenge | 30 min | Polymorphism, the decorator pattern, dependency inversion |
| 06 | [Cart & pricing rules](06-cart-and-pricing-rules/) | **Challenge** | 40 min | Interface + abstract base + subclasses, invariants in one place |

**Run one:** `npm run check 06/04` · **Run the section:** `npm run check 06`

## What to take away

- **`private` is compile-time; `#private` is real.** `private` is readable via
  bracket access and from plain JavaScript.
- **Private constructor + static factories** buys you named construction,
  validation before existence, and control over instantiation.
- **`override` is a compile-time assertion**, and `noImplicitOverride` is what
  stops a base-class rename turning every override into silently dead code.
- **Unions need `type`; declaration merging needs `interface`.** Those are the
  only two forcing cases — everything else is preference.
- **Depend on the interface, not the class.** That one habit is what makes the
  decorator in 06/05 and the pricing engine in 06/06 possible.
- **Put invariants in one place.** The clamp in 06/06 is the entire design.

## Interview questions this section prepares you for

- `private` vs `#` — what's the difference?
- Abstract class or interface?
- What does the `override` keyword actually do?
- Interface or type alias?
- How would you add retries to an existing service without changing it?
- How do you test a class that sends emails?
- Design a discount system for a shopping cart.
