/**
 * Solution — 08/05 A typed event emitter
 */

export type Listener<T> = (payload: T) => void;
export type Unsubscribe = () => void;

/**
 * The internal store is heterogeneous by nature: one map holds listeners for
 * events with DIFFERENT payload types, so no single element type describes it.
 *
 * `Listener<never>` is the one that accepts them all on the way IN (parameters
 * are contravariant, and `never` is assignable to every type). It cannot be
 * CALLED, which is why `emit` needs the single documented cast below.
 */
type StoredListener = Listener<never>;

export class EventEmitter<TEvents extends Record<string, unknown>> {
  // A Set per event name: de-duplicates registrations, keeps insertion order,
  // and makes `off` an O(1) delete.
  #listeners = new Map<keyof TEvents, Set<StoredListener>>();

  on<K extends keyof TEvents>(
    event: K,
    listener: Listener<TEvents[K]>,
  ): Unsubscribe {
    const existing = this.#listeners.get(event);

    if (existing === undefined) {
      this.#listeners.set(event, new Set([listener]));
    } else {
      existing.add(listener);
    }

    // Returning the teardown is what lets callers clean up without holding on
    // to both the event name and the function reference.
    return () => {
      this.off(event, listener);
    };
  }

  off<K extends keyof TEvents>(event: K, listener: Listener<TEvents[K]>): void {
    const set = this.#listeners.get(event);
    if (set === undefined) return;

    set.delete(listener);

    // Drop the empty Set so listenerCount and memory stay honest.
    if (set.size === 0) this.#listeners.delete(event);
  }

  emit<K extends keyof TEvents>(event: K, payload: TEvents[K]): void {
    const set = this.#listeners.get(event);
    if (set === undefined) return;

    // Iterate a COPY. A listener may remove itself (that is exactly what
    // `once` does), and mutating a Set while iterating it is a classic bug.
    for (const listener of [...set]) {
      // The one permitted cast. It is sound because `on` only ever stores a
      // Listener<TEvents[K]> under the key K — the unsafety is contained to
      // this line, behind a fully typed public API.
      const typed = listener as Listener<TEvents[K]>;
      typed(payload);
    }
  }

  once<K extends keyof TEvents>(
    event: K,
    listener: Listener<TEvents[K]>,
  ): Unsubscribe {
    // The wrapper removes itself FIRST, so a listener that re-emits the same
    // event cannot re-enter it.
    const wrapper: Listener<TEvents[K]> = (payload) => {
      this.off(event, wrapper);
      listener(payload);
    };

    // Reuse `on`, so registration and teardown live in one place.
    return this.on(event, wrapper);
  }

  listenerCount<K extends keyof TEvents>(event: K): number {
    return this.#listeners.get(event)?.size ?? 0;
  }
}
