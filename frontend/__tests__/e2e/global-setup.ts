import { chromium, FullConfig } from "@playwright/test";

async function globalSetup(config: FullConfig) {
  // Start the development server if not already running
  // This is handled by the webServer config in playwright.config.ts

  // You can add any global setup logic here
  console.log("Starting E2E test suite...");

  // Optional: Create a browser instance for shared authentication
  // const browser = await chromium.launch()
  // const context = await browser.newContext()
  // const page = await context.newPage()

  // Perform any authentication or setup here
  // await page.goto('http://localhost:3000/login')
  // await page.fill('[data-testid="username"]', 'admin')
  // await page.fill('[data-testid="password"]', 'password')
  // await page.click('[data-testid="login-button"]')

  // Save authentication state
  // await context.storageState({ path: 'auth-state.json' })

  // await browser.close()
}

export default globalSetup;
