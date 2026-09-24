/**
 * Solution — 07/05 Assertion functions
 */

export type Order = {
  id: string;
  totalCents: number;
  items: readonly string[];
};

// `asserts value is T` — the narrowing survives past the call, because the only
// way to reach the next line is for the claim to be true.
export function assertIsRecord(
  value: unknown,
): asserts value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TypeError("expected an object");
  }
}

export function assertIsString(
  value: unknown,
  label: string,
): asserts value is string {
  if (typeof value !== "string") {
    throw new TypeError(`${label} must be a string`);
  }
}

export function assertIsOrder(value: unknown): asserts value is Order {
  // Each assertion narrows `value` for everything below it — a flat sequence
  // rather than a pyramid of nested `if`s.
  assertIsRecord(value);

  const { id, totalCents, items } = value;

  assertIsString(id, "id");

  // `Number.isInteger` takes `unknown` and returns a plain boolean — it does
  // NOT narrow. The `typeof` check first is what makes `< 0` legal, because
  // `||` narrows left to right.
  if (
    typeof totalCents !== "number" ||
    !Number.isInteger(totalCents) ||
    totalCents < 0
  ) {
    throw new TypeError("totalCents must be a non-negative integer");
  }

  if (
    !Array.isArray(items) ||
    !items.every((item): item is string => typeof item === "string")
  ) {
    throw new TypeError("items must be an array of strings");
  }
}

export function parseOrder(raw: string): Order {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Re-throw with a stable message; the native SyntaxError text varies
    // between engines and versions, which makes it untestable.
    throw new TypeError("malformed JSON");
  }

  // No cast: the assertion is what turns `unknown` into `Order`.
  assertIsOrder(parsed);
  return parsed;
}

export function describeOrder(raw: string): string {
  try {
    const order = parseOrder(raw);
    const noun = order.items.length === 1 ? "item" : "items";
    const amount = (order.totalCents / 100).toFixed(2);
    return `Order ${order.id}: ${order.items.length} ${noun}, ${amount}`;
  } catch (error) {
    // `useUnknownInCatchVariables` (part of `strict`) makes this `unknown`,
    // so it must be narrowed before `.message` can be read.
    const message = error instanceof Error ? error.message : String(error);
    return `invalid order: ${message}`;
  }
}
