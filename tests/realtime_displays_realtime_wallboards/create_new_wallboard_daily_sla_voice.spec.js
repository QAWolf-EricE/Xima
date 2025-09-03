import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("create_new_wallboard_daily_sla_voice", async () => {
 // Step 1. Create Daily SLA Voice wallboard
  //----------------------
  // Arrange:
  //----------------------
  // Consts
  const wallboardPrefix = `Create Daily SLA Voice Wallboard`;
  const wallboardName = `${wallboardPrefix} ` + Date.now().toString().slice(-4);
  
  // Login
  const { page } = await logInSupervisor();
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports",
  );
  
  // Navigate to realtime wallboards
  await page.locator('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]').hover();
  await page.locator(':text("Realtime Wallboards")').click();
  
  // Ensure page loads
  await expect(page.locator(`button:has-text("New Wallboard")`)).toBeVisible({
    timeout: 60000,
  });
  await expect(
    page.locator('[data-cy="realtime-wallboards-item"]').first(),
  ).toBeVisible();
  
  // Clean test if needed
  await page.locator('[placeholder="Type to Search"]').fill(wallboardPrefix);
  await page.keyboard.press("Enter");
  
  // Wait for search results to load
  await page.waitForTimeout(5000);
  
  // Cleanup existing wallboards
  while (await page.locator(`:text("${wallboardPrefix}")`).count()) {
    await page
      .locator(
        `[data-cy="realtime-wallboards-item-menu-button"]:right-of(:text("${wallboardPrefix}")) >> nth=0`,
      )
      .click();
    await page.locator('[data-cy="realtime-wallboards-item-delete"]').click();
    await page.locator('[data-cy="confirmation-dialog-okay-button"]').click();
    await page.waitForTimeout(5000);
  }
  //----------------------
  // Act:
  //----------------------
  // Create new Daily SLA Voice type wallboard
  await page.locator(`button:has-text("New Wallboard")`).click();
  await page.locator('app-wallboard-select-template-tiles-item:has-text("Daily SLA Voice")').click();
  
  // Wait for configuration modal to appear
  const configModal = page.locator(`xima-dialog:has(xima-dialog-header:text("Template Configuration"))`);
  await expect(configModal).toBeVisible({timeout: 60000});
  
  // Fill 'template configuration' title
  await configModal.locator('[formcontrolname="title"]').fill(wallboardName);
  
  // Add Skills
  await configModal
    .locator(
      'mat-label:has-text("Skill") ~ app-configure-report-preview-parameter [data-cy="xima-preview-input-edit-button"]',
    )
    .click();
  for (let i = 0; i < 10; i++) {
      await page.locator(`[data-cy="checkbox-tree-property-option"]>> nth=${i}`).click();
  }
  await page.locator('button:has-text("Apply")').click();
  await expect(page.locator('button:has-text("Apply")')).not.toBeVisible();
  
  // Add Agents
  await configModal
    .locator(
      'mat-label:has-text("Agents") ~ app-configure-report-preview-parameter [data-cy="xima-preview-input-edit-button"]',
    )
    .click();
  for (let i = 0; i < 10; i++) {
      await page.locator(`[data-cy="xima-list-select-option"] >> nth=${i}`).click();
  }
  await page.locator('button:has-text("Apply")').click();
  await expect(page.locator('button:has-text("Apply")')).not.toBeVisible();
  
  // Click Continue
  await page.locator(':text("Continue")').click();
  
  // Navigate to wallboard preview
  await page.locator('mat-toolbar [aria-haspopup="menu"] [role="img"]:visible').click();
  await page.locator(':text("Go to Preview")').click({ timeout: 90 * 1000 });
  
  //----------------------
  // Assert:
  //----------------------
  // Assert title of wallboard is correct
  await expect(
    page.getByRole(`heading`, { name: `${wallboardName}` }),
  ).toBeVisible();
  
  // Assert able to preview wallboard
  await expect(page.locator(`h3:has-text("${wallboardName}")`)).toBeVisible();
  await expect(page.locator('span:has-text("Agent Leaderboard")')).toBeVisible();
  await page.waitForTimeout(1000);
  let rowCount = await page.locator(".mat-column-ROW_TITLE").count();
  for (let i = 1; i < rowCount; i++) {
    let currRow = page.locator(".mat-column-ROW_TITLE").nth(i);
    await expect(currRow).not.toBeEmpty();
  }
  
  //----------------------
  // Cleanup:
  //----------------------
  // Save wallboard
  await page.locator('[aria-haspopup="menu"]:visible').click();
  await page.locator('button:has-text("Edit Wallboard")').click();
  await expect(page.locator('button:has-text("Save and Exit")')).toBeVisible();
  await page.locator('button:has-text("Save and Exit")').click({ timeout: 90 * 1000 });
  
  // Delete wallboard
  await page.locator('[placeholder="Type to Search"]').fill(wallboardPrefix);
  await page.keyboard.press("Enter");
  await expect(
    page.locator(
      `[data-cy="realtime-wallboards-item"]:has([data-cy="realtime-wallboards-item-title"]:text("${wallboardName}"))`,
    ),
  ).toBeVisible();
  
  // Click the kebab menu
  await page
    .locator(
      `[data-cy="realtime-wallboards-item"]:has([data-cy="realtime-wallboards-item-title"]:text("${wallboardName}")) button`,
    )
    .click();
  
  // Click the Delete option
  await page.getByRole(`menuitem`, { name: `Delete` }).click();
  
  // Click Confirm in the delete modal
  await page.locator('[data-cy="confirmation-dialog-okay-button"]').click();
  
  // Verify Wallboard card disappears
  await expect(
    page.locator(
      `[data-cy="realtime-wallboards-item"]:has([data-cy="realtime-wallboards-item-title"]:text("${wallboardName}"))`,
    ),
  ).not.toBeVisible();
});