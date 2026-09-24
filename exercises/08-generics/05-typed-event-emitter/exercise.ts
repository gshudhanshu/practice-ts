/**
 * Exercise 08/05 — CHALLENGE: a typed event emitter
 *
 * The classic generics interview question. One class, parameterised by a map
 * of event name -> payload type, where:
 *
 *   - an unknown event name is a compile error
 *   - the listener's payload type follows the event name
 *   - emitting the wrong payload is a compile error
 *
 * `K extends keyof TEvents` plus `TEvents[K]` (08/02) does all the work.
 *
 * NOTE: this is the one exercise where a single `as` is allowed — see the
 * README. The public API is fully typed; only the internal store needs it.
 *
 * Read README.md first. Replace every TODO.
 */

/** A listener for a payload of type T. */
export type Listener<T> = (payload: T) => void;

/** Removes the listener it came from. */
export type Unsubscribe = () => void;

export class EventEmitter<TEvents extends Record<string, unknown>> {
  // ─── TODO 1 ────────────────────────────────────────────────────────────────
  // Choose the internal storage: one set of listeners per event name.
  // Iterating a Set makes `off` cheap and prevents duplicate registrations.

  // ─── TODO 2 ────────────────────────────────────────────────────────────────
  // Register a listener. The callback's payload type must follow `event`:
  //   emitter.on("login", (payload) => payload.userId)   // payload is typed
  //
  // Returns a function that removes this listener again.
  on<K extends keyof TEvents>(
    event: K,
    listener: Listener<TEvents[K]>,
  ): Unsubscribe {
    throw new Error("TODO 2: implement on");
  }

  // ─── TODO 3 ────────────────────────────────────────────────────────────────
  // Remove a specific listener. Removing one that was never added is a no-op.
  off<K extends keyof TEvents>(event: K, listener: Listener<TEvents[K]>): void {
    throw new Error("TODO 3: implement off");
  }

  // ─── TODO 4 ────────────────────────────────────────────────────────────────
  // Call every listener for `event`, in registration order.
  //
  // A listener must be able to call `off` (or its unsubscribe) DURING the emit
  // without disturbing the loop — which is what makes TODO 5 work.
  emit<K extends keyof TEvents>(event: K, payload: TEvents[K]): void {
    throw new Error("TODO 4: implement emit");
  }

  // ─── TODO 5 ────────────────────────────────────────────────────────────────
  // Register a listener that fires AT MOST ONCE, then removes itself.
  // Also returns an unsubscribe, so it can be cancelled before it ever fires.
  once<K extends keyof TEvents>(
    event: K,
    listener: Listener<TEvents[K]>,
  ): Unsubscribe {
    throw new Error("TODO 5: implement once");
  }

  /** How many listeners are registered for this event. */
  listenerCount<K extends keyof TEvents>(event: K): number {
    throw new Error("TODO 5: implement listenerCount");
  }
}
