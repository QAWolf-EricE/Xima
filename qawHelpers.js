import { test, expect } from "@playwright/test";
import assert from "assert";
import dotenv from "dotenv";
import { join } from "path";
import {
  config as playwrightConfig,
  createReportDir,
} from "./playwright.config.js";
import { getInbox } from './getInbox.js';
import axios from 'axios';
import crypto from 'crypto';
import * as dateFns from 'date-fns';
import faker from 'faker';
import fse from 'fse';
import https from 'https';
import twilio from 'twilio';
import { formatInTimeZone } from 'date-fns-tz';

dotenv.config();

console.log(`QAW Helpers loaded at ${new Date().toISOString()}`);

async function launch({
  ...options
} = {}) {
  const { chromium } = await import("playwright");

  // Get project config, default to first project
  const projectConfig = playwrightConfig.projects?.[0] || {};

  // Merge configurations:
  // 1. Start with top-level 'use' from config
  // 2. Override with project-specific 'use'
  // 3. Override with options passed directly to launch()
  const launchOptions = {
    ...playwrightConfig.use,
    ...projectConfig.use,
    ...options,
  };

  const browser = await chromium.launch(launchOptions);

  // Create context with default settings
  const context = await browser.newContext({
  });

  // Set default timeouts on context
  context.setDefaultTimeout(playwrightConfig.use.actionTimeout);
  context.setDefaultNavigationTimeout(playwrightConfig.use.navigationTimeout);
  
  return { browser, context };
}

// Helper function to save trace
// Note: Tracing is automatically handled by Playwright when trace: "on" is set in config
// Traces are automatically saved to test-results/ directory after test completion
async function saveTrace(context, testName) {
  if (playwrightConfig.use.trace === "on") {
    console.log(`Trace will be automatically saved to test-results/ directory for test: ${testName}`);
    return "trace-auto-saved";
  }
}

// Configure expect timeout globally
if (playwrightConfig.expect?.timeout) {
  expect.configure({ timeout: playwrightConfig.expect.timeout });
}



export { assert, expect, test, getInbox, launch, dotenv, saveTrace, axios, crypto, dateFns, faker, fse, https, twilio, formatInTimeZone };