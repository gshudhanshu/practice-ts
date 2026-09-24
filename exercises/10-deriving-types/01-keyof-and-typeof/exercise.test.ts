import { describe, expect, it } from "vitest";
import type { Equal, Expect } from "../../../src/type-testing";
import {
  configKeys,
  isConfigKey,
  type ClickHandler,
  type Config,
  type ConfigKey,
  type EventName,
  type Role,
} from "./exercise";

/* ── Compile-time spec ──────────────────────────────────────────────────── */

type _config = Expect<
  Equal<Config, { host: string; port: number; secure: boolean }>
>;

type _configKey = Expect<Equal<ConfigKey, "host" | "port" | "secure">>;

type _role = Expect<Equal<Role, "admin" | "editor" | "viewer">>;

type _eventName = Expect<Equal<EventName, "click" | "key">>;

type _clickHandler = Expect<
  Equal<ClickHandler, (x: number, y: number) => string>
>;

type _configKeysReturn = Expect<Equal<ReturnType<typeof configKeys>, ConfigKey[]>>;

function _compileTimeOnly(): void {
  // @ts-expect-error — not a config key.
  const _bad: ConfigKey = "nope";

  // @ts-expect-error — not a role.
  const _badRole: Role = "owner";

  // isConfigKey must be a type predicate.
  const raw: string = "host";
  if (isConfigKey(raw)) {
    type _narrowed = Expect<Equal<typeof raw, ConfigKey>>;
  }
}

/* ── Runtime spec ───────────────────────────────────────────────────────── */

describe("isConfigKey", () => {
  it("accepts every config key", () => {
    expect(isConfigKey("host")).toBe(true);
    expect(isConfigKey("port")).toBe(true);
    expect(isConfigKey("secure")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isConfigKey("nope")).toBe(false);
    expect(isConfigKey("Host")).toBe(false);
    expect(isConfigKey("")).toBe(false);
    expect(isConfigKey("toString")).toBe(false);
  });
});

describe("configKeys", () => {
  it("lists every key", () => {
    expect([...configKeys()].sort()).toEqual(["host", "port", "secure"]);
  });

  it("returns a fresh array", () => {
    expect(configKeys()).not.toBe(configKeys());
  });
});
