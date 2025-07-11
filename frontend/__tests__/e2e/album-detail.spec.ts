import { test, expect } from "@playwright/test";

test.describe("Album Detail Page", () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route("**/api/albums/album-1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: "album-1",
            title: "Nature Photography",
            description: "Beautiful landscapes and wildlife",
            coverImage: "https://example.com/cover1.jpg",
            isPublic: true,
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
            mediaCount: 15,
          },
        }),
      });
    });

    await page.route("**/api/albums/album-1/media**", async (route) => {
      const url = new URL(route.request().url());
      const page_param = url.searchParams.get("page") || "1";
      const limit = parseInt(url.searchParams.get("limit") || "12");
      const pageNum = parseInt(page_param);

      // Mock media items
      const allMedia = Array.from({ length: 15 }, (_, i) => ({
        id: `media-${i + 1}`,
        albumId: "album-1",
        filename: `image-${i + 1}.jpg`,
        originalName: `Image ${i + 1}.jpg`,
        mimeType: "image/jpeg",
        size: 1024000 + i * 100000,
        url: `https://example.com/media/image-${i + 1}.jpg`,
        thumbnailUrl: `https://example.com/thumbnails/image-${i + 1}.jpg`,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      }));

      const startIndex = (pageNum - 1) * limit;
      const endIndex = startIndex + limit;
      const pageMedia = allMedia.slice(startIndex, endIndex);

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: pageMedia,
          pagination: {
            page: pageNum,
            limit,
            total: allMedia.length,
            totalPages: Math.ceil(allMedia.length / limit),
            hasNext: endIndex < allMedia.length,
            hasPrev: pageNum > 1,
          },
        }),
      });
    });

    await page.goto("/albums/album-1");
  });

  test("displays album information correctly", async ({ page }) => {
    // Check album title and description
    await expect(
      page.getByRole("heading", { name: "Nature Photography" })
    ).toBeVisible();
    await expect(
      page.getByText("Beautiful landscapes and wildlife")
    ).toBeVisible();

    // Check media count
    await expect(page.getByText("15 items")).toBeVisible();
  });

  test("displays media gallery with thumbnails", async ({ page }) => {
    // Wait for media to load
    await expect(page.getByTestId("media-gallery")).toBeVisible();

    // Check that media items are displayed
    await expect(page.getByTestId("media-item-media-1")).toBeVisible();
    await expect(page.getByTestId("media-item-media-2")).toBeVisible();

    // Check thumbnail images
    const firstImage = page.getByTestId("media-item-media-1").locator("img");
    await expect(firstImage).toHaveAttribute("src", /image-1\.jpg/);
    await expect(firstImage).toHaveAttribute("alt", "Image 1.jpg");
  });

  test("supports pagination through media", async ({ page }) => {
    // Wait for initial load
    await expect(page.getByTestId("media-gallery")).toBeVisible();

    // Check pagination controls
    await expect(page.getByTestId("pagination")).toBeVisible();
    await expect(page.getByText("Page 1")).toBeVisible();

    // Check next button is enabled, prev is disabled
    const nextButton = page.getByTestId("next-page");
    const prevButton = page.getByTestId("prev-page");

    await expect(nextButton).toBeEnabled();
    await expect(prevButton).toBeDisabled();

    // Click next page
    await nextButton.click();

    // Check page 2 content
    await expect(page.getByText("Page 2")).toBeVisible();
    await expect(page.getByTestId("media-item-media-13")).toBeVisible();

    // Check pagination state
    await expect(prevButton).toBeEnabled();
  });

  test("opens media in lightbox when clicked", async ({ page }) => {
    // Wait for media to load
    await expect(page.getByTestId("media-gallery")).toBeVisible();

    // Click on first media item
    await page.getByTestId("media-item-media-1").click();

    // Check lightbox opens
    await expect(page.getByTestId("lightbox")).toBeVisible();
    await expect(page.getByTestId("lightbox-image")).toBeVisible();

    // Check image source
    const lightboxImage = page.getByTestId("lightbox-image");
    await expect(lightboxImage).toHaveAttribute("src", /image-1\.jpg/);

    // Check navigation controls
    await expect(page.getByTestId("lightbox-next")).toBeVisible();
    await expect(page.getByTestId("lightbox-prev")).toBeVisible();
    await expect(page.getByTestId("lightbox-close")).toBeVisible();
  });

  test("navigates through images in lightbox", async ({ page }) => {
    // Open lightbox
    await page.getByTestId("media-item-media-1").click();
    await expect(page.getByTestId("lightbox")).toBeVisible();

    // Navigate to next image
    await page.getByTestId("lightbox-next").click();

    // Check second image is displayed
    const lightboxImage = page.getByTestId("lightbox-image");
    await expect(lightboxImage).toHaveAttribute("src", /image-2\.jpg/);

    // Navigate back
    await page.getByTestId("lightbox-prev").click();
    await expect(lightboxImage).toHaveAttribute("src", /image-1\.jpg/);
  });

  test("closes lightbox with close button", async ({ page }) => {
    // Open lightbox
    await page.getByTestId("media-item-media-1").click();
    await expect(page.getByTestId("lightbox")).toBeVisible();

    // Close lightbox
    await page.getByTestId("lightbox-close").click();
    await expect(page.getByTestId("lightbox")).not.toBeVisible();
  });

  test("closes lightbox with escape key", async ({ page }) => {
    // Open lightbox
    await page.getByTestId("media-item-media-1").click();
    await expect(page.getByTestId("lightbox")).toBeVisible();

    // Press escape
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("lightbox")).not.toBeVisible();
  });

  test("supports keyboard navigation in lightbox", async ({ page }) => {
    // Open lightbox
    await page.getByTestId("media-item-media-1").click();
    await expect(page.getByTestId("lightbox")).toBeVisible();

    // Navigate with arrow keys
    await page.keyboard.press("ArrowRight");

    const lightboxImage = page.getByTestId("lightbox-image");
    await expect(lightboxImage).toHaveAttribute("src", /image-2\.jpg/);

    await page.keyboard.press("ArrowLeft");
    await expect(lightboxImage).toHaveAttribute("src", /image-1\.jpg/);
  });

  test("displays loading state while fetching media", async ({ page }) => {
    // Delay the media API response
    await page.route("**/api/albums/album-1/media**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [],
          pagination: {
            page: 1,
            limit: 12,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        }),
      });
    });

    await page.goto("/albums/album-1");

    // Check loading state
    await expect(page.getByTestId("media-loading")).toBeVisible();
    await expect(page.getByText("Loading media...")).toBeVisible();
  });

  test("handles media loading errors gracefully", async ({ page }) => {
    // Mock API error
    await page.route("**/api/albums/album-1/media**", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: "Failed to load media",
        }),
      });
    });

    await page.goto("/albums/album-1");

    // Check error state
    await expect(page.getByTestId("media-error")).toBeVisible();
    await expect(page.getByText("Failed to load media")).toBeVisible();

    // Check retry button
    await expect(page.getByTestId("retry-button")).toBeVisible();
  });

  test("is responsive on mobile devices", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check mobile layout
    await expect(page.getByTestId("media-gallery")).toBeVisible();

    // Check that media grid adapts to mobile
    const mediaItems = page.getByTestId(/media-item-/);
    const firstItem = mediaItems.first();

    // On mobile, items should be smaller and arranged differently
    const boundingBox = await firstItem.boundingBox();
    expect(boundingBox?.width).toBeLessThan(200);
  });

  test("supports back navigation to albums list", async ({ page }) => {
    // Check back button/link
    await expect(page.getByTestId("back-to-albums")).toBeVisible();

    // Click back button
    await page.getByTestId("back-to-albums").click();

    // Should navigate to albums list
    await expect(page).toHaveURL("/albums");
  });
});
