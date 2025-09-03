import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("create_new_wallboard_calls_and_web_chats", async () => {
 // Step 1. Create Calls and WebChats wallboard
  // login
  const { page } = await logInSupervisor();
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports"
  );
  
  // navigate to realtime wallboards
  await page.hover('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]');
  await page.click(':text("Realtime Wallboards")');
  await expect(page.locator('button:has-text("New Wallboard")')).toBeVisible({
    timeout: 60000,
  }); // ensure page loads
  await expect(page.locator('[data-cy="realtime-wallboards-item"]').first()).toBeVisible();
  
  // Clean up wallboard
  const wallboardName = "QA Wallboard " + Date.now().toString().slice(-4);
  await cleanUpWallBoardsNotStrict(page, wallboardName);
  
  // create WebChats wallboard
  await page.click('button:has-text("New Wallboard")');
  await page.click(':text-is("Calls and WebChats")');
  
  // fill template configuratijon modal
  await expect(page.locator("text=Template Configuration")).toBeVisible({
    timeout: 60000,
  });
  await page.click(".form-field");
  await page.fill('[aria-required="true"]', wallboardName);
  
  // assign skills
  await page.click(
    '[data-cy="configure-report-preview-parameter-GROUPS"] button'
  );
  await page.click('[data-cy="checkbox-tree-property-option"]:has-text("Skill 5") ');
  await page.click('button:has-text("Apply")');
  await page.waitForTimeout(1000);
  await page.click(':text("Continue")');
  
  // preview wallboard
  await page.click('[data-mat-icon-name="more-v1"]');
  await page.click(':text("Go to Preview")');
  
  // assert title of wallboard is correct
  await expect(page.locator(`text=${wallboardName}`).first()).toBeVisible();
  
  // assert board shows up correctly
  await expect(
    page.locator('gridster-item :text("Calls in Queue")').first()
  ).toBeVisible();
  await expect(
    page.locator('gridster-item :text("Queue Max Duration")')
  ).toBeVisible();
  await expect(
    page.locator('gridster-item :text("Abandoned Calls")')
  ).toBeVisible();
  await expect(page.locator('gridster-item :text("Missed Calls")')).toBeVisible();
  await expect(page.locator('gridster-item :text("Active Calls")')).toBeVisible();
  await expect(page.locator('gridster-item :text("Presented")')).toHaveCount(2);
  await expect(page.locator('gridster-item :text("Answered")')).toHaveCount(2);
  
  // back to wallboard dashboard
  await page.click('[data-cy="realtime-wallboard-preview-back-btn"]');
  await expect(page.locator('button:has-text("New Wallboard")')).toBeVisible({
    timeout: 60000,
  }); // ensure page loads
  await expect(page.locator(`text=${wallboardName}`)).toHaveCount(2);
  
  // search wallboard to ensure we don't delete wrong board
  await page.fill('[placeholder="Type to Search"]', wallboardName);
  await page.keyboard.press("Enter");
  
  // Delete Wallboard
  await page.click(
    `[data-cy="realtime-wallboards-item-menu-button"]:right-of(:text('${wallboardName}'))`
  );
  await page.click('[data-cy="realtime-wallboards-item-delete"]');
  await page.click('[data-cy="confirmation-dialog-okay-button"]');
  await expect(page.locator("mat-card")).toBeHidden();
  await page.reload(); // ensure deletion presists
  await expect(page.locator("text=New Wallboard")).toBeVisible({
    timeout: 60000,
  }); // ensure page loads
  await expect(page.locator(`text=${wallboardName}`)).toHaveCount(0);
  await cleanUpWallBoardsNotStrict(page, wallboardName);
 // Step 2. Preview Calls and WebChats wallboard
  
 // Step 3. Delete Calls and WebChats wallboard
  
});