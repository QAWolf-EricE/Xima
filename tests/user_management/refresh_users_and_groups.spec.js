import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("refresh_users_and_groups", async () => {
 // Step 1. Refresh users and groups
  // login
  const { page } = await logInSupervisor();
  
  // hover over user management
  await page.waitForTimeout(5000)
  await page.hover('[data-cy="sidenav-menu-USER_MANAGEMENT"]', {timeout: 5000});
  
  // click the Refresh Users and Groups
  await page.waitForTimeout(5000)
  try {
    await page.click(':text("Sync UC Users")');
  } catch {
    await page.getByRole(`button`, { name: `Refresh Directory` }).click();
  }
  
  // assert spinner will be visible
  await expect(page.locator("mat-progress-bar")).toBeVisible();
  
  // assert that the spinner disappears
  await expect(page.locator("mat-progress-bar")).not.toBeVisible({
    timeout: 18000,
  });
  
  // assert that the refresh modal pops up
  await expect(
    page.locator(':text("Refresh page to update Users and Groups")')
  ).toBeVisible();
  
  // Click the refresh button in the modal and assert modal is gone
  await page.click("button:has-text('Refresh')");
  
  // await page.getByRole("button", {name: "Refresh"}).click();
  await expect(
    page.locator(':text("Refresh page to update Users and Groups")')
  ).not.toBeVisible();
});