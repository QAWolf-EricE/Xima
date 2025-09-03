import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("create_new_wallboard_sla", async () => {
 // Step 1. Create SLA wallboard
  // REQ01 Login as Supervisor
  const { page } = await logInSupervisor();
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports"
  );
  
  // REQ71 Navigate to Real Time Wallboards
  await page.hover('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]');
  await page.click(':text("Realtime Wallboards")');
  
  // assert on realtime wallboards page
  await expect(page.locator('button:has-text("New Wallboard")')).toBeVisible();
  await expect(page.locator('[data-cy="realtime-wallboards-item"]').first()).toBeVisible();
  
  const wallboardName = "Create new wallboard: SLA";
  
  // delete wallboard if it exists
  try {
    await page.fill('[placeholder="Type to Search"]', wallboardName);
    await page.keyboard.press("Enter");
    await expect(
      page.locator(`.wallboard-card:has-text("${wallboardName}")`)
    ).not.toBeVisible();
  } catch {
    await page.click(
      `.wallboard-card:has-text("${wallboardName}") [data-cy*="menu-button"]`
    );
    await page.click('[role="menuitem"]:has-text("Delete")');
    await page.locator('[data-cy="confirmation-dialog-okay-button"]').click();
  }
  await page.fill('[placeholder="Type to Search"]', "");
  
  // REQ72 Click new Wallboard
  await page.click(':text("New Wallboard")');
  
  // REQ95 Click SLA wallboard option
  await page.waitForTimeout(1000);
  await page.click('app-wallboard-select-template-tiles-item:has-text("SLA") >> nth=0');
  
  // REQ93 Able to fill 'template configuration' modal
  const configModal = page.getByText("Template Configuration");
  await configModal.waitFor();
  await page.fill('[formcontrolname="title"]', wallboardName);
  await page.click('[data-mat-icon-name="edit"] >> nth=0');
  await page.waitForTimeout(1000);
  await page.click('[data-cy="xima-list-select-select-all"]');
  await page.click('button:has-text("Apply")');
  await page.click('[data-mat-icon-name="edit"] >> nth=1');
  await page.waitForTimeout(1000);
  await page.click('[data-cy="checkbox-tree-property-select-all"]');
  await page.click('button:has-text("Apply")');
  await page.waitForTimeout(1000);
  await page.click('button:has-text("Continue")');
  
  // REQ82 Able to preview wallboard
  await page.locator('mat-toolbar [aria-haspopup="menu"] [role="img"]:visible').click();
  await page.locator('button:has-text("Go to preview")').click({ timeout: 4 * 60 * 1000 });
  await page.waitForNavigation();
  
  await expect(page.locator(`h3:has-text("${wallboardName}")`)).toBeVisible();
  
  await expect(
    page.locator('.text-base:has-text("Avg Queue Time")')
  ).toBeVisible();
  await expect(
    page.locator('.text-base:has-text("Agent Answered Calls")')
  ).toBeVisible();
  await expect(
    page.locator('.text-base:has-text("Current Queued Calls")')
  ).toBeVisible();
  await expect(
    page.locator('.text-base:has-text("Max Wait Time")')
  ).toBeVisible();
  await expect(
    page.locator('.text-base:has-text("Avg Wait Time")')
  ).toBeVisible();
  
  await expect(page.locator('span:has-text("Login Count")')).toBeVisible();
  await expect(
    page.locator('span:has-text("Queued Calls")').first()
  ).toBeVisible();
  await expect(page.locator('span:has-text("Max Queue Duration")')).toBeVisible();
  await expect(
    page.locator('span:has-text("Average Queue Duration")')
  ).toBeVisible();
  
  // REQ83 Able to Save wallboard
  await page.locator('[aria-haspopup="menu"] [role="img"]:visible').click();
  await page.click('button:has-text("Edit Wallboard")');
  await page.waitForTimeout(1000);
  await page.locator('button:has-text("Save and Exit")').click({ timeout: 4 * 60 * 1000 });
  
  // REQ84 Delete Wallboard
  await page.fill('[placeholder="Type to Search"]', wallboardName);
  await page.keyboard.press("Enter");
  await page.click(
    `.wallboard-card:has-text("${wallboardName}") [data-cy="realtime-wallboards-item-menu-button"]`
  );
  await page.click('[role="menuitem"]:has-text("Delete")');
  await page.locator('[data-cy="confirmation-dialog-okay-button"]').click();
 // Step 2. Preview SLA wallboard
  
 // Step 3. Delete SLA wallboard
  
});