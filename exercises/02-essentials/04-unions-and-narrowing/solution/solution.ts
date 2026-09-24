/**
 * Solution — 02/04 Union types & narrowing
 */

export function formatValue(value: string | number | boolean): string {
  // Each `typeof` check narrows the union for the rest of that branch.
  // Returning early keeps the remaining type smaller in the code below.
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? "(empty)" : trimmed;
  }

  if (typeof value === "number") {
    return value.toFixed(2);
  }

  // Nothing left but boolean — the compiler knows, so no final `typeof` needed.
  return value ? "yes" : "no";
}

// A discriminated (a.k.a. tagged) union: every member shares a property whose
// type is a distinct *literal*. That literal is what makes narrowing work.
export type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rectangle"; width: number; height: number }
  | { kind: "triangle"; base: number; height: number };

export function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      // `shape` is the circle member here — `radius` needs no cast.
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      return shape.width * shape.height;
    case "triangle":
      return 0.5 * shape.base * shape.height;
  }
}

export function withDefault(
  value: string | number | null | undefined,
  fallback: string | number,
): string | number {
  // `??` triggers on null and undefined ONLY.
  // `||` would also trigger on 0, "", NaN and false — a bug factory.
  return value ?? fallback;
}

export type EmailContact = { email: string };
export type PhoneContact = { phone: string };

export function contactLabel(contact: EmailContact | PhoneContact): string {
  // No shared discriminant, so `in` does the narrowing: inside this branch
  // `contact` is EmailContact.
  if ("email" in contact) {
    return `email: ${contact.email}`;
  }
  return `phone: ${contact.phone}`;
}
