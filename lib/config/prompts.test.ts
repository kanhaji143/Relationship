import { describe, expect, it } from "vitest";

import { PROFILE_PROMPTS, promptLabel } from "./prompts";

describe("profile prompt catalog", () => {
  it("has unique stable keys", () => {
    const keys = PROFILE_PROMPTS.map((prompt) => prompt.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("returns catalog labels and a safe fallback", () => {
    expect(promptLabel("small_joy")).toBe("What small thing reliably makes your day better?");
    expect(promptLabel("unknown")).toBe("Profile prompt");
  });
});
