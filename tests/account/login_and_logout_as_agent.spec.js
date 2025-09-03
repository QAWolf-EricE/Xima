import { buildUrl } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("login_and_logout_as_agent", async () => {
 // Step 1. Login as an Agent
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  // Constants
  const agentName = `Xima Agent 10`;
  const username = process.env.UC_AGENT_10_EXT_110;
  const password = process.env.UC_AGENT_10_EXT_110_PASSWORD;
  
  // Launch new browser and create a context
  const { context } = await launch();
  
  // Create a new page
  const page = await context.newPage();
  
  // Navigate to the login page
  await page.goto(buildUrl("/"));
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  // Fill in "Username" input field
  await page
    .locator(`[data-cy="consolidated-login-username-input"]`)
    .fill(username);
  
  // Fill in "Password" input field
  await page
    .locator('[data-cy="consolidated-login-password-input"]')
    .fill(password);
  
  // Click the "Login" button
  await page.locator('[data-cy="consolidated-login-login-button"]').click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  // Assert that the page URL contains "/ccagent"
  await expect(page).toHaveURL(/\/ccagent/);
  
  // Assert the page has the agent's name in the top left
  await expect(page.getByText(agentName)).toBeVisible();
  
  // Assert the page has text "Channel States"
  await expect(page.getByText(`Channel States`)).toBeVisible();
  
  // Assert the page has text "Active Media"
  await expect(page.getByText(`Active Media`)).toBeVisible();
  
 // Step 2. Logout as Agent
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  // Click the kebab button in the top left to open the status menu
  await page.locator('[data-cy="agent-status-menu-button"]').click();
  
  // Click the "Logout" menu option
  await page.locator('[data-cy="agent-status-logout-link"]').click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  // Assert the company logo is visible
  await expect(page.locator(`[alt="company-logo"]`)).toBeVisible();
  
  // Assert "Login" input field is visible
  await expect(
    page.locator(`[data-cy="consolidated-login-username-input"]`),
  ).toBeVisible();
  
  // Assert "Login" input field to no longer display our username
  await expect(
    page.locator(`[data-cy="consolidated-login-username-input"]`),
  ).not.toHaveValue(username);
  
  // Assert "Password" input field is visible
  await expect(
    page.locator(`[data-cy="consolidated-login-password-input"]`),
  ).toBeVisible();
  
  // Assert "Password" input field to no longer display our password
  await expect(
    page.locator(`[data-cy="consolidated-login-password-input"]`),
  ).not.toHaveValue(password);
  
  // Assert "Login" button is visible
  await expect(
    page.locator(`[data-cy="consolidated-login-login-button"]`),
  ).toBeVisible();
  
  // Assert "Login" button is disabled
  await expect(
    page.locator(`[data-cy="consolidated-login-login-button"]`),
  ).toBeDisabled();
  
});