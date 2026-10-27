import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("brand config", () => {
  it("falls back to the provisional working name", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_BRAND_NAME", "");
    const { brand } = await import("./brand");

    expect(brand.name).toBe("Bondora");
    expect(brand.provisional).toBe(true);
    expect(brand.minAge).toBe(18);
  });

  it("uses a configured brand name and marks it non-provisional", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_BRAND_NAME", "Example Co");
    const { brand } = await import("./brand");

    expect(brand.name).toBe("Example Co");
    expect(brand.provisional).toBe(false);
  });

  it("falls back to localhost when app URL is not set", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    const { brand } = await import("./brand");

    expect(brand.appUrl).toBe("http://localhost:3000");
  });
});
