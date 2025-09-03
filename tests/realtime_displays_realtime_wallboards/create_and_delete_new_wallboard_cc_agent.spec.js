import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("create_and_delete_new_wallboard_cc_agent", async () => {
 // Step 1. Create CC Agent wallboard
  //----------------------
  // Arrange:
  //----------------------
  // Consts
  const wallboardPrefix = `QA Wallboard`;
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
  // Create CC Agent Real wallboard
  await page.locator(`button:has-text("New Wallboard")`).click();
  await page.locator(':text("CC Agent")').click();
  
  // Fill template configuration modal
  await expect(
    page.locator(
      `xima-dialog:has(xima-dialog-header:text("Template Configuration"))`,
    ),
  ).toBeVisible({
    timeout: 60000,
  });
  
  // Fill out title
  await expect(
    page.locator(
      `mat-label:text("Title") ~ mat-form-field [aria-required="true"]`,
    ),
  ).toBeVisible();
  await page
    .locator(`mat-label:text("Title") ~ mat-form-field [aria-required="true"]`)
    .fill(wallboardName);
  
  // Assign agents
  await page
    .locator(
      'mat-label:has-text("CC Agent") ~ app-configure-report-preview-parameter [data-cy="xima-preview-input-edit-button"]',
    )
    .click();
  await page.locator('[data-cy="xima-list-select-select-all"]').click();
  await page.locator('button:has-text("Apply")').click();
  await expect(page.locator('button:has-text("Apply")')).not.toBeVisible();
  
  // Assign skills
  await page
    .locator(
      'mat-label:has-text("Skill 1") ~ app-configure-report-preview-parameter [data-cy="xima-preview-input-edit-button"]',
    )
    .click();
  await page
    .locator('[data-cy="checkbox-tree-property-option"] span:text-is("Skill 5")')
    .click();
  await page.locator('button:has-text("Apply")').click();
  await expect(page.locator('button:has-text("Apply")')).not.toBeVisible();
  
  // Assign second skills
  await page
    .locator(
      'mat-label:has-text("Skill 2") ~ app-configure-report-preview-parameter [data-cy="xima-preview-input-edit-button"]',
    )
    .click();
  await page
    .locator('[data-cy="checkbox-tree-property-option"] span:text-is("Skill 2")')
    .click();
  await page.locator('button:has-text("Apply")').click();
  await expect(page.locator('button:has-text("Apply")')).not.toBeVisible();
  
  // Click Continue
  await page.locator(':text("Continue")').click();
  
  // Preview wallboard
  await page.locator('[data-mat-icon-name="more-v1"]:visible').click();
  await page.locator(':text("Go to Preview")').click();
  //----------------------
  // Assert:
  //----------------------
  // Assert title of wallboard is correct
  await expect(
    page.getByRole(`heading`, { name: `${wallboardName}` }),
  ).toBeVisible();
  
  // Assert skill Calls and Chats
  await expect(
    page.locator('gridster-item :text("Calls")').first(),
  ).toBeVisible();
  await expect(page.locator('gridster-item :text("Chats")')).toBeVisible();
  await expect(page.locator(`:text("Calls in Queue")`)).toHaveCount(2);
  await expect(page.locator(`:text("Max Wait:")`)).toHaveCount(2);
  await expect(page.locator(`:text("Presented")`)).toHaveCount(2);
  await expect(page.locator(`:text("Answered")`)).toHaveCount(2);
  await expect(page.locator(`:text("Missed")`)).toHaveCount(2);
  
  // Assert DND and ACW states
  await expect(
    page.locator('app-widget-container:has-text("Total DND Today")'),
  ).toBeVisible();
  await expect(
    page.locator('app-widget-container:has-text("Total ACW Today")'),
  ).toBeVisible();
  await expect(
    page.locator('app-widget-container:has-text("Current DND")'),
  ).toBeVisible();
  await expect(
    page.locator('app-widget-container:has-text("Current ACW")'),
  ).toBeVisible();
  
 // Step 2. Delete CC Agent wallboard
  //----------------------
  // Arrange:
  //----------------------
  // Back to wallboard dashboard
  await page.locator('[data-cy="realtime-wallboard-preview-back-btn"]').click();
  
  // Ensure page loads
  await expect(page.locator(`button:has-text("New Wallboard")`)).toBeVisible({
    timeout: 60000,
  });
  
  // Wait for Wallboard to load
  await expect(
    page.locator(
      `[data-cy="realtime-wallboards-item"]:has([data-cy="realtime-wallboards-item-title"]:text("${wallboardName}"))`,
    ),
  ).toBeVisible();
  
  //----------------------
  // Act:
  //----------------------
  // Click the kebab menu under the created Wallboard
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
  
  // Reload the page
  await page.reload();
  
  // Wait for Wallboards to load
  await expect(
    page
      .locator(
        `[data-cy="realtime-wallboards-item"]:has([data-cy="realtime-wallboards-item-title"])`,
      )
      .first(),
  ).toBeVisible();
  
  // Search for wallboard
  await page.getByRole(`textbox`, { name: `Type to Search` }).fill(wallboardName);
  await page.keyboard.press("Enter");
  
  // Wait for results to update
  await page.waitForTimeout(3000);
  await expect(
    page.locator(
      `[data-cy="realtime-wallboards-item"]:has([data-cy="realtime-wallboards-item-title"])`,
    ),
  ).toHaveCount(0);
  //----------------------
  // Assert:
  //----------------------
  // Assert Wallboard is no longer visible
  await expect(
    page.locator(
      `[data-cy="realtime-wallboards-item"]:has([data-cy="realtime-wallboards-item-title"]:text("${wallboardName}"))`,
    ),
  ).not.toBeVisible();
  
});