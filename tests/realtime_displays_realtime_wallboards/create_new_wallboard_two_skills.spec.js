import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("create_new_wallboard_two_skills", async () => {
 // Step 1. Create Two Skills wallboard
  // login
  const { page } = await logInSupervisor();
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports"
  );
  
  // navigate to realtime wallboards
  await page.hover('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]');
  await page.click(':text("Realtime Wallboards")');
  await page.waitForTimeout(3000);
  
  // assert on realtime wallboards page
  await expect(page.locator('button:has-text("New Wallboard")')).toBeVisible();
  await expect(page.locator('[data-cy="realtime-wallboards-item"]').first()).toBeVisible();
  
  const wallboardName = "Create Two Skill Wallboard";
  
  // delete wallboard if it exists
  await page.waitForTimeout(5000);
  while (await page.locator("text=Two Skill Wallboard").count()) {
    await page.click(
      `[data-cy="realtime-wallboards-item-menu-button"]:right-of(:text('Two Skill Wallboard'))`
    );
    await page.click('[data-cy="realtime-wallboards-item-delete"]');
    await page.click('[data-cy="confirmation-dialog-okay-button"]');
    await page.reload();
    await page.waitForTimeout(5000);
  }
  
  // create new two skill type wallboard
  await page.click(':text("New Wallboard")');
  await page.waitForTimeout(1000);
  await page.click('app-wallboard-select-template-tiles-item:has-text("Two Skills") >> nth=1');
  
  // fill 'template configuration' modal
  const configModal = page.getByText("Template Configuration");
  await configModal.waitFor();
  await page.fill('[formcontrolname="title"]', wallboardName);
  await page.click('[data-mat-icon-name="edit"] >> nth=0');
  await page.click('[data-cy="checkbox-tree-property-select-all"]');
  await page.click('button:has-text("Apply")');
  await page.click('[data-mat-icon-name="edit"] >> nth=1');
  await page.click('[data-cy="checkbox-tree-property-select-all"]');
  await page.click('button:has-text("Apply")');
  await page.click('[data-mat-icon-name="edit"] >> nth=2');
  await page.click('[data-cy="checkbox-tree-property-select-all"]');
  await page.click('button:has-text("Apply")');
  await page.waitForTimeout(1000);
  await page.click('button:has-text("Continue")');
  
  // navigate to wallboard preview
  await page.locator('[aria-haspopup="menu"] [role="img"]:visible').click();
  await page.click('button:has-text("Go to preview")');
  await page.waitForNavigation();
  
  // assert able to preview wallboard
  await expect(
    page.locator('.text-line-section-text:has-text("Skill 1")')
  ).toBeVisible();
  await expect(
    page.locator('.text-line-section-text:has-text("Skill 2")')
  ).toBeVisible();
  await expect(
    page.locator('.text-line-section-text:has-text("Total Calls in Queue:")')
  ).toBeVisible();
  await expect(
    page.locator('.text-line-section-text:has-text("Skills")')
  ).toBeVisible();
  
  // save wallboard
  await page.locator('[aria-haspopup="menu"] [role="img"]:visible').click();
  await page.click('button:has-text("Edit Wallboard")');
  await page.waitForTimeout(1000);
  await page.click('button:has-text("Save and Exit")');
  
  // delete wallboard
  await page.fill('[placeholder="Type to Search"]', wallboardName);
  await page.keyboard.press("Enter");
  await page.click(
    `.wallboard-card:has-text("${wallboardName}") [data-cy="realtime-wallboards-item-menu-button"]`
  );
  await page.click('[role="menuitem"]:has-text("Delete")');
  await page.locator('[data-cy="confirmation-dialog-okay-button"]').click();
  
  await cleanUpWallBoardsNotStrict(page, wallboardName);
 // Step 2. Preview Two Skills wallboard
  
 // Step 3. Delete Two Skills wallboard
  
});