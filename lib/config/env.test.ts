import { afterEach, describe, expect, it, vi } from "vitest";

async function importEnv() {
  vi.resetModules();
  return import("./env");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("server environment", () => {
  it("applies safe defaults when nothing is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    const { getServerEnv } = await importEnv();
    const env = getServerEnv();

    expect(env.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
    expect(env.NEXT_PUBLIC_BRAND_NAME).toBe("Bondora");
    expect(env.BILLING_TEST_MODE).toBe("true");
  });

  it("rejects a malformed app URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "not-a-url");
    const { getServerEnv, EnvValidationError } = await importEnv();

    expect(() => getServerEnv()).toThrow(EnvValidationError);
  });

  it("never echoes secret values in validation errors", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "still-not-a-url");
    vi.stubEnv("RAZORPAY_KEY_SECRET", "super-secret-value");
    const { getServerEnv } = await importEnv();

    try {
      getServerEnv();
      throw new Error("expected validation to fail");
    } catch (error) {
      expect(String(error)).not.toContain("super-secret-value");
    }
  });

  it("detects missing Firebase configuration", async () => {
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_API_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_APP_ID", "");
    const { isFirebaseConfigured, assertFirebaseConfigured } = await importEnv();

    expect(isFirebaseConfigured()).toBe(false);
    expect(() => assertFirebaseConfigured()).toThrow(/not configured/i);
  });

  it("detects complete Firebase configuration", async () => {
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_API_KEY", "api-key");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "bondora-test");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_APP_ID", "1:2:web:3");
    const { isFirebaseConfigured } = await importEnv();

    expect(isFirebaseConfigured()).toBe(true);
  });
});
