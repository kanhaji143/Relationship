import { describe, expect, it } from "vitest";

import { regionLabel } from "./onboarding";

describe("regionLabel", () => {
  it("labels a known region", () => {
    expect(regionLabel("south")).toBe("South India");
  });

  it("falls back to the country label without a region", () => {
    expect(regionLabel(null)).toBe("India");
  });
});
