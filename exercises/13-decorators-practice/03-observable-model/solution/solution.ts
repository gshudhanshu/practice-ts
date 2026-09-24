/**
 * Solution — 13/03 Observable model
 */

export type Change = {
  property: string;
  from: unknown;
  to: unknown;
};

export type Listener = (changes: readonly Change[]) => void;

export type AccessorDecorator<Value> = <This extends object>(
  target: ClassAccessorDecoratorTarget<This, Value>,
  context: ClassAccessorDecoratorContext<This, Value>,
) => ClassAccessorDecoratorResult<This, Value>;

type ModelState = {
  listeners: Set<Listener>;
  observed: { property: string; read: () => unknown }[];
  depth: number;
  pending: Change[];
};

const STATE = new WeakMap<object, ModelState>();

export function stateOf(model: object): ModelState {
  const existing = STATE.get(model);
  if (existing !== undefined) return existing;

  const fresh: ModelState = {
    listeners: new Set(),
    observed: [],
    depth: 0,
    pending: [],
  };
  STATE.set(model, fresh);
  return fresh;
}

export function notify(model: object, changes: readonly Change[]): void {
  if (changes.length === 0) return;
  for (const listener of [...stateOf(model).listeners]) {
    listener(changes);
  }
}

export function recordChange(model: object, change: Change): void {
  const state = stateOf(model);
  if (state.depth > 0) {
    state.pending.push(change);
    return;
  }
  notify(model, [change]);
}

export function observable<This extends object, Value>(
  target: ClassAccessorDecoratorTarget<This, Value>,
  context: ClassAccessorDecoratorContext<This, Value>,
): ClassAccessorDecoratorResult<This, Value> {
  const property = String(context.name);

  context.addInitializer(function (this: This) {
    // Declaration order, one entry per instance. The reader closes over
    // `target.get`, so `snapshot` never needs to index the object by name.
    stateOf(this).observed.push({
      property,
      read: () => target.get.call(this),
    });
  });

  return {
    get(this: This): Value {
      return target.get.call(this);
    },

    set(this: This, value: Value): void {
      const from = target.get.call(this);

      // Write FIRST, then read back. A decorator underneath this one (here,
      // `@clamp`) may store something other than what was passed in, and the
      // notification has to describe what the model actually holds.
      target.set.call(this, value);
      const to = target.get.call(this);

      // `Object.is` rather than `===`: it treats NaN as equal to itself (so a
      // NaN write is not a spurious change) and 0 as different from -0.
      if (Object.is(from, to)) return;

      recordChange(this, { property, from, to });
    },
  };
}

export function subscribe(model: object, listener: Listener): () => void {
  const state = stateOf(model);
  state.listeners.add(listener);

  // A Set makes unsubscribing idempotent for free: the second `delete` is a
  // no-op rather than removing someone else's listener.
  return () => {
    state.listeners.delete(listener);
  };
}

export function snapshot(model: object): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const entry of stateOf(model).observed) {
    result[entry.property] = entry.read();
  }
  return result;
}

export function clamp(min: number, max: number): AccessorDecorator<number> {
  const limit = (value: number): number => Math.min(max, Math.max(min, value));

  return function <This extends object>(
    target: ClassAccessorDecoratorTarget<This, number>,
    _context: ClassAccessorDecoratorContext<This, number>,
  ): ClassAccessorDecoratorResult<This, number> {
    return {
      get(this: This): number {
        return target.get.call(this);
      },

      set(this: This, value: number): void {
        target.set.call(this, limit(value));
      },

      // `init` is the accessor decorator's answer to "the field initialiser is
      // not a set". Without it, `accessor volume = 500` would start out of
      // range and only get clamped on the first assignment.
      init(this: This, value: number): number {
        return limit(value);
      },
    };
  };
}

export function batch<T>(model: object, fn: () => T): T {
  const state = stateOf(model);
  state.depth += 1;

  try {
    return fn();
  } finally {
    state.depth -= 1;

    // Only the OUTERMOST batch flushes; an inner one just returns to a still
    // -open outer batch.
    if (state.depth === 0) {
      const pending = state.pending;
      // Take the queue before notifying: a listener may write to the model
      // again, and those writes belong to the next notification, not this one.
      state.pending = [];

      const merged = new Map<string, Change>();
      for (const change of pending) {
        const seen = merged.get(change.property);
        if (seen === undefined) {
          // Map preserves insertion order, which gives us "in the order that
          // property first changed" with no extra bookkeeping.
          merged.set(change.property, { ...change });
        } else {
          // Keep the earliest `from` and the latest `to`.
          seen.to = change.to;
        }
      }

      // A property that ended where it started never really changed.
      const changes = [...merged.values()].filter(
        (change) => !Object.is(change.from, change.to),
      );

      notify(model, changes);
    }
  }
}

export class Settings {
  @observable
  accessor theme = "light";

  @observable
  accessor fontSize = 14;

  @observable
  @clamp(0, 100)
  accessor volume = 50;

  accessor sessionId = "s-1";

  createdAt = "2026-01-01";
}

export class ImportedSettings {
  @observable
  @clamp(0, 100)
  accessor volume = 500;
}
