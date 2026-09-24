# 03/03 — `exactOptionalPropertyTypes`

## The distinction the flag restores

| | `{}` | `{ x: undefined }` |
|---|---|---|
| `"x" in obj` | `false` | **`true`** |
| `Object.keys(obj)` | `[]` | **`["x"]`** |
| `obj.x` | `undefined` | `undefined` |
| `JSON.stringify` | `{}` | `{}` |
| spread onto a default | keeps the default | **overwrites it with undefined** |

The last row is where the bugs live. Without this flag, TypeScript types both as
`{ x?: number }` and cannot warn you.

With the flag:

```ts
type Settings = { autoSave?: boolean };

const a: Settings = {};                     // OK
const b: Settings = { autoSave: true };     // OK
const c: Settings = { autoSave: undefined }; // Error under the flag
```

To opt back in — which is often correct at a boundary — say so explicitly:

```ts
autoSave?: boolean | undefined;
```

That is exactly why `SettingsPatch` is written the way it is. Internal domain
types stay exact; the boundary type that models "a form the user half filled in"
admits `undefined` deliberately.

## Why the spread one-liner is wrong

```ts
return { ...base, ...patch };   // looks right, is not
```

Object spread copies every **own enumerable key**, including keys holding
`undefined`. So:

```ts
{ ...{ fontSize: 12 }, ...{ fontSize: undefined } }   // { fontSize: undefined }
```

The default is destroyed. This is the single most common way a config-merge
function goes wrong, and it is completely invisible without the flag — with it,
the compiler rejects the result outright, because `Settings` cannot hold an
explicit `undefined`.

The explicit-assignment version is more code, and correct:

```ts
const merged: Settings = { ...base };
if (patch.fontSize !== undefined) merged.fontSize = patch.fontSize;
```

> If you want the terse version in real code, filter first:
> `Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined))`
> — though typing that generically needs the tools from section 10.

## `delete` vs rest destructuring

```ts
const { language: _removed, ...rest } = settings;   // new object, key absent
delete copy.language;                               // mutates, deoptimises
```

Rest destructuring is the idiomatic choice: no mutation, and it produces
`Omit<Settings, "language">`, which is assignable to `Settings` precisely
because `language` was optional.

Note that `delete` only compiles on an optional or `| undefined` property —
another small way the type system models presence.

## `in` vs `!== undefined` vs truthiness

```ts
key in settings              // is the key present?          <- what we want
settings[key] !== undefined  // present AND not undefined
!!settings[key]              // present AND truthy           <- wrong
```

`autoSave: false` and `language: ""` are configured values. The truthiness check
reports them as unconfigured, which is the bug the test pins down.

Under this flag the middle option happens to agree with `in` for `Settings`,
because an exact optional property can never *hold* `undefined`. That equivalence
disappears the moment a type opts into `| undefined` — like `SettingsPatch`.

## The honest downside

This flag has real friction, and it is worth being able to name it:

- **React props.** `<Component value={maybeUndefined} />` fails when the prop is
  declared `value?: string`, because JSX passes the key explicitly. The fix is
  `value?: string | undefined` on the props type — which many teams end up
  applying everywhere, at which point the flag buys little.
- **`Partial<T>`.** `Partial<Settings>` produces exact-optional properties, so
  `{ fontSize: undefined }` does not satisfy it. Patch/DTO types usually need to
  be written by hand or with an explicit `| undefined` mapped type.
- **Third-party types** written without the flag in mind can be awkward to
  satisfy.

Reasonable position: enable it in application/domain code where the
absent-vs-undefined distinction is meaningful; be pragmatic at UI and API
boundaries by adding `| undefined` there.

## Common mistakes

| Mistake | What happens |
|---|---|
| `SettingsPatch = Partial<Settings>` | Explicit `undefined` no longer assignable; the patch tests fail to compile |
| `{ ...base, ...patch }` | Compile error, and would erase defaults at runtime |
| `merged.autoSave = patch.autoSave` unguarded | Compile error — cannot assign `boolean \| undefined` to an exact optional |
| `delete settings.language` on the argument | Mutates the caller's object |
| `!!settings[key]` in `isConfigured` | `autoSave: false` wrongly reports unconfigured |

## Interview angle

> *"What is the difference between `{ a?: string }` and `{ a: string | undefined }`?"*

The first may be **omitted**; the second must be **present**, possibly holding
`undefined`. Under `exactOptionalPropertyTypes` there is a third, distinct
shape — `{ a?: string | undefined }` — which allows both. Being able to lay out
all three cleanly is a strong signal, because most people only know two.

> *"Have you ever been bitten by object spread?"*

The config-merge bug above is the perfect answer: real, common, and it shows you
understand that TypeScript's defaults model JavaScript loosely in a couple of
places, and which flags tighten them.
