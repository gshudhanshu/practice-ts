/**
 * Solution — 02/06 `unknown`, type guards, exhaustiveness
 */

export type User = {
  id: string;
  name: string;
  email: string;
  age?: number;
};

export type AppEvent =
  | { type: "click"; x: number; y: number }
  | { type: "keypress"; key: string }
  | { type: "scroll"; delta: number };

export function safeJsonParse(raw: string): unknown {
  try {
    // JSON.parse is declared `any`. Returning it from a function annotated
    // `unknown` re-imposes the check at this boundary — one narrow place where
    // `any` is contained instead of leaking through the whole call graph.
    const parsed: unknown = JSON.parse(raw);
    return parsed;
  } catch {
    return undefined;
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    // typeof null === "object" — the oldest bug in JavaScript.
    value !== null &&
    // Arrays are objects too, and are not "records" for our purposes.
    !Array.isArray(value)
  );
}

export function parseUser(input: unknown): User | null {
  if (!isRecord(input)) return null;

  // Every property of a Record<string, unknown> is `unknown`, so each one has
  // to be proven before use. This is the whole value of `unknown` over `any`.
  const { id, name, email, age } = input;

  if (typeof id !== "string") return null;
  if (typeof name !== "string") return null;
  if (typeof email !== "string") return null;

  // Optional: absent is fine, present-but-wrong is not.
  if (age !== undefined && typeof age !== "number") return null;

  // Build with only the known fields — extra input properties are dropped.
  const user: User = { id, name, email };

  // Under exactOptionalPropertyTypes we must not write `age: undefined`.
  // Assigning only when it is genuinely a number keeps the key absent.
  if (typeof age === "number") {
    user.age = age;
  }

  return user;
}

// The parameter type is `never`, so this only compiles when the compiler has
// already proven no cases remain.
export function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}

export function describeEvent(event: AppEvent): string {
  switch (event.type) {
    case "click":
      return `click at (${event.x}, ${event.y})`;
    case "keypress":
      return `key: ${event.key}`;
    case "scroll":
      return `scroll by ${event.delta}`;
    default:
      // `event` has been narrowed to `never` here. Add a fourth member to
      // AppEvent and this line stops compiling — a compile-time TODO list.
      return assertNever(event);
  }
}
