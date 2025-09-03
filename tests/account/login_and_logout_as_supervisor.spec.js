import { assert, expect, test, getInbox, launch, dotenv, saveTrace, axios, crypto, dateFns, faker, fse, https, twilio, formatInTimeZone } from '../../qawHelpers';

test("login_and_logout_as_supervisor", async () => {
 // Step 1. Login as a Supervisor
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  // Constants
  const username = process.env.SUPERVISOR_USERNAME;
  const password = process.env.SUPERVISOR_PASSWORD;
  
  // Launch web browser
  const { context } = await launch();
  
  // Create a new page
  const page = await context.newPage();
  
  // Go to the login URL
  await page.goto(process.env.DEFAULT_URL);
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  // Fill in "Username" input field
  await page
    .locator(`[data-cy="consolidated-login-username-input"]`)
    .fill(username);
  
  // Fill in "Password" input field
  await page
    .locator(`[data-cy="consolidated-login-password-input"]`)
    .fill(password);
  
  // Click the "Login" button
  await page.locator(`[data-cy="consolidated-login-login-button"]`).click();
  
  // Store "User Menu" locator
  const userMenu = page.locator(`xima-user-menu`);
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  // Assert "User Menu" is visible
  await expect(userMenu).toBeVisible();
  
  // Assert "SA" initials is within the "User Menu" and is visible
  await expect(userMenu.getByText(`SA`, { exact: true })).toBeVisible();
  
  // Assert "Cradle to Grave" tab is visible
  await expect(
    page.locator(
      `[data-cy="reports-c2g-component-tab-ctog"]:has-text("Cradle to Grave")`,
    ),
  ).toBeVisible();
  
 // Step 2. Logout as Supervisor
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Hover dropdown next to avatar
  await page.locator(`xima-user-menu`).getByRole(`button`).waitFor();
  await page.locator(`xima-user-menu`).getByRole(`button`).hover();
  
  // Click the "Logout" menu option
  await page
    .locator(`[data-cy="home-component-menu-option-logout-button"]`)
    .click();
  
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