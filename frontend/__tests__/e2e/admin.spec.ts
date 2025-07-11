import { test, expect } from "@playwright/test";

test.describe("Admin Interface", () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem("auth_token", "mock-admin-token");
      localStorage.setItem("user_role", "admin");
    });

    // Mock albums API
    await page.route("**/api/albums**", async (route) => {
      const url = new URL(route.request().url());
      const method = route.request().method();

      if (method === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: "album-1",
                title: "Nature Photography",
                description: "Beautiful landscapes",
                isPublic: true,
                mediaCount: 15,
                createdAt: "2024-01-01T00:00:00Z",
              },
              {
                id: "album-2",
                title: "Private Collection",
                description: "Personal photos",
                isPublic: false,
                mediaCount: 8,
                createdAt: "2024-01-02T00:00:00Z",
              },
            ],
            pagination: {
              page: 1,
              limit: 12,
              total: 2,
              totalPages: 1,
              hasNext: false,
              hasPrev: false,
            },
          }),
        });
      } else if (method === "POST") {
        const body = await route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: {
              id: "new-album-id",
              ...body,
              mediaCount: 0,
              createdAt: new Date().toISOString(),
            },
          }),
        });
      }
    });

    await page.goto("/admin");
  });

  test("displays admin dashboard with album management", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Admin Dashboard" })
    ).toBeVisible();
    await expect(page.getByText("Album Management")).toBeVisible();

    // Check album list
    await expect(page.getByTestId("admin-albums-list")).toBeVisible();
    await expect(page.getByText("Nature Photography")).toBeVisible();
    await expect(page.getByText("Private Collection")).toBeVisible();
  });

  test("shows create album form", async ({ page }) => {
    await page.getByTestId("create-album-button").click();

    await expect(page.getByTestId("create-album-modal")).toBeVisible();
    await expect(page.getByLabelText("Title")).toBeVisible();
    await expect(page.getByLabelText("Description")).toBeVisible();
    await expect(page.getByLabelText("Public")).toBeVisible();
  });

  test("creates new album successfully", async ({ page }) => {
    await page.getByTestId("create-album-button").click();

    // Fill form
    await page.getByLabelText("Title").fill("New Test Album");
    await page.getByLabelText("Description").fill("Test description");
    await page.getByLabelText("Public").check();

    // Submit form
    await page.getByTestId("submit-album").click();

    // Check success message
    await expect(page.getByText("Album created successfully")).toBeVisible();

    // Modal should close
    await expect(page.getByTestId("create-album-modal")).not.toBeVisible();
  });

  test("validates album form fields", async ({ page }) => {
    await page.getByTestId("create-album-button").click();

    // Try to submit empty form
    await page.getByTestId("submit-album").click();

    // Check validation errors
    await expect(page.getByText("Title is required")).toBeVisible();
    await expect(page.getByText("Description is required")).toBeVisible();
  });

  test("displays album statistics", async ({ page }) => {
    await expect(page.getByTestId("total-albums")).toContainText("2");
    await expect(page.getByTestId("public-albums")).toContainText("1");
    await expect(page.getByTestId("private-albums")).toContainText("1");
    await expect(page.getByTestId("total-media")).toContainText("23");
  });

  test("supports album editing", async ({ page }) => {
    // Click edit button for first album
    await page.getByTestId("edit-album-album-1").click();

    await expect(page.getByTestId("edit-album-modal")).toBeVisible();

    // Form should be pre-filled
    await expect(page.getByLabelText("Title")).toHaveValue(
      "Nature Photography"
    );
    await expect(page.getByLabelText("Description")).toHaveValue(
      "Beautiful landscapes"
    );

    // Make changes
    await page.getByLabelText("Title").fill("Updated Nature Photography");
    await page.getByTestId("submit-album").click();

    await expect(page.getByText("Album updated successfully")).toBeVisible();
  });

  test("supports album deletion with confirmation", async ({ page }) => {
    // Click delete button
    await page.getByTestId("delete-album-album-1").click();

    // Confirmation dialog should appear
    await expect(page.getByTestId("delete-confirmation")).toBeVisible();
    await expect(
      page.getByText("Are you sure you want to delete this album?")
    ).toBeVisible();

    // Cancel deletion
    await page.getByTestId("cancel-delete").click();
    await expect(page.getByTestId("delete-confirmation")).not.toBeVisible();

    // Try again and confirm
    await page.getByTestId("delete-album-album-1").click();
    await page.getByTestId("confirm-delete").click();

    await expect(page.getByText("Album deleted successfully")).toBeVisible();
  });

  test("displays media upload interface", async ({ page }) => {
    // Click on album to view details
    await page.getByTestId("album-album-1").click();

    await expect(page.getByTestId("media-upload-section")).toBeVisible();
    await expect(page.getByTestId("file-upload-input")).toBeVisible();
    await expect(page.getByText("Drag and drop files here")).toBeVisible();
  });

  test("handles file upload with progress", async ({ page }) => {
    await page.getByTestId("album-album-1").click();

    // Mock file upload
    const fileInput = page.getByTestId("file-upload-input");
    await fileInput.setInputFiles([
      {
        name: "test-image.jpg",
        mimeType: "image/jpeg",
        buffer: Buffer.from("fake-image-data"),
      },
    ]);

    // Check upload progress
    await expect(page.getByTestId("upload-progress")).toBeVisible();
    await expect(page.getByText("Uploading test-image.jpg")).toBeVisible();

    // Wait for completion
    await expect(page.getByText("Upload completed")).toBeVisible();
  });

  test("shows media management for albums", async ({ page }) => {
    await page.getByTestId("album-album-1").click();

    await expect(page.getByTestId("media-management")).toBeVisible();
    await expect(page.getByText("15 media items")).toBeVisible();

    // Check bulk actions
    await expect(page.getByTestId("select-all-media")).toBeVisible();
    await expect(page.getByTestId("bulk-delete-media")).toBeVisible();
  });

  test("supports bulk media operations", async ({ page }) => {
    await page.getByTestId("album-album-1").click();

    // Select multiple media items
    await page.getByTestId("select-media-1").check();
    await page.getByTestId("select-media-2").check();

    // Check bulk actions become available
    await expect(page.getByTestId("bulk-actions")).toBeVisible();
    await expect(page.getByText("2 items selected")).toBeVisible();

    // Bulk delete
    await page.getByTestId("bulk-delete-media").click();
    await page.getByTestId("confirm-bulk-delete").click();

    await expect(page.getByText("Media deleted successfully")).toBeVisible();
  });

  test("displays system settings", async ({ page }) => {
    await page.getByTestId("settings-tab").click();

    await expect(page.getByText("System Settings")).toBeVisible();
    await expect(page.getByLabelText("Site Title")).toBeVisible();
    await expect(page.getByLabelText("Max Upload Size")).toBeVisible();
    await expect(page.getByLabelText("Allowed File Types")).toBeVisible();
  });

  test("shows user management interface", async ({ page }) => {
    await page.getByTestId("users-tab").click();

    await expect(page.getByText("User Management")).toBeVisible();
    await expect(page.getByTestId("users-list")).toBeVisible();
    await expect(page.getByTestId("invite-user-button")).toBeVisible();
  });

  test("handles admin logout", async ({ page }) => {
    await page.getByTestId("admin-menu").click();
    await page.getByTestId("logout-button").click();

    // Should redirect to login
    await expect(page).toHaveURL("/login");
    await expect(page.getByText("Admin Login")).toBeVisible();
  });

  test("is responsive on mobile devices", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Check mobile navigation
    await expect(page.getByTestId("mobile-menu-button")).toBeVisible();

    // Open mobile menu
    await page.getByTestId("mobile-menu-button").click();
    await expect(page.getByTestId("mobile-nav")).toBeVisible();

    // Check admin sections are accessible
    await expect(page.getByText("Albums")).toBeVisible();
    await expect(page.getByText("Settings")).toBeVisible();
  });

  test("shows loading states during operations", async ({ page }) => {
    // Mock slow API response
    await page.route("**/api/albums", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.continue();
    });

    await page.reload();

    // Check loading state
    await expect(page.getByTestId("admin-loading")).toBeVisible();
    await expect(page.getByText("Loading dashboard...")).toBeVisible();
  });

  test("handles API errors gracefully", async ({ page }) => {
    // Mock API error
    await page.route("**/api/albums", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: "Server error",
        }),
      });
    });

    await page.reload();

    // Check error state
    await expect(page.getByTestId("admin-error")).toBeVisible();
    await expect(page.getByText("Failed to load dashboard")).toBeVisible();
    await expect(page.getByTestId("retry-button")).toBeVisible();
  });
});
