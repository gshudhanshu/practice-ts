/**
 * Exercise 18/02 — Discriminated union props
 *
 * The most valuable thing TypeScript does for a component is refuse to compile
 * a prop combination that the component cannot handle.
 *
 *   <Action variant="link" onClick={…} />       // a link has no onClick
 *   <AsyncButton loadingLabel="Saving…" />      // a label for a state you never enter
 *   <Toggle checked={x} />                      // controlled, but no way to change it
 *
 * Each of those is a bug that a single `Props` object type with everything
 * optional would happily accept. A union makes them unrepresentable.
 *
 * You already know discriminated unions (02/04) and `assertNever` (02/06). This
 * exercise is about APPLYING them to props, where the three recurring shapes
 * are: a tagged variant, an all-or-nothing pair, and controlled-vs-uncontrolled.
 *
 * Read README.md first. Replace every TODO.
 */

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// The props of an <Action> — one component, three mutually exclusive modes.
// Every mode has a `label: string`, and the discriminant is `variant`:
//
//   variant: "link"    -> also requires `href: string`
//   variant: "button"  -> also requires `onClick: () => void`
//   variant: "submit"  -> also requires `formId: string`
//
// A link must not carry an `onClick`, a button must not carry an `href`, and so
// on: the wrong combination has to be a compile error, not a runtime surprise.
export type ActionProps = unknown;

/**
 * Given: the exhaustiveness guard from 02/06. Passing it anything other than
 * `never` is a compile error, which is what turns "a new variant was added and
 * somebody forgot to handle it" into a build failure.
 */
export function assertNever(value: never, message: string): never {
  throw new Error(`${message}: ${JSON.stringify(value)}`);
}

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// Describe an action, for a telemetry log. Switch on the discriminant and let
// narrowing hand you the right extra prop in each branch:
//
//   { variant: "link",   href: "/docs",  label: "Docs" }   -> "link → /docs"
//   { variant: "button", onClick: fn,    label: "Save" }   -> "button → Save"
//   { variant: "submit", formId: "cart", label: "Pay"  }   -> "submit → #cart"
//
// The `default` branch must call `assertNever`, so that adding a fourth variant
// to TODO 1 breaks the build here.
export function describeAction(props: ActionProps): string {
  throw new Error("TODO 2: implement describeAction");
}

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// The props of an <AsyncButton>. `loadingLabel` only means anything while the
// button is loading, so the two props must travel together:
//
//   {}                                          // ok — not loading
//   { loading: false }                          // ok
//   { loading: true, loadingLabel: "Saving…" }  // ok
//   { loading: true }                           // compile error — label missing
//   { loadingLabel: "Saving…" }                 // compile error — never shown
//   { loading: false, loadingLabel: "Saving…" } // compile error — never shown
//
// There is no `variant` here to discriminate on; the boolean literal `true` IS
// the discriminant. The other member needs a way to say "this key must not be
// here" — an optional property whose type is `never` does exactly that.
export type AsyncButtonProps = unknown;

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// The props of a <Toggle>, which is either CONTROLLED or UNCONTROLLED — the
// oldest API-design fork in React:
//
//   controlled:   { checked: boolean; onChange: (next: boolean) => void }
//                 the parent owns the value, so `onChange` is REQUIRED
//                 (a controlled input with no onChange can never change)
//
//   uncontrolled: { defaultChecked?: boolean; onChange?: (next: boolean) => void }
//                 the component owns the value; `checked` must be ABSENT
//
// The discriminant is the presence of `checked`. Give the uncontrolled member a
// `checked?: undefined` so that `props.checked !== undefined` narrows, and make
// `defaultChecked` illegal on the controlled member.
//
// Both optional props are written the spreadable way (`| undefined`), as in
// 18/01 — these are the props of a real component, and they get spread.
export type ToggleProps = unknown;

/** Given: what the component needs to know on every render. */
export type ToggleState = {
  /** The value to actually render. */
  checked: boolean;
  /** Whether the parent owns the value. */
  controlled: boolean;
};

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// The pure core of the Toggle. `internal` is the value the component is holding
// in its own state; it is only used when the component is uncontrolled.
//
//   resolveToggle({ checked: true, onChange: fn }, false)  -> { checked: true,  controlled: true  }
//   resolveToggle({ checked: false, onChange: fn }, true)  -> { checked: false, controlled: true  }
//   resolveToggle({ defaultChecked: true }, false)         -> { checked: false, controlled: false }
//   resolveToggle({}, true)                                -> { checked: true,  controlled: false }
//
// Look at line 2: `checked: false` is a real, controlled value. Any check that
// treats it as "not provided" is wrong.
export function resolveToggle(
  props: ToggleProps,
  internal: boolean,
): ToggleState {
  throw new Error("TODO 5: implement resolveToggle");
}
