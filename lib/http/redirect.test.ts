import { describe, expect, it } from "vitest";

import { safeRedirectPath } from "./redirect";

describe("safeRedirectPath", () => {
  it("allows same-site absolute paths", () => {
    expect(safeRedirectPath("/settings")).toBe("/settings");
  });

  it("rejects protocol-relative URLs", () => {
    expect(safeRedirectPath("//evil.example")).toBe("/account");
  });

  it("rejects absolute URLs and backslashes", () => {
    expect(safeRedirectPath("https://evil.example")).toBe("/account");
    expect(safeRedirectPath("/\\evil.example")).toBe("/account");
  });

  it("falls back for empty values and control characters", () => {
    expect(safeRedirectPath(null)).toBe("/account");
    expect(safeRedirectPath("/a\nb")).toBe("/account");
    expect(safeRedirectPath("", "/login")).toBe("/login");
  });
});
