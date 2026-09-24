/**
 * Exercise 20/04 — Function types: ReturnType, Parameters, InstanceType, Awaited
 *
 * The object utilities (20/01, 20/02) are mapped types. These four are
 * conditional types with `infer` — you write the SHAPE of a function and put
 * `infer` where you want the compiler to hand you a piece back:
 *
 *   T extends (...args: never[]) => infer R ? R : never
 *
 * `Awaited` is the interesting one. It looks like a two-line recursion and is
 * genuinely a nine-line beast in `lib.es5.d.ts`, because `await` does not only
 * unwrap `Promise` — it unwraps anything with a callable `then`. Getting that
 * right is the difference between a type that works on your code and one that
 * works on everybody's.
 *
 * `infer` and recursion are 10/04. This exercise applies them.
 *
 * Read README.md first. Replace every TODO.
 */

/**
 * Given — "any function", written without `any`.
 *
 * The standard library uses `(...args: any) => any` here, because it predates
 * the alternative and because `any` in a constraint is contagious. `never` is
 * the honest version: parameters are checked CONTRAVARIANTLY, so a parameter
 * list of `never[]` accepts a function with any parameters at all, while
 * `unknown` as the return type accepts any return.
 *
 * You will need the same shape in your own code every time you constrain a
 * generic to "some function" — see 08/02.
 */
export type AnyFunction = (...args: never[]) => unknown;

/**
 * Given — "any class". `abstract new` matters: a plain `new (…) => …` pattern
 * rejects abstract classes, which is a common and confusing failure.
 */
export type AnyConstructor = abstract new (...args: never[]) => unknown;

/** Given — a thing you can `await` that is not a Promise. */
export interface Thenable<T> {
  then(onfulfilled: (value: T) => void): void;
}

/** Given — a `then` that is not a callback. `await` cannot unwrap this. */
export interface BrokenThenable {
  then(ready: boolean): void;
}

/** Given — the fixtures the runtime half uses. */
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

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// The return type of a function type.
//   MyReturnType<() => string>            ->  string
//   MyReturnType<(a: number) => void>     ->  void
//   MyReturnType<typeof describeUser>     ->  string
export type MyReturnType<T extends AnyFunction> = unknown;

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// The parameters of a function type, as a TUPLE.
//   MyParameters<() => void>              ->  []
//   MyParameters<typeof describeUser>     ->  [id: string, active: boolean]
//
// Infer the whole rest-parameter list in one go — not one parameter at a time.
export type MyParameters<T extends AnyFunction> = unknown;

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// The instance type a constructor produces.
//   MyInstanceType<typeof Repository>     ->  Repository
//   MyInstanceType<typeof Job>            ->  Job
//   MyInstanceType<MapConstructor>        ->  Map<unknown, unknown>
//
// `typeof SomeClass` is the CONSTRUCTOR, not the instance (10/01). This is the
// type that converts between the two.
export type MyInstanceType<T extends AnyConstructor> = unknown;

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// What you get when you `await` a value. Three requirements:
//
//   MyAwaited<Promise<string>>              ->  string
//   MyAwaited<Promise<Promise<number>>>     ->  number      (recursion)
//   MyAwaited<Thenable<boolean>>            ->  boolean     (any thenable)
//   MyAwaited<number>                       ->  number      (not a promise)
//   MyAwaited<BrokenThenable>               ->  never       (`then` takes no callback)
//
// `T extends Promise<infer U>` handles the first two and fails the third —
// `await` unwraps anything with a callable `then`, and the type must match the
// language. Match on the SHAPE `{ then(cb, …): … }` instead, infer the callback,
// then infer that callback's first parameter.
export type MyAwaited<T> = unknown;

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// The runtime pay-off. This is the shape of every wrapper you will ever write —
// a memoiser, a retrier, a logger — where the argument list and the result must
// stay welded to some existing function.
//
//   callDescribe(["u1", true])  ->  "u1 is active"
//
// Spread the tuple into the call. No casts.
export type DescribeArgs = MyParameters<typeof describeUser>;

export function callDescribe(
  args: DescribeArgs,
): MyReturnType<typeof describeUser> {
  throw new Error("TODO 5: implement callDescribe");
}
