import { test, expect } from "@playwright/test";

test.describe("Public happy path", () => {
  test("landing page loads with hero and key navigation", async ({ page }) => {
    await page.goto("/");
    // Hero is visible
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Navigation: desktop shows the nav bar directly; mobile shows a hamburger
    const viewport = page.viewportSize();
    if (viewport && viewport.width < 1024) {
      await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
    } else {
      await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
    }
    // Footer exists
    await expect(page.getByRole("contentinfo")).toBeVisible();
  });

  test("search page shows results or empty state", async ({ page }) => {
    await page.goto("/search");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Either we get results table/cards or an empty state
    const hasResults = await page.locator("table, [data-testid='search-results']").count();
    const hasEmpty = await page.getByText(/no results|not enough/i).count();
    expect(hasResults + hasEmpty).toBeGreaterThan(0);
  });

  test("services page lists available services", async ({ page }) => {
    await page.goto("/services");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // At least one service link
    const links = page.getByRole("link").filter({ hasText: /passport|driving|property|ration/i });
    await expect(links.first()).toBeVisible();
  });

  test("report page shows wizard with trust rail", async ({ page }) => {
    await page.goto("/report");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Trust/anonymity assurance is visible
    await expect(page.getByText(/identity is safe/i)).toBeVisible();
    // Step indicators visible
    await expect(page.getByText(/step/i).first()).toBeVisible();
  });

  test("methodology page explains the approach", async ({ page }) => {
    await page.goto("/methodology");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // These terms appear multiple times on the page; .first() avoids strict-mode violation
    await expect(page.getByText(/median/i).first()).toBeVisible();
    await expect(page.getByText(/threshold/i).first()).toBeVisible();
  });

  test("map page renders the choropleth or fallback", async ({ page }) => {
    await page.goto("/map");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // SVG map or a meaningful fallback
    const hasSvg = await page.locator("svg").count();
    const hasFallback = await page.getByText(/not enough data/i).count();
    expect(hasSvg + hasFallback).toBeGreaterThan(0);
  });

  test("404 page shows helpful navigation", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");
    await expect(page.getByText(/not here/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /browse services/i })).toBeVisible();
  });

  test("states page lists Indian states", async ({ page }) => {
    await page.goto("/states");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Use a link locator scoped to main content to avoid SVG title matches
    const stateLink = page.locator("main").getByRole("link").filter({
      hasText: /maharashtra|karnataka|delhi/i,
    });
    await expect(stateLink.first()).toBeVisible();
  });
});
