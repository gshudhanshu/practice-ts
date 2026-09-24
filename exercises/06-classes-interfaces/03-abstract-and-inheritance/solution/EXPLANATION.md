# 06/03 — Abstract classes & inheritance

## What `abstract` gives you

An abstract class combines two things a plain interface cannot:

```ts
abstract class Employee {
  abstract get role(): string;          // CONTRACT — subclass must supply
  abstract monthlyPayCents(): number;   // CONTRACT

  describe(): string {                  // SHARED BEHAVIOUR — inherited
    const amount = (this.monthlyPayCents() / 100).toFixed(2);
    return `${this.name} (${this.role}): ${amount}`;
  }
}
```

`describe()` calls members that do not exist yet. The base class owns the
*shape* of the result; subclasses fill in the parts that vary. That is the
**template-method** pattern, and it is the main reason to reach for an abstract
class over an interface.

You also get: no direct instantiation (`new Employee(…)` is a compile error),
shared constructor logic, and shared fields.

## Abstract class vs interface

| | `abstract class` | `interface` |
|---|---|---|
| Implementation bodies | yes | no |
| Fields with initialisers | yes | no |
| Constructor | yes | no |
| How many can you inherit | **one** | many |
| Exists at runtime | yes | **no** — fully erased |
| `instanceof` works | yes | no |

**Choose an abstract class** when subclasses share real implementation, or when
construction needs enforcing.

**Choose an interface** when you only need a shape, when a type must satisfy
several contracts at once, or when implementers are types you do not own (plain
objects, third-party classes).

The deciding question is usually: *do I have code to share, or only a shape to
describe?* 06/04 and 06/05 take the interface side of this.

## `protected` vs `private`

```ts
protected readonly baseCents: number;
```

| | Own class | Subclasses | Outside |
|---|---|---|---|
| `public` | yes | yes | yes |
| `protected` | yes | **yes** | no |
| `private` | yes | no | no |

`baseCents` has to be `protected`: `private` would make it invisible in
`Salaried.monthlyPayCents()`, and `public` would expose an implementation
detail whose *meaning changes per subclass* (annual salary, hourly rate, or
monthly retainer).

That varying meaning is, incidentally, a design smell worth noticing — see the
composition note below.

## `super` and constructor order

```ts
constructor(name: string, rate: number, private readonly hoursPerMonth: number) {
  super(name, rate);
}
```

`super()` must run before you touch `this` — the base class has not initialised
its fields yet, and the language enforces it. Parameter properties in the
subclass are assigned immediately *after* the `super()` call, which is why they
compose cleanly.

`super.describe()` calls the parent's implementation. Extending rather than
copying means a change to the base format flows through automatically.

## `override` and `noImplicitOverride`

With the flag on (as in this repo):

```ts
override describe(): string { … }   // REQUIRED — replaces a concrete member
get role(): string { … }            // not required — implements an abstract member
```

The distinction is real: implementing an abstract member is *fulfilling a
contract*, not replacing an implementation, so there is nothing to accidentally
detach from. (Writing `override` on an abstract implementation is still
*permitted* — it is simply not demanded, since the compiler already guarantees
the member exists in the base.)

What the flag actually prevents: someone renames `describe` to `format` in the
base class, and `Contractor.describe` silently becomes a brand-new method that
nothing calls. The bug is invisible — the code compiles, the tests that call
`describe()` on a `Contractor` still pass, and the shared formatting is quietly
dead. With `override` present, that rename is a compile error at every subclass.

## When NOT to use inheritance

This hierarchy is a reasonable teaching example, but notice the strain:
`baseCents` means something different in each subclass. In real code that is a
signal to prefer **composition**:

```ts
type PayStrategy = { role: string; monthlyPayCents: () => number };

function salaried(annualCents: number): PayStrategy { … }
function hourly(rateCents: number, hours: number): PayStrategy { … }
```

Composition avoids the single-inheritance limit, makes each strategy testable in
isolation, and does not force unrelated things to share a base. "Favour
composition over inheritance" is a cliché precisely because deep hierarchies age
badly — one or two levels is usually the sensible ceiling.

Knowing both, and being able to say *why* you picked one, is the actual skill.

## Common mistakes

| Mistake | What happens |
|---|---|
| Forgetting `abstract` on the class | `new Employee(…)` compiles; the assertion fails |
| `private baseCents` | Subclasses cannot read it |
| Missing `override` on `Contractor.describe` | Compile error under `noImplicitOverride` |
| Re-writing the format in `Contractor.describe` | Passes today, drifts tomorrow |
| Touching `this` before `super()` | Compile error, and a runtime `ReferenceError` in plain JS |
| `this.baseCents / 12` without rounding | Fractional cents; the rounding test fails |

## Interview angle

> *"Abstract class or interface?"*

Lead with the deciding question — shared implementation, or just a shape? Then
the concrete differences: one abstract base versus many interfaces, runtime
presence versus full erasure. Mentioning that interfaces are erased (so no
`instanceof`) is the detail that shows you have hit it in practice.

> *"What does the `override` keyword do?"*

Nothing at runtime — it is a compile-time assertion that a member you *believe*
overrides something actually does. Then give the failure it prevents: renaming a
base method turning every subclass override into silently dead code. That
concrete scenario is much stronger than the definition.
