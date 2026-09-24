# 12/01 — Legacy method decorators

**Tier:** Core · **Time:** ~25 min · **Course section:** 12 — Experimental decorators

---

## Why this exercise exists

This is the decorator implementation TypeScript shipped in 2015, years before
TC39 settled on a design. It is enabled per project by

```json
{ "compilerOptions": { "experimentalDecorators": true } }
```

which is already in this exercise's own `tsconfig.json` — the verifier honours
it, and section 11 deliberately does not have it.

It is worth learning for one blunt reason: **Angular, NestJS, TypeORM and
class-validator all still require it**, and you cannot mix the two flavours in
one compilation. The other reason is that the two designs make a good contrast —
the legacy one hands you a `PropertyDescriptor`, which is both more powerful
(you can change flags, not just the value) and messier (you have to know that
`target` is sometimes a prototype and sometimes a constructor).

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `@logged` records `{ method, args }` by mutating `descriptor.value`. |
| 2 | `@readonlyMethod` sets `writable: false`; reassignment then throws. |
| 3 | `@defaultOnError(-1)` — a factory returning the fallback when the method throws. |
| 4 | `@describeTarget` records whether `target` is the constructor or the prototype. |
| 5 | `@visible` **returns** a new descriptor with `enumerable: true`. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.
- Keep `experimentalDecorators` in this exercise's `tsconfig.json`. Removing it
  breaks every decorator here; adding it to section 11 breaks that one.

## Done when

```bash
npm run check 12/01
```

<details>
<summary>Hint 1 — the three arguments</summary>

```ts
function dec(
  target: object,          // prototype for an instance member,
                           // constructor for a static one
  propertyKey: string,     // the member's name
  descriptor: PropertyDescriptor,
): void | PropertyDescriptor
```

Return nothing and your mutations to `descriptor` are used. Return a descriptor
and it replaces the original entirely.
</details>

<details>
<summary>Hint 2 — wrapping, typed</summary>

```ts
const original = descriptor.value;
if (original === undefined) return;

descriptor.value = function (this: unknown, ...args: Args): Return {
  log.push({ method: propertyKey, args });
  return original.call(this, ...args);
};
```

`TypedPropertyDescriptor<T>` is the built-in typed form; its `value` is
`T | undefined` because a descriptor might describe an accessor instead. Narrow
rather than reaching for `!`.

`original.call(this, ...args)` — with `strictBindCallApply` (on, via `strict`)
`call` is fully typed, so this stays `Return` rather than degrading to `any`.
`.apply` would not.
</details>

<details>
<summary>Hint 3 — TODO 2 needs no wrapper</summary>

A descriptor is `{ value, writable, enumerable, configurable }`. You only need
one line. This is something the standard flavour genuinely cannot do — it never
exposes the descriptor.

Reassignment throws rather than silently failing because ES modules are always
strict mode.
</details>

<details>
<summary>Hint 4 — TODO 4 is the legacy quirk</summary>

For `instanceMethod`, `target` is `Probe.prototype`. For `staticMethod`, it is
`Probe` itself. There is no `isStatic` flag to read, so you have to infer it:
a constructor is a function, a prototype object is not.

Section 11 replaces the whole guessing game with `context.static`.
</details>

<details>
<summary>Hint 5 — TODO 5 replaces, it does not merge</summary>

The descriptor you return replaces the original wholesale. Return
`{ enumerable: true }` on its own and you have just deleted the method. Spread
the original first.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
what the emitted `__decorate` helper actually does, why mutating the descriptor
is not monkey-patching, and the exact list of what legacy can do that standard
cannot.
