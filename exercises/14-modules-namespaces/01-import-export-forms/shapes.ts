/**
 * A module with NAMED exports only — the default form, and the one that plays
 * best with tooling: renaming is explicit, and tree-shaking can see the names.
 */

export type Circle = {
  kind: "circle";
  radius: number;
};

export type Rect = {
  kind: "rect";
  width: number;
  height: number;
};

export type Shape = Circle | Rect;

export function area(shape: Shape): number {
  return shape.kind === "circle"
    ? Math.PI * shape.radius ** 2
    : shape.width * shape.height;
}

export function perimeter(shape: Shape): number {
  return shape.kind === "circle"
    ? 2 * Math.PI * shape.radius
    : 2 * (shape.width + shape.height);
}
