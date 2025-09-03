import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("create_new_wallboard_4_skills_wallboard", async () => {
 // Step 1. Create 4 skills wallboard
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
  await expect(
    page.locator('[data-cy="realtime-wallboards-item"]').first()
  ).toBeVisible();
  
  const wallboardName = "Create 4 skills Wallboard";
  
  // delete wallboard if it exists
  await page.waitForTimeout(5000);
  await page.fill('[placeholder="Type to Search"]', wallboardName);
  await page.keyboard.press("Enter");
  let attempts = 0;
  while (
    (await page
      .locator(`.wallboard-card:has-text("${wallboardName}")`)
      .count()) &&
    attempts < 10
  ) {
    let currentCount = await page
      .locator(`.wallboard-card:has-text("${wallboardName}")`)
      .count();
    await page.click(
      `.wallboard-card:has-text("${wallboardName}") [data-cy="realtime-wallboards-item-menu-button"] >> nth=0`
    );
    await page.waitForTimeout(1000);
    await page.click('[role="menuitem"]:has-text("Delete")');
    await page.waitForTimeout(1000);
    await page.locator('[data-cy="confirmation-dialog-okay-button"]').click();
    await page.waitForTimeout(5000);
    expect(
      await page.locator(`.wallboard-card:has-text("${wallboardName}")`).count()
    ).toEqual(currentCount - 1);
    attempts++;
  }
  
  // create new 4 skills type wallboard
  await page.click(':text("New Wallboard")');
  await page.waitForTimeout(1000);
  await page.click(':text("4 Skills Wallboard")');
  
  // fill 'template configuration' modal [id*=mat-dialog-title]
  // await page.waitForSelector('.mat-dialog-title:has-text("Template Configuration")');
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
  await page.click('[data-mat-icon-name="edit"] >> nth=3');
  await page.click('[data-cy="checkbox-tree-property-select-all"]');
  await page.click('button:has-text("Apply")');
  await page.click('[data-mat-icon-name="edit"] >> nth=4');
  await page.click('[data-cy="checkbox-tree-property-select-all"]');
  await page.click('button:has-text("Apply")');
  await page.waitForTimeout(1000);
  await page.click('button:has-text("Continue")');
  
  // navigate to wallboard preview
  await page.click('[data-mat-icon-name="more-v1"]');
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
    page.locator('.text-line-section-text:has-text("Skill 3")')
  ).toBeVisible();
  await expect(
    page.locator('.text-line-section-text:has-text("Skill 4")')
  ).toBeVisible();
  await expect(
    page.locator('.text-line-section-text:has-text("Total Calls in Queue:")')
  ).toBeVisible();
  
  // save wallboard
  await page.click('[data-mat-icon-name="more-v1"]');
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
 // Step 2. Preview new wallboard
  // Description:
 // Step 3. Delete 4 skills wallboard
  // Description:
});