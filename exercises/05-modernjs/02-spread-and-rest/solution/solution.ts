/**
 * Solution — 05/02 Spread & rest
 */

export type User = {
  name: string;
  email: string;
  tags: readonly string[];
};

export type State = {
  user: {
    name: string;
    address: {
      city: string;
      country: string;
    };
  };
  version: number;
};

export function sum(...values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

export function mergeUnique(...lists: (readonly string[])[]): string[] {
  // A Set preserves insertion order and dedupes in one step.
  // `lists.flat()` flattens one level; spreading the Set back out gives an
  // ordinary array.
  return [...new Set(lists.flat())];
}

export function withName(user: User, name: string): User {
  // Spread first, then override. Order matters: later keys win, so putting
  // `name` after the spread is what makes the override take effect.
  return { ...user, name };
}

export function maxOf(values: readonly number[]): number | undefined {
  // Math.max() with no arguments returns -Infinity, which would be a very
  // confusing "maximum" for an empty list. Guard first.
  if (values.length === 0) return undefined;
  return Math.max(...values);
}

export function updateCity(state: State, city: string): State {
  // Spread is SHALLOW: `{ ...state }` copies the top level but keeps the SAME
  // reference for `state.user`. Mutating that would corrupt the original.
  // So every object on the path to the change gets its own spread.
  return {
    ...state,
    user: {
      ...state.user,
      address: {
        ...state.user.address,
        city,
      },
    },
    version: state.version + 1,
  };
}
