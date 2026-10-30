import { expect, test } from "@playwright/test";

const protectedPaths = [
  "/account",
  "/onboarding",
  "/discover",
  "/likes",
  "/matches",
  "/messages",
  "/privacy",
  "/admin/reports",
];

test.describe("Bondora public and auth guards", () => {
  test("public marketing pages render", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Bondora/);
    await expect(page.getByRole("heading", { name: /meet with clarity/i })).toBeVisible();

    await page.goto("/how-it-works");
    await expect(page).toHaveTitle(/How it works/i);

    await page.goto("/safety");
    await expect(page).toHaveTitle(/Safety/i);
  });

  for (const path of protectedPaths) {
    test(`${path} redirects anonymous visitors to login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login$/);
      await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    });
  }

  test("unauthenticated APIs refuse private data and writes", async ({ request }) => {
    const privacy = await request.get("/api/me/privacy");
    expect(privacy.status()).toBe(401);

    const report = await request.post("/api/reports", {
      data: { targetUid: "demo-user-002", category: "spam" },
      headers: { origin: "http://127.0.0.1:3100" },
      timeout: 15_000,
    });
    expect(report.status()).toBe(401);
  });
});

test("signup page exposes the adults-only account flow", async ({ page }) => {
  await page.goto("/signup");
  await expect(page).toHaveTitle(/Create account/i);
  await expect(page.getByText(/18\+/i)).toBeVisible();
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
});
