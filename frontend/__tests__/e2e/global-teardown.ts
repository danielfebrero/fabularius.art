import { FullConfig } from "@playwright/test";

async function globalTeardown(config: FullConfig) {
  // Clean up any global resources
  console.log("Cleaning up after E2E test suite...");

  // Remove any temporary files or authentication state
  // const fs = require('fs')
  // if (fs.existsSync('auth-state.json')) {
  //   fs.unlinkSync('auth-state.json')
  // }

  // Clean up any test data or reset database state
  // This could include API calls to clean up test data

  console.log("E2E test suite cleanup complete.");
}

export default globalTeardown;
