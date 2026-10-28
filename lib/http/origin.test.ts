import { describe, expect, it } from "vitest";

import { isAllowedOrigin } from "./origin";

const policy = {
  requestOrigin: "https://app.example.com",
  allowedOrigins: ["https://www.example.com"],
};

describe("isAllowedOrigin", () => {
  it("accepts the request's own origin", () => {
    expect(isAllowedOrigin("https://app.example.com", policy)).toBe(true);
  });

  it("accepts explicitly configured origins", () => {
    expect(isAllowedOrigin("https://www.example.com", policy)).toBe(true);
  });

  it("rejects foreign origins", () => {
    expect(isAllowedOrigin("https://evil.example.net", policy)).toBe(false);
  });

  it("rejects missing or malformed origins", () => {
    expect(isAllowedOrigin(null, policy)).toBe(false);
    expect(isAllowedOrigin("not a url", policy)).toBe(false);
  });

  it("ignores empty configured origins", () => {
    expect(
      isAllowedOrigin("http://localhost:3002", {
        requestOrigin: "http://localhost:3002",
        allowedOrigins: [""],
      }),
    ).toBe(true);
  });
});
