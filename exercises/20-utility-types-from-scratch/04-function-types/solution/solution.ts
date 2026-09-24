/**
 * Solution — 20/04 Function types
 */

export type AnyFunction = (...args: never[]) => unknown;

export type AnyConstructor = abstract new (...args: never[]) => unknown;

export interface Thenable<T> {
  then(onfulfilled: (value: T) => void): void;
}

export interface BrokenThenable {
  then(ready: boolean): void;
}

export function describeUser(id: string, active: boolean): string {
  return `${id} is ${active ? "active" : "inactive"}`;
}

export class Repository {
  constructor(private readonly table: string) {}

  find(id: string): string {
    return `${this.table}#${id}`;
  }
}

export abstract class Job {
  abstract run(): void;
}

// Write the shape, put `infer` where you want a piece back. The parameter list
// is `never[]` for the same reason as in `AnyFunction`: it matches any
// parameters without dragging `any` in.
//
// The standard library's false branch is `any`, not `never` — unreachable given
// the constraint, but it makes `ReturnType` degrade quietly rather than loudly
// if the constraint is ever bypassed.
export type MyReturnType<T extends AnyFunction> = T extends (
  ...args: never[]
) => infer R
  ? R
  : never;

// `infer P` in the rest-parameter position captures the WHOLE list as a tuple,
// complete with its parameter names and any optional or rest elements.
export type MyParameters<T extends AnyFunction> = T extends (
  ...args: infer P
) => unknown
  ? P
  : never;

// `abstract new` in the pattern, or abstract classes fail to match. Note this
// is the only way to go from `typeof SomeClass` (the constructor) to
// `SomeClass` (the instance) when you cannot simply write the class name.
export type MyInstanceType<T extends AnyConstructor> =
  T extends abstract new (...args: never[]) => infer R ? R : never;

// The real `Awaited`, minus the comments.
//
//  1. `null | undefined` short-circuits. Under `strictNullChecks` this branch is
//     unreachable (neither is an `object`), and it exists purely so the type
//     behaves in codebases with the flag off.
//  2. The match is on the SHAPE of a thenable, not on `Promise`, because that
//     is what `await` does: any object with a callable `then` is unwrapped.
//  3. `infer F` captures the `then` callback; the second conditional pulls its
//     first parameter out of it. A `then` whose argument is not callable
//     produces `never` — nothing could ever be awaited out of it.
//  4. The recursive call is what flattens `Promise<Promise<T>>`, and also what
//     lets a thenable resolve to a promise.
export type MyAwaited<T> = T extends null | undefined
  ? T
  : T extends object & { then(onfulfilled: infer F, ...args: never[]): unknown }
    ? F extends (value: infer V, ...args: never[]) => unknown
      ? MyAwaited<V>
      : never
    : T;

export type DescribeArgs = MyParameters<typeof describeUser>;

export function callDescribe(
  args: DescribeArgs,
): MyReturnType<typeof describeUser> {
  // Both types resolve concretely — `typeof describeUser` is not a type
  // parameter — so the tuple spread checks against the real signature and no
  // cast is needed. Write the same function generically over `F extends
  // AnyFunction` and `MyParameters<F>` becomes a DEFERRED conditional (10/04),
  // at which point the spread stops compiling. The explanation covers the way
  // round that.
  return describeUser(...args);
}
