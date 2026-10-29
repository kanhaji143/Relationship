import { describe, expect, it } from "vitest";

import { reportPriority } from "./reports";

describe("reportPriority", () => {
  it("escalates danger categories to high priority", () => {
    expect(reportPriority("minor_safety")).toBe("high");
    expect(reportPriority("non_consensual_image")).toBe("high");
    expect(reportPriority("threats")).toBe("high");
  });

  it("marks spam and other as low priority", () => {
    expect(reportPriority("spam")).toBe("low");
    expect(reportPriority("other")).toBe("low");
  });

  it("defaults the remaining categories to medium", () => {
    expect(reportPriority("harassment")).toBe("medium");
    expect(reportPriority("hate")).toBe("medium");
    expect(reportPriority("impersonation")).toBe("medium");
    expect(reportPriority("unknown")).toBe("medium");
  });
});
