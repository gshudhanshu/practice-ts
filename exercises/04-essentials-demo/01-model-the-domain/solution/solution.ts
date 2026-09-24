/**
 * Solution — 04/01 Model the domain
 */

export const CATEGORIES = [
  "food",
  "transport",
  "housing",
  "entertainment",
  "other",
] as const;

export type Category = (typeof CATEGORIES)[number];

// Each member carries exactly the data that method needs, and nothing else.
// `{ method: "card" }` with no last4 is now unconstructable — the type makes
// the invalid state unrepresentable rather than merely discouraged.
export type Payment =
  | { method: "cash" }
  | { method: "card"; last4: string }
  | { method: "transfer"; reference: string };

export type Expense = {
  id: string;
  description: string;
  // Integer cents, never a float. 0.1 + 0.2 !== 0.3, and money is the one
  // domain where that difference ends up in a court filing.
  amountCents: number;
  category: Category;
  // ISO "YYYY-MM-DD". Fixed-width ISO dates sort correctly as plain strings,
  // which part 2 relies on for range filtering.
  date: string;
  payment: Payment;
  note?: string;
};

export function isCategory(value: string): value is Category {
  // `.includes` will not compile against a readonly tuple of literals (02/03).
  return CATEGORIES.some((category) => category === value);
}

export function assertNever(value: never): never {
  throw new Error(`Unhandled: ${JSON.stringify(value)}`);
}

export function describePayment(payment: Payment): string {
  switch (payment.method) {
    case "cash":
      return "cash";
    case "card":
      // Narrowed to the card member, so `last4` is available without a cast.
      return `card ending ${payment.last4}`;
    case "transfer":
      return `transfer ref ${payment.reference}`;
    default:
      // Add a fourth payment method and this line stops compiling.
      return assertNever(payment);
  }
}
