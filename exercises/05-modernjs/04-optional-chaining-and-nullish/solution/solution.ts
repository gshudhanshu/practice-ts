/**
 * Solution — 05/04 Optional chaining & the nullish operators
 */

export type ApiResponse = {
  data?: {
    items?: { id: string; label?: string }[];
  };
  meta?: {
    total?: number;
  };
};

export type Account = {
  username: string;
  nickname?: string;
};

export function firstLabel(response: ApiResponse): string {
  // Four possible failure points, one expression. `?.[0]` is optional INDEXING
  // — and note that `items[0]` is itself possibly undefined under
  // noUncheckedIndexedAccess, so the third `?.` is doing real work too.
  return response.data?.items?.[0]?.label ?? "none";
}

export function totalOf(response: ApiResponse): number {
  // `??` fires only on null/undefined, so a genuine total of 0 survives.
  // `|| 0` would give the same answer here by accident, and the wrong one the
  // moment the default is anything but 0.
  return response.meta?.total ?? 0;
}

export function callSafely(fn?: () => number): number {
  // `fn?.()` calls only when fn is not nullish; otherwise the whole expression
  // is undefined. Note the `?.` goes BEFORE the parentheses.
  return fn?.() ?? -1;
}

export function bumpVisit(visits: { count?: number }): number {
  // `??=` assigns only when the current value is null/undefined, so an existing
  // count of 0 is left alone. It also short-circuits: no assignment happens at
  // all when the value is present.
  visits.count ??= 0;
  visits.count += 1;
  return visits.count;
}

export function displayName(account: Account): string {
  // The requirement is "" means no nickname, so we want FALSINESS, not
  // nullishness — this is the case where `||` is correct and `??` is the bug.
  // Choose the operator from the requirement, not from habit.
  return account.nickname || account.username;
}
