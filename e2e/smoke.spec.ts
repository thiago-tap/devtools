import { test, expect } from "@playwright/test";

test("home carrega e lista ferramentas", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /DevToolbox|ferramentas/i })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByRole("heading", { name: "Seu painel de trabalho neste navegador" })).toBeVisible();
  await expect(page.getByText("Formatador JSON").first()).toBeVisible();
});

test("JSON tool responde", async ({ page }) => {
  await page.goto("/tools/json");
  await expect(page.getByRole("heading", { name: "Formatador JSON" })).toBeVisible({ timeout: 15_000 });
});

test("Calculadora de Datas responde", async ({ page }) => {
  await page.goto("/tools/calculadora-datas");
  await expect(page.getByRole("heading", { name: "Calculadora de Datas" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Somar ou subtrair prazo")).toBeVisible();
});

test("DNS tool mostra opção Todos", async ({ page }) => {
  await page.goto("/tools/dns");
  await expect(page.getByRole("heading", { name: "DNS Check" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Todos" })).toBeVisible();
});

test("JSON Schema tool responde", async ({ page }) => {
  await page.goto("/tools/json-schema");
  await expect(page.getByRole("heading", { name: "JSON Schema Validator" })).toBeVisible({ timeout: 15_000 });
});

test("REST Client responde", async ({ page }) => {
  await page.goto("/tools/rest-client");
  await expect(page.getByRole("heading", { name: "REST Client" })).toBeVisible({ timeout: 15_000 });
});

test("REST Client salva request e roda collection", async ({ page }) => {
  await page.route("**/api/rest-client", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ status: 200, ok: true, latencyMs: 12, headers: {}, body: "ok" }),
    });
  });
  await page.goto("/tools/rest-client");
  await page.getByPlaceholder("Nome do request").fill("Health check");
  await page.getByText("Salvar request").click();
  await expect(page.getByText("Health check").first()).toBeVisible();
  await page.getByRole("button", { name: "Rodar collection" }).click();
  await expect(page.getByText("Resultado do runner")).toBeVisible();
  await expect(page.getByText("200 · 12ms")).toBeVisible();
});

test("cURL Importer responde", async ({ page }) => {
  await page.goto("/tools/curl-importer");
  await expect(page.getByRole("heading", { name: "cURL Importer" })).toBeVisible({ timeout: 15_000 });
});

test("Env Toolkit responde", async ({ page }) => {
  await page.goto("/tools/env");
  await expect(page.getByRole("heading", { name: "Env Toolkit" })).toBeVisible({ timeout: 15_000 });
});

test("Explain Error responde", async ({ page }) => {
  await page.goto("/tools/explain-error");
  await expect(page.getByRole("heading", { name: "Explique esse erro" })).toBeVisible({ timeout: 15_000 });
});

test("Deploy Checklist responde", async ({ page }) => {
  await page.goto("/tools/deploy-checklist");
  await expect(page.getByRole("heading", { name: "Deploy Checklist" })).toBeVisible({ timeout: 15_000 });
});

test("QR Code salvo persiste após reload", async ({ page }) => {
  await page.goto("/tools/qr-code");
  await page.getByPlaceholder("URL ou texto…").fill("https://example.com/qr");
  await page.getByRole("button", { name: "Adicionar QR à lista" }).click();
  await expect(page.getByText("QR Codes gerados")).toBeVisible();
  await page.reload();
  await expect(page.getByText("https://example.com/qr").first()).toBeVisible();
});
