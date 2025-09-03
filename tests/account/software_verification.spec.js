import { buildUrl } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("software_verification", async () => {
 // Step 1. View Software Version
  // go to page
  const { browser, context } = await launch();
  const page = await context.newPage();
  await page.goto(buildUrl("/"));
  
  // REQ Login As Supervisor
  await page.fill(
    '[data-cy="consolidated-login-username-input"]',
    process.env.SUPERVISOR_USERNAME,
  );
  await page.fill(
    '[data-cy="consolidated-login-password-input"]',
    process.env.SUPERVISOR_PASSWORD,
  );
  await page.click('[data-cy="consolidated-login-login-button"]');
  
  // Wait for page to load
  await page.locator(`mat-row`).first().waitFor();
  
  // REQ View Software Version
  
  // Hover over the user menu
  await page.locator(`xima-user-menu`).getByRole(`button`).hover();
  
  // Click the "About" button
  await page.getByRole(`button`, { name: `About` }).click();
  
  const version = await page.innerText('[data-cy="about-ccaas-version"]');
  await expect(page.locator('[data-cy="about-ccaas-version"]')).toHaveText(
    `${version}`,
  );
  console.log("XIMA CURRENT VERSION " + version);
  
});