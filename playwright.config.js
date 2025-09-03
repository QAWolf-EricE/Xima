// playwright.config.js
import { defineConfig, devices } from "@playwright/test";
import { mkdirSync, existsSync } from "fs";
import { join } from "path";

console.log(`Playwright config executed at ${new Date().toISOString()}`);

const reportBaseDir = "test-reports";
mkdirSync(reportBaseDir, { recursive: true });
console.log(`Report Base Directory: ${reportBaseDir}`);

let reportDir = "";
let isReportDirCreated = false;

const createReportDir = () => {
  if (!isReportDirCreated) {
    // Get the current time and round it to the nearest 10 seconds
    const date = new Date();
    const roundedSeconds = Math.floor(date.getTime() / 10000) * 10; // Round to nearest 10 seconds
    const roundedDate = new Date(roundedSeconds * 1000); // Create a new Date object

    const timestamp = roundedDate.toISOString().replace(/[:.]/g, "-"); // Format the timestamp
    reportDir = join(reportBaseDir, `playwright-report-${timestamp}`);

    if (!existsSync(reportDir)) {
      mkdirSync(reportDir, { recursive: true });
      console.log(`Generated Report Directory: ${reportDir}`);
    } else {
      console.log(`Report Directory already exists: ${reportDir}`);
    }

    isReportDirCreated = true; // Set the flag to true after creating the directory
  }
  return reportDir;
};

// Export the configuration object for use in qawHelpers
// timeout:30mins, pageTimeout:30secs, expect:30secs, navigationTimeout:30secs, actionTimeout:30secs
export const config = {
  timeout: 30 * 60 * 1000,
  pageTimeout: 30_000,
  expect: {
    timeout: 30_000,
    // Configure screenshot path template to have a consistent naming structure
    toHaveScreenshot: {
      pathTemplate: '{testDir}/screenshots/{testFilePath}/{arg}{ext}',
    },
  },
  use: {
    trace: "on",
    navigationTimeout: 30_000,
    actionTimeout: 30_000,
    headless: false,
  },
  reporter: [
    ["list"], // Prints the test results to the console
    ["html", { outputFolder: join(createReportDir(), "html"), open: "never" }],
    ["json", { outputFile: join(createReportDir(), "test-results.json") }],
    ["junit", { outputFile: join(createReportDir(), "results.xml") }],
  ],

  // Configure projects for major browsers
    projects: [
    {
      name: "Google Chrome",
      use: { ...devices["Desktop Chrome"], channel: "chrome" }, // or 'chrome-beta'
    },
  ],

};

// Export report utilities
export { createReportDir };

export default defineConfig(config);
