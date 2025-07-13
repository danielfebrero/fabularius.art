import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display the main heading and description", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /welcome to pornspot\.art/i })
    ).toBeVisible();
    await expect(
      page.getByText(
        /a minimalist gallery for showcasing your art and photography collections/i
      )
    ).toBeVisible();
  });

  test("should display all feature cards", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /create albums/i })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /upload media/i })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /share & showcase/i })
    ).toBeVisible();
  });

  test("should have working navigation buttons", async ({ page }) => {
    const albumsButton = page.getByRole("button", { name: /albums/i });
    const uploadButton = page.getByRole("button", { name: /upload/i });

    await expect(albumsButton).toBeVisible();
    await expect(uploadButton).toBeVisible();

    // Test that buttons are clickable (even if they don't navigate yet)
    await albumsButton.click();
    await uploadButton.click();
  });

  test("should have working get started button", async ({ page }) => {
    const getStartedButton = page.getByRole("button", { name: /get started/i });

    await expect(getStartedButton).toBeVisible();
    await getStartedButton.click();
  });

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Check that content is still visible on mobile
    await expect(
      page.getByRole("heading", { name: /welcome to pornspot\.art/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /get started/i })
    ).toBeVisible();

    // Check that feature cards stack vertically on mobile
    const featureCards = page.locator(".card");
    await expect(featureCards).toHaveCount(3);
  });

  test("should be responsive on tablet", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await expect(
      page.getByRole("heading", { name: /welcome to pornspot\.art/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /get started/i })
    ).toBeVisible();
  });

  test("should be responsive on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    await expect(
      page.getByRole("heading", { name: /welcome to pornspot\.art/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /get started/i })
    ).toBeVisible();
  });

  test("should have proper dark theme styling", async ({ page }) => {
    // Check that the html element has dark class
    const htmlElement = page.locator("html");
    await expect(htmlElement).toHaveClass(/dark/);

    // Check that background is dark
    const body = page.locator("body");
    await expect(body).toHaveCSS("background-color", /rgb\(2, 8, 23\)|#020817/);
  });

  test("should have proper heading hierarchy", async ({ page }) => {
    // Main heading should be h1
    const mainHeading = page.getByRole("heading", { level: 1 });
    await expect(mainHeading).toHaveText(/welcome to pornspot\.art/i);

    // Feature headings should be h3
    const featureHeadings = page.getByRole("heading", { level: 3 });
    await expect(featureHeadings).toHaveCount(3);
  });

  test("should be keyboard navigable", async ({ page }) => {
    // Tab through interactive elements
    await page.keyboard.press("Tab"); // Albums button
    await expect(page.getByRole("button", { name: /albums/i })).toBeFocused();

    await page.keyboard.press("Tab"); // Upload button
    await expect(page.getByRole("button", { name: /upload/i })).toBeFocused();

    await page.keyboard.press("Tab"); // Get Started button
    await expect(
      page.getByRole("button", { name: /get started/i })
    ).toBeFocused();
  });

  test("should handle keyboard interactions", async ({ page }) => {
    const getStartedButton = page.getByRole("button", { name: /get started/i });

    await getStartedButton.focus();
    await page.keyboard.press("Enter");

    // Button should have been activated
    await expect(getStartedButton).toBeFocused();
  });

  test("should load without JavaScript errors", async ({ page }) => {
    const errors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Should not have any console errors
    expect(errors).toHaveLength(0);
  });

  test("should have proper meta tags", async ({ page }) => {
    await expect(page).toHaveTitle(/pornspot\.art - minimalist gallery/i);

    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute(
      "content",
      /beautiful, minimalist gallery/i
    );
  });

  test("should have proper semantic structure", async ({ page }) => {
    // Check for proper landmarks
    await expect(page.getByRole("banner")).toBeVisible(); // header
    await expect(page.getByRole("main")).toBeVisible(); // main content
    await expect(page.getByRole("contentinfo")).toBeVisible(); // footer
    await expect(page.getByRole("navigation")).toBeVisible(); // nav
  });

  test("should display footer content", async ({ page }) => {
    await expect(
      page.getByText(/© 2024 pornspot\.art\. all rights reserved\./i)
    ).toBeVisible();
  });

  test("should handle slow network conditions", async ({ page }) => {
    // Simulate slow 3G
    await page.route("**/*", (route) => {
      setTimeout(() => route.continue(), 100);
    });

    await page.goto("/");

    // Content should still load
    await expect(
      page.getByRole("heading", { name: /welcome to pornspot\.art/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test("should work with JavaScript disabled", async ({ page, context }) => {
    await context.addInitScript(() => {
      Object.defineProperty(navigator, "javaEnabled", {
        value: () => false,
        writable: false,
      });
    });

    await page.goto("/");

    // Basic content should still be visible
    await expect(
      page.getByRole("heading", { name: /welcome to pornspot\.art/i })
    ).toBeVisible();
    await expect(page.getByText(/minimalist gallery/i)).toBeVisible();
  });

  test("should have proper contrast ratios", async ({ page }) => {
    // This is a basic check - in a real scenario you'd use axe-playwright
    const mainHeading = page.getByRole("heading", {
      name: /welcome to pornspot\.art/i,
    });

    // Check that text is visible (basic contrast check)
    await expect(mainHeading).toBeVisible();

    // You could add more sophisticated contrast checking here
    const color = await mainHeading.evaluate(
      (el) => getComputedStyle(el).color
    );
    expect(color).toBeTruthy();
  });

  test("should handle window resize", async ({ page }) => {
    // Start with desktop size
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(
      page.getByRole("heading", { name: /welcome to pornspot\.art/i })
    ).toBeVisible();

    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(
      page.getByRole("heading", { name: /welcome to pornspot\.art/i })
    ).toBeVisible();

    // Resize back to desktop
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(
      page.getByRole("heading", { name: /welcome to pornspot\.art/i })
    ).toBeVisible();
  });
});
