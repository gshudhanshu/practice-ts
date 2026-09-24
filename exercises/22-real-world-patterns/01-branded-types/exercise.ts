/**
 * Exercise 22/01 — branded types
 *
 * TypeScript's type system is STRUCTURAL: two types are compatible when their
 * shapes match, regardless of what they are called. Usually that is a feature.
 * Here it is a bug factory:
 *
 *   type UserId = string;
 *   type OrderId = string;
 *
 *   function refund(userId: UserId, orderId: OrderId): void {}
 *   refund(orderId, userId);   // ✔ compiles. Both are just `string`.
 *
 * Those aliases document intent and enforce nothing. Java and C# would have
 * caught this — their type systems are NOMINAL, where a name is part of the
 * type. TypeScript has no nominal types, so we fake them by attaching a
 * property that exists only in the type system:
 *
 *   type UserId = string & { readonly __brand: "UserId" };
 *
 * No `string` has a `__brand` property, so no raw string is assignable to
 * `UserId`, and `UserId` and `OrderId` no longer mix. At runtime it is still
 * a plain string — the brand is erased with every other type.
 *
 * The cost: no value can be branded without a cast, so every brand needs a
 * SMART CONSTRUCTOR — one function, which validates, that owns the cast.
 * This file is allowed exactly one `as`, inside `brand()`. See the README.
 *
 * Read README.md first. Replace every TODO.
 */

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// The brand machinery.
//
//   Brand<T, B>   T & { readonly __brand: B }
//   UserId        a branded string
//   OrderId       a branded string
//   Cents         a branded number — integers, never negative
//
//   brand(value)  the one place in this file allowed to cast. It is NOT
//                 exported: a caller who could reach it could brand anything,
//                 which would defeat the validation in TODOs 2–4.
export type Brand<T, B extends string> = T;

export type UserId = string;
export type OrderId = string;
export type Cents = number;

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// The first smart constructor. Throwing on bad input.
//
//   toUserId("usr_ada")  ->  "usr_ada" as a UserId
//   toUserId("ada")      ->  TypeError('invalid UserId: ada')
//
// Valid means `usr_` followed by one or more lowercase letters or digits, and
// nothing else — no leading space, no upper case, no empty suffix.
export function toUserId(raw: string): UserId {
  throw new Error("TODO 2: implement toUserId");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// The same idea twice more, showing the two OTHER shapes a constructor takes.
//
//   isOrderId(value)   a type PREDICATE: `value is OrderId`. Note that this
//                      narrows a plain `string` to `OrderId` with no cast at
//                      all — a predicate is the cast, checked.
//   toOrderId(raw)     returns `OrderId | null` instead of throwing, so the
//                      caller decides. Write it using the predicate.
//
// Valid means `ord_` followed by one or more digits.
export function isOrderId(value: string): boolean {
  throw new Error("TODO 3: implement isOrderId");
}

export function toOrderId(raw: string): OrderId | null {
  throw new Error("TODO 3: implement toOrderId");
}

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Branding a number, and the cost that comes with it.
//
//   toCents(8999)   ->  8999 as Cents
//   toCents(-1)     ->  TypeError('invalid Cents: -1')
//   toCents(1.5)    ->  TypeError('invalid Cents: 1.5')
//
//   addCents(a, b)  Cents + Cents is a plain `number` — arithmetic strips the
//                   brand. Re-brand the result through toCents, which is not a
//                   nuisance: it is the overflow check you would have skipped.
//
//   formatCents(8999) -> "£89.99"   (always two decimal places)
export function toCents(value: number): Cents {
  throw new Error("TODO 4: implement toCents");
}

export function addCents(a: Cents, b: Cents): Cents {
  throw new Error("TODO 4: implement addCents");
}

export function formatCents(value: Cents): string {
  throw new Error("TODO 4: implement formatCents");
}

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// The payoff. A record whose three fields can no longer be shuffled:
//
//   Assignment  { userId, orderId, totalCents }, all readonly
//   assign      builds one
//   describe    "usr_ada owes £89.99 for ord_42"
//
// A branded string IS a string, so it interpolates into a template literal
// with no unwrapping. That is the other half of why branding is cheap.
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
  throw new Error("TODO 5: implement assign");
}

export function describeAssignment(assignment: Assignment): string {
  throw new Error("TODO 5: implement describeAssignment");
}
