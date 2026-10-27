import { afterEach, describe, expect, it, vi } from "vitest";

import { logger, redact } from "./index";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("redact", () => {
  it("redacts sensitive keys", () => {
    const output = redact({
      password: "hunter2",
      token: "abc",
      authorization: "Bearer xyz",
      cookie: "session=1",
      safe: "kept",
    });

    expect(output).toMatchObject({
      password: "[redacted]",
      token: "[redacted]",
      authorization: "[redacted]",
      cookie: "[redacted]",
      safe: "kept",
    });
  });

  it("redacts nested objects", () => {
    const output = redact({ user: { email: "asha@example.com", id: "u1" } });
    expect(output).toEqual({ user: { email: "[redacted]", id: "u1" } });
  });

  it("masks emails and bearer tokens in strings", () => {
    const output = redact({
      note: "contact asha@example.com",
      header: "Bearer secret-token",
    });

    expect(output.note).toBe("contact [redacted-email]");
    expect(output.header).toBe("Bearer [redacted]");
  });
});

describe("logger", () => {
  it("emits structured JSON with level and event", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    logger.info("auth.signup", { uid: "u1", password: "hunter2" });

    expect(log).toHaveBeenCalledOnce();
    const entry = JSON.parse(log.mock.calls[0][0] as string);
    expect(entry.level).toBe("info");
    expect(entry.event).toBe("auth.signup");
    expect(entry.uid).toBe("u1");
    expect(entry.password).toBe("[redacted]");
    expect(typeof entry.time).toBe("string");
  });

  it("routes warn and error to the right console methods", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    logger.warn("rate.limit");
    logger.error("server.error");

    expect(warn).toHaveBeenCalledOnce();
    expect(error).toHaveBeenCalledOnce();
  });

  it("suppresses debug logs at the default level", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    logger.debug("noisy");
    expect(log).not.toHaveBeenCalled();
  });
});
