/**
 * Exercise 10/05 — Template literal types
 *
 * String literal types you can build, constrain and — with `infer` — take
 * apart. This is how libraries type route paths, CSS values, event names and
 * query builders.
 *
 * Read README.md first. Replace every TODO.
 */

// ─── TODO 1 ──────────────────────────────────────────────────────────────────
// Turn an event name into its handler name:
//   EventHandlerName<"click">  ->  "onClick"
//   EventHandlerName<"focus">  ->  "onFocus"
//
// Distributes over a union for free: EventHandlerName<"click" | "focus">
// must be "onClick" | "onFocus".
export type EventHandlerName<T extends string> = unknown;

// ─── TODO 2 ──────────────────────────────────────────────────────────────────
// A URL that must start with https://
//   "https://example.com"  ok
//   "http://example.com"   compile error
export type HttpsUrl = unknown;

// ─── TODO 3 ──────────────────────────────────────────────────────────────────
// A CSS pixel value: any number followed by "px".
//   "12px"   ok
//   "12rem"  compile error
//   "px"     compile error
export type Pixels = unknown;

// ─── TODO 4 ──────────────────────────────────────────────────────────────────
// Extract the :parameter names from a route path, as a union:
//   RouteParams<"/users/:userId">                  ->  "userId"
//   RouteParams<"/users/:userId/posts/:postId">    ->  "userId" | "postId"
//   RouteParams<"/users">                          ->  never
//
// Two patterns and recursion: one for "there is a parameter with more path
// after it", one for "there is a parameter at the end".
export type RouteParams<T extends string> = unknown;

// ─── TODO 5 ──────────────────────────────────────────────────────────────────
// The runtime twin of TODO 4 — the same job, done to a value:
//   pathParamNames("/users/:userId/posts/:postId")  ->  ["userId", "postId"]
//   pathParamNames("/users")                        ->  []
//
// Parameter names are letters, digits and underscores.
export function pathParamNames(path: string): string[] {
  throw new Error("TODO 5: implement pathParamNames");
}
