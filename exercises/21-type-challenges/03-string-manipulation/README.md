# 21/03 — String manipulation

**Tier:** Core → Challenge · **Time:** ~35 min · **Section:** 21 — Type challenges

---

## Why this exercise exists

[10/05](../../10-deriving-types/05-template-literal-types/) showed how to build
and match template literal types. This one makes you write the string library:
`trim`, `split`, `join`, `replace`, `kebab-case` — character by character,
recursively, at compile time.

The shape is always the same, and it is worth naming because everything after
this exercise reuses it:

```
match the head → do something with it → recurse on the tail → stop at a base case
```

That is a fold over a list, written in types. Once it is automatic, the parser
in 21/06 is just a longer version of the same thing.

## Your task

Open `exercise.ts` and resolve all five TODOs.

| # | Requirement |
|---|---|
| 1 | `Trim<"  hello  ">` → `"hello"`, via `TrimLeft` and `TrimRight`. |
| 2 | `Split<"a,b,c", ",">` → `["a", "b", "c"]`, matching `String.prototype.split`. |
| 3 | `Join<["a", "b", "c"], "-">` → `"a-b-c"` — no trailing delimiter. |
| 4 | `Replace` (first match) and `ReplaceAll` (every match). |
| 5 | `KebabCase<"backgroundColor">` → `"background-color"`, plus the runtime twin. |

## Rules

- Do not edit `exercise.test.ts`.
- No `any`, no `as`, no `!`.

## Done when

```bash
npm run check 21/03
```

<details>
<summary>Hint 1 — a union inside a pattern</summary>

```ts
type TrimLeft<S extends string> = S extends `${Whitespace}${infer R}` ? TrimLeft<R> : S;
```

`Whitespace` is `" " | "\n" | "\t"`, and a union in a pattern position means
"any of these" — the compiler tries each. You do not need one branch per
character.

`TrimRight` is the mirror image: put the wildcard first and the whitespace last.
</details>

<details>
<summary>Hint 2 — Split's base case</summary>

```ts
type Split<S extends string, D extends string> =
  S extends `${infer H}${D}${infer R}` ? [H, ...Split<R, D>] : [S];
```

The false branch is `[S]`, **not** `[]`. A string with no delimiter in it is
still one part — and `"".split(",")` returns `[""]` at runtime, so the type and
the runtime agree. The test checks exactly that.
</details>

<details>
<summary>Hint 3 — <code>infer H extends string</code></summary>

Inside `Join`, a plain `infer H` has type `unknown`, and `unknown` cannot go in
a template literal. Constrain it in place:

```ts
T extends readonly [infer H extends string, ...infer R extends string[]] ? … : …
```

Then ask `R extends []` to decide whether a delimiter is still needed.
</details>

<details>
<summary>Hint 4 — the empty-pattern trap</summary>

`ReplaceAll<"abc", "", "y">` must return `"abc"`. Without a guard, `""` matches
at every position, the tail never shrinks, and tsc reports *"Type instantiation
is excessively deep and possibly infinite"*.

One `From extends "" ? S : …` at the top fixes both `Replace` and `ReplaceAll`.
</details>

<details>
<summary>Hint 5 — detecting an uppercase letter without a primitive</summary>

There is no `IsUpper<C>`. Compare the rest of the string against its own
`Uncapitalize`:

```ts
S extends `${infer H}${infer R}`
  ? R extends Uncapitalize<R>
    ? `${Uncapitalize<H>}${KebabCase<R>}`
    : `${Uncapitalize<H>}-${KebabCase<R>}`
  : S
```

If lowercasing the first character of `R` changes it, that character was
uppercase — so emit a hyphen before recursing.

For the runtime twin, one regex does it: insert a hyphen at every
lower-to-upper boundary, then lowercase.
</details>

---

Afterwards read [`solution/EXPLANATION.md`](solution/EXPLANATION.md) — it covers
how the compiler chooses a split point, why the type and the regex disagree on
acronyms like `"HTTPServer"`, and what these types cost at build time.
