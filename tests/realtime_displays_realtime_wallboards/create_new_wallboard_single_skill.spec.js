import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("create_new_wallboard_single_skill", async () => {
 // Step 1. Create Single Skill wallboard
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Consts
  const wallboardName = "Create Single Skill Wallboard";
  
  // Login
  const { page } = await logInSupervisor();
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports"
  );
  
  // Navigate to realtime wallboards
  await page.locator('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]').hover();
  await page.locator(':text("Realtime Wallboards")').click();
  
  // Soft assert on realtime wallboards page
  await expect(page.locator('button:has-text("New Wallboard")')).toBeVisible();
  await expect(
    page.locator('[data-cy="realtime-wallboards-item"]').first()
  ).toBeVisible();
  
  // Cleanup wallboards
  await cleanUpWallBoardsNotStrict(page, wallboardName);
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Create new single skill type wallboard
  await page.locator(':text("New Wallboard")').click();
  await page.locator(
    'app-wallboard-select-template-tiles-item:has-text("Single Skill")'
  ).scrollIntoViewIfNeeded();
  await page.locator(
    'app-wallboard-select-template-tiles-item:has-text("Single Skill")'
  ).click();
  
  // Fill 'template configuration' modal
  await page.locator(`.xima-dialog-header:text-is("Template Configuration")`).waitFor();
  await page.locator('[formcontrolname="title"]').fill(wallboardName);
  await page.locator('[data-mat-icon-name="edit"] >> nth=0').click();
  await page.locator('[data-cy="checkbox-tree-property-select-all"]').click();
  await page.locator('button:has-text("Apply")').click();
  await page.locator('[data-mat-icon-name="edit"] >> nth=1').click();
  await page.locator('[data-cy="xima-list-select-select-all"]').click();
  await page.locator('button:has-text("Apply")').click();
  await expect(page.getByRole(`button`, { name: `Continue` })).toBeEnabled();
  await page.getByRole(`button`, { name: `Continue` }).click();
  
  // Navigate to wallboard preview
  await page.locator('[aria-haspopup="menu"] [role="img"]:visible').click();
  await page.getByRole(`menuitem`, { name: `Go to Preview` }).click({ timeout: 8 * 60 * 1000 });
  
  // Assert able to preview wallboard
  await expect(
    page.locator('.text-base:has-text("Agent Leaderboard")')
  ).toBeVisible();
  await expect(page.locator('.text-base:has-text("Logged In")')).toBeVisible();
  await expect(
    page.locator('.text-base:has-text("Avg Call Waiting")')
  ).toBeVisible();
  await expect(
    page.locator('.text-base:has-text("Presented Call Count")')
  ).toBeVisible();
  
  // Save wallboard
  await expect(page.locator('[aria-haspopup="menu"] [role="img"]:visible')).toBeVisible();
  await page.waitForTimeout(2000)
  await page.locator('[aria-haspopup="menu"] [role="img"]:visible').click();
  await page.getByRole(`menuitem`, { name: `Edit Wallboard` }).click();
  await expect(page.getByRole(`button`, { name: `Save and Exit` })).toBeEnabled();
  await page.getByRole(`button`, { name: `Save and Exit` }).click({ timeout: 8 * 60 * 1000 });
  
  //--------------------------------
  // Cleanup:
  //--------------------------------
  // Cleanup wallboard
  await cleanUpWallBoardsNotStrict(page, wallboardName);
  
});