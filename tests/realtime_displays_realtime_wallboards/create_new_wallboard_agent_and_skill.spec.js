import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("create_new_wallboard_agent_and_skill", async () => {
 // Step 1. Create Agent and Skill wallboard
  // login
  const { page } = await logInSupervisor();
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports"
  );
  
  // navigate to realtime wallboards
  await page.hover('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]');
  await page.click(':text("Realtime Wallboards")');
  
  // assert on realtime wallboards page
  await expect(page.locator('button:has-text("New Wallboard")')).toBeVisible();
  await expect(page.locator('[data-cy="realtime-wallboards-item"]').first()).toBeVisible();
  
  const wallboardName = "Create Agent and Skill Wallboard";
  await cleanUpWallBoardsNotStrict(page, wallboardName)
  
  // delete wallboard if it exists
  await page.fill('[placeholder="Type to Search"]', wallboardName);
  await page.keyboard.press("Enter");
  let attempts = 0;
  while (
    (await page
      .locator(`.wallboard-card:has-text("${wallboardName}")`)
      .count()) &&
    attempts < 10
  ) {
    await page.click(
      `.wallboard-card:has-text("${wallboardName}") [data-cy="realtime-wallboards-item-menu-button"]`
    );
    await page.click('[role="menuitem"]:has-text("Delete")');
    await page.locator('[data-cy="confirmation-dialog-okay-button"]').click();
    await page.waitForTimeout(2000);
    attempts++;
  }
  
  // create new Agent and Skill type wallboard
  await page.click(':text("New Wallboard")');
  await page.waitForTimeout(1000);
  await page.click(':text("Agent and Skill")');
  
  // fill 'template configuration' modal
  
  const configModal = page.getByText("Template Configuration");
  await configModal.waitFor();
  
  await page.locator('[formcontrolname="title"]').fill(wallboardName);
  await page.locator('[data-mat-icon-name="edit"] >> nth=0').click();
  for (let i = 0; i < 10; i++) {
      await page.locator(`[data-cy="xima-list-select-option"] >> nth=${i}`).click();
  }
  await page.getByRole(`button`, { name: `Apply` }).click();
  await page.locator('[data-mat-icon-name="edit"] >> nth=1').click();
  for (let i = 0; i < 10; i++) {
      await page.locator(`[data-cy="checkbox-tree-property-option"] >> nth=${i}`).click();
  }
  await page.getByRole(`button`, { name: `Apply` }).click();
  await page.waitForTimeout(1000);
  await page.getByRole(`button`, { name: `Continue` }).click();
  
  // Small pause for page to load
  await page.waitForTimeout(2000);
  
  // navigate to wallboard preview
  await page.locator('mat-toolbar [aria-haspopup="menu"]').waitFor();
  await page.locator('mat-toolbar [aria-haspopup="menu"]').click();
  await page.getByRole(`menuitem`, { name: `Go to Preview` }).click({ timeout: 90 * 1000 });
  await page.waitForNavigation();
  
  // assert able to preview wallboard
  await expect(page.locator(`h3:has-text("${wallboardName}")`)).toBeVisible();
  await expect(page.locator('span:has-text("Agent Leaderboard")')).toBeVisible();
  await page.waitForTimeout(1000);
  let rowCount = await page.locator(".mat-column-ROW_TITLE").count();
  for (let i = 1; i < rowCount; i++) {
    let currRow = page.locator(".mat-column-ROW_TITLE").nth(i);
    await expect(currRow).not.toBeEmpty();
  }
  
  // save wallboard
  await page.locator('[aria-haspopup="menu"]:visible').click();
  await page.click('button:has-text("Edit Wallboard")');
  await page.waitForTimeout(1000);
  await page.locator('button:has-text("Save and Exit")').click({ timeout: 90 * 1000 });
  
  // delete wallboard
  await page.fill('[placeholder="Type to Search"]', wallboardName);
  await page.keyboard.press("Enter");
  await page.click(
    `.wallboard-card:has-text("${wallboardName}") [data-cy="realtime-wallboards-item-menu-button"]`
  );
  await page.click('[role="menuitem"]:has-text("Delete")');
  await page.locator('[data-cy="confirmation-dialog-okay-button"]').click();
  
  await cleanUpWallBoardsNotStrict(page, wallboardName);
 // Step 2. Preview agent and skill wallboard
  
 // Step 3. Delete Agent and Skill wallboard
  
});