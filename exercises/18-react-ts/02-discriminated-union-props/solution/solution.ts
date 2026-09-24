/**
 * Solution — 18/02 Discriminated union props
 */

// One component, three modes, one tag. Each member carries exactly the extra
// props its mode needs — which is what makes `variant="link" onClick={…}` a
// compile error rather than a dead prop.
export type ActionProps =
  | { variant: "link"; href: string; label: string }
  | { variant: "button"; onClick: () => void; label: string }
  | { variant: "submit"; formId: string; label: string };

export function assertNever(value: never, message: string): never {
  throw new Error(`${message}: ${JSON.stringify(value)}`);
}

export function describeAction(props: ActionProps): string {
  switch (props.variant) {
    case "link":
      // Narrowed to the link member, so `href` exists and `onClick` does not.
      return `link → ${props.href}`;
    case "button":
      return `button → ${props.label}`;
    case "submit":
      return `submit → #${props.formId}`;
    default:
      // `props` is `never` here only while every variant is handled. Add a
      // fourth member to ActionProps and this line stops compiling — which is
      // the entire point of the guard.
      return assertNever(props, "unhandled action variant");
  }
}

// No `variant` to switch on: the boolean LITERAL `true` is the discriminant.
// `loadingLabel?: never` on the other member is the "this key must not be here"
// idiom — an optional property that no value can satisfy, so writing it is an
// error while leaving it out is fine.
export type AsyncButtonProps =
  | { loading: true; loadingLabel: string }
  | { loading?: false; loadingLabel?: never };

// The discriminant is the PRESENCE of `checked`. Spelling the absent case as
// `checked?: undefined` (rather than omitting the key) is what lets
// `props.checked !== undefined` narrow the union: `undefined` is a unit type,
// so it discriminates just like a string literal would.
//
// `onChange` is required on the controlled member — a controlled input with no
// way to report a change is a read-only input that looks interactive.
export type ToggleProps =
  | {
      checked: boolean;
      onChange: (next: boolean) => void;
      defaultChecked?: never;
    }
  | {
      checked?: undefined;
      defaultChecked?: boolean | undefined;
      onChange?: ((next: boolean) => void) | undefined;
    };

export type ToggleState = {
  checked: boolean;
  controlled: boolean;
};

export function resolveToggle(
  props: ToggleProps,
  internal: boolean,
): ToggleState {
  // `!== undefined`, never truthiness and never `??` on the value: `checked`
  // is a boolean, so `false` is a perfectly good controlled value and
  // `props.checked ?? internal` would be right by luck while
  // `props.checked || internal` would be wrong.
  if (props.checked !== undefined) {
    return { checked: props.checked, controlled: true };
  }

  // Uncontrolled: `defaultChecked` seeded the state once, at mount. After that
  // the component's own state is the truth, so it is `internal` that is read
  // here — reading `defaultChecked` on every render is the classic bug that
  // makes an uncontrolled input snap back.
  return { checked: internal, controlled: false };
}
