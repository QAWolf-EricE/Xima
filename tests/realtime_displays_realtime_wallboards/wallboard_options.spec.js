import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("wallboard_options", async () => {
 // Step 1. Open wallboard in preview view
  // login
  const { page } = await logInSupervisor();
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports"
  );
  
  // navigate to realtime wallboards
  await page.hover('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]');
  await page.click(':text("Realtime Wallboards")');
  await expect(page.locator("text=New Wallboard")).toBeVisible({
    timeout: 60000,
  }); // ensure page loads
  await expect(page.locator(
  `[data-cy="realtime-wallboards-item"]`).first()).toBeVisible({ timeout: 60 * 1000 });
  
  // click open wallboard
  await page.click(".wallboard-footer button >> nth=0");
  await page.click('button:has-text("Open")');
  
  // assert wallboard opens in preview view
  await expect(page).toHaveURL(/wallboard-preview/);
  await expect(page.locator('button:has-text("Full Screen")')).toBeVisible();
  await page.click(".feather-arrow-left");
  
  // click edit wallboard
  await page.waitForTimeout(5000);
  await page.click(".wallboard-footer button >> nth=0");
  await page.click('button:has-text("Edit")');
  
  // assert wallboard opens in edit view
  await expect(page).toHaveURL(/wallboard/);
  await expect(page.locator('button:has-text("Save and Exit")')).toBeVisible();
  await expect(page.locator('[placeholder="Search Widgets"]')).toBeVisible();
  await page.click(".feather-arrow-left");
  
  // click duplicate wallboard
  await page.waitForTimeout(5000);
  await page.click(".wallboard-footer button >> nth=0");
  await page.click(':text("Duplicate")');
  
  const duplicateName = faker.random.words(3);
  await page.fill('[data-cy="app-prompt-input"]', duplicateName);
  await page.click('button:has-text("Submit")');
  
  // assert wallboard with duplicate name is visible
  await page.locator(`[placeholder="Type to Search"]`).fill(duplicateName);
  await expect(
    page.locator(`.wallboard-footer:has-text("${duplicateName}")`)
  ).toBeVisible();
  
  // delete duplicate wallboard
  await page.click(`.wallboard-footer:has-text("${duplicateName}") button`);
  await page.click('button:has-text("Delete")');
  await page.locator('[data-cy="confirmation-dialog-okay-button"]').click();
  
  // assert duplicate wallboard is no longer visible
  await expect(
    page.locator(`.wallboard-footer:has-text("${duplicateName}")`)
  ).not.toBeVisible();
  
  // click share wallboard
  await page.locator(`[placeholder="Type to Search"]`).fill(``);
  await page.click(".wallboard-footer button >> nth=0");
  await page.click('button:has-text("Share")');
  
  // assert can select roles to share with
  try {
    await expect(page.locator(".all input")).toBeChecked();
  } catch {
    await page.click(".all");
  }
  
  const optionCount = await page.locator("mat-list-option").count();
  for (let i = 0; i < optionCount; i++) {
    let currOption = page.locator("mat-list-option").nth(i);
    await expect(currOption).toHaveAttribute("aria-selected", "true");
  }
  await page.click(".feather-x");
  
  // click export wallboard
  await page.click(".wallboard-footer button >> nth=0");
  const [fileDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.click('button:has-text("Export")'),
  ]);
  
  // assert file is downnloaded
  expect(
    fileDownload._suggestedFilename.includes("-exported-wallboard.json")
  ).toBe(true);
 // Step 2. Open wallboard in edit view
  // Description:
 // Step 3. Duplicate wallboard
  // Description:
 // Step 4. Delete duplicate wallboard
  // Description:
 // Step 5. Share wallboard
  // Description:
 // Step 6. Export Wallboard
  // Description:
});