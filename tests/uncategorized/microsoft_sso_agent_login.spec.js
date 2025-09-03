import { assert, expect, test, getInbox, launch, dotenv, saveTrace, axios, crypto, dateFns, faker, fse, https, twilio, formatInTimeZone } from '../../qawHelpers';

test("microsoft_sso_agent_login", async () => {
 // Step 1. Microsoft SSO Agent Login
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  // Constants
  const url = "https://vpnbackup.chronicallcloud-staging.com";
  const email = "QAWLoginTest@XimaSoftwareTest.onmicrosoft.com";
  const password = "5GQzUQcV3Gaj6L$k";
  const username = "QAWolf SSOLoginTest";
  const { context } = await launch();
  const page = await context.newPage();
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  // Go to login page
  await page.goto(url);
  
  const [newPage] = await Promise.all([
    // Wait for new tab event
    page.waitForEvent("popup"),
    // Click the "Sign in with Microsoft" button
    page.locator(`#microsoft-login-btn`).click(),
  ]);
  
  // Fill email into "Enter your email or phone" textbox
  await newPage
    .getByRole(`textbox`, { name: `Enter your email or phone` })
    .fill(email);
  
  // Click the "Next" button
  await newPage.locator(`[data-report-event="Signin_Submit"]`).click();
  
  // Fill password into "Password" textbox
  await newPage.getByRole(`textbox`, { name: `Password` }).fill(password);
  
  // Click the "Sign in" button
  await newPage.locator(`[data-report-event="Signin_Submit"]`).click();
  
  // Click the "No" button
  await newPage.locator(`[id="idBtn_Back"]`).click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  // Assert our username is visible in the top left of the screen
  await expect(
    page.locator(`app-agent-status-container`).getByText(username),
  ).toBeVisible();
  
  // Assert the "Channel States" section is visible
  await expect(page.getByText(`Channel States`)).toBeVisible();
  
  // Assert the "Active Media" section is visible
  await expect(page.getByText(`Active Media`)).toBeVisible();
  
  // Click the kebab icon in the top left of the page
  await page.locator(`app-agent-status`).getByRole(`button`).click();
  
  // Assert a menu appears
  await expect(page.locator(`[role="menu"]`)).toBeVisible();
  
  // Click the "Logout" menuitem
  await page.getByRole(`menuitem`, { name: `Logout` }).click();
  
  // Assert the "Sign in with Microsoft" button is visible
  await expect(page.locator(`#microsoft-login-btn`)).toBeVisible();
  
  // Assert the "company-logo" img is visible
  await expect(page.getByRole(`img`, { name: `company-logo` })).toBeVisible();
  
  // Assert our username is no longer visible
  await expect(page.getByText(username)).not.toBeVisible();
  
  // Assert the "Login" button is disabled by default
  await expect(page.getByRole(`button`, { name: `Login` })).toBeDisabled();
  
});