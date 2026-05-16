import { test, expect } from "@playwright/test";

test("home carrega e lista ferramentas", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /DevToolbox|ferramentas/i })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText("Formatador JSON").first()).toBeVisible();
});

test("JSON tool responde", async ({ page }) => {
  await page.goto("/tools/json");
  await expect(page.getByRole("heading", { name: "Formatador JSON" })).toBeVisible({ timeout: 15_000 });
});
