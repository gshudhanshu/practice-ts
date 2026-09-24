/**
 * Solution — 22/01 Branded types
 */

/**
 * The brand is a property that exists only in the type system. Nothing at
 * runtime ever has it, which is exactly why no raw value is assignable.
 *
 * `readonly` and the double underscore are conventions, not requirements —
 * they signal "do not touch this" to anyone reading a hover tooltip. Some
 * codebases use a `unique symbol` instead, which makes the property truly
 * unforgeable at the cost of a slightly noisier declaration.
 */
export type Brand<T, B extends string> = T & { readonly __brand: B };

export type UserId = Brand<string, "UserId">;
export type OrderId = Brand<string, "OrderId">;
export type Cents = Brand<number, "Cents">;

/**
 * THE one cast in this file.
 *
 * Branding is unavoidably a claim the compiler cannot verify: `value` really
 * has no `__brand` property, and never will. Containing that claim in a single
 * two-line function — not exported, so nothing outside can reach it — means
 * every branded value in the program came through a constructor that validated
 * it first.
 */
function brand<T, B extends string>(value: T): Brand<T, B> {
  return value as Brand<T, B>;
}

const USER_ID = /^usr_[a-z0-9]+$/;
const ORDER_ID = /^ord_[0-9]+$/;

export function toUserId(raw: string): UserId {
  if (!USER_ID.test(raw)) {
    throw new TypeError(`invalid UserId: ${raw}`);
  }
  return brand<string, "UserId">(raw);
}

/**
 * A type predicate is the second way to produce a branded value — and it needs
 * no cast at all, because `value is OrderId` IS the assertion, expressed in a
 * form the compiler tracks through control flow.
 */
export function isOrderId(value: string): value is OrderId {
  return ORDER_ID.test(value);
}

export function toOrderId(raw: string): OrderId | null {
  // Inside the `if`, `raw` has already been narrowed from `string` to
  // `OrderId`, so this returns a branded value with no `as` anywhere.
  return isOrderId(raw) ? raw : null;
}

export function toCents(value: number): Cents {
  if (!Number.isInteger(value) || value < 0) {
    throw new TypeError(`invalid Cents: ${value}`);
  }
  return brand<number, "Cents">(value);
}

export function addCents(a: Cents, b: Cents): Cents {
  // `a + b` is a plain `number`: arithmetic strips the brand, because the
  // result of `+` is not one of the operands. Going back through toCents is
  // the price of the brand — and it is also a free overflow check.
  return toCents(a + b);
}

export function formatCents(value: Cents): string {
  // A branded number IS a number, so no unwrapping is needed to divide it.
  return `£${(value / 100).toFixed(2)}`;
}

export type Assignment = {
  readonly userId: UserId;
  readonly orderId: OrderId;
  readonly totalCents: Cents;
};

export function assign(
  userId: UserId,
  orderId: OrderId,
  totalCents: Cents,
): Assignment {
  return { userId, orderId, totalCents };
}

export function describeAssignment(assignment: Assignment): string {
  // Branded strings interpolate directly — `UserId` is a subtype of `string`,
  // so every string operation still works on it.
  return `${assignment.userId} owes ${formatCents(assignment.totalCents)} for ${assignment.orderId}`;
}
