import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("create_tag_assign_reports_remove_reports_remove_tag", async () => {
 // Step 1. Create Tag
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Consts
  const tagName = `Manage tags test`;
  
  // Log in
  const { page } = await logInSupervisor();
  
  // Wait for "My Reports" page to load
  await expect(
    page.locator('app-home-title-translation:has-text("Reports")'),
  ).toBeVisible();
  
  // Click options ( three vertical dots )
  await page.locator('[data-cy="manage-menu-open-button"]').click();
  
  // Click Manage Tags
  await page.locator('[data-cy="manage-menu-manage-tags"]').click();
  
  // Wait for side panel of tags to load
  await expect(
    page.locator(`app-tags-list-sidenav .body .list-item`).first(),
  ).toBeVisible();
  
  // Delete tag if present
  try {
    // Check if visible
    await expect(
      page.locator(
        `app-tags-list-sidenav .body .list-item:has(:text-is("${tagName}"))`,
      ),
    ).toBeVisible({
      timeout: 5000,
    });
  
    // Delete the "Manage tags test" tag
    await page
      .locator(
        `app-tags-list-sidenav .body .list-item:has(:text-is("${tagName}")) [data-mat-icon-name="delete"]`,
      )
      .click();
  
    // Assert modal
    await expect(
      page.locator(':text("Are you sure you want to delete this tag?")'),
    ).toBeVisible({ timeout: 30000 });
  
    // Click submit
    await page.locator(':text("Submit")').click();
  } catch (err) {
    console.log(err);
  }
  
  // Soft assert tag not present
  await expect(
    page.locator(
      `app-tags-list-sidenav .body .list-item:has(:text-is("${tagName}"))`,
    ),
  ).not.toBeVisible({
    timeout: 30000,
  });
  //--------------------------------
  // Act:
  //--------------------------------
  // Click "New Tag" button
  await page.locator(`app-tags-list-sidenav button:has-text("New Tag")`).click();
  
  // Fill in tag name
  await page
    .locator(`mat-label:text("Tag Name") ~ mat-form-field input`)
    .fill(tagName);
  await page.waitForTimeout(2000);
  
  // Save first two reports
  const report1 = await page
    .locator('[data-cy="reports-list-report-name"] >> nth=0')
    .innerText();
  const report2 = await page
    .locator('[data-cy="reports-list-report-name"] >> nth=1')
    .innerText();
  
  // Add first two reports to tag "Manage tags test"
  await page
    .locator(`mat-row:has([data-cy="reports-list-report-name"]:text-is("${report1}")) input`)
    .click();
  await page
    .locator(`mat-row:has([data-cy="reports-list-report-name"]:text-is("${report2}")) input`)
    .click();
  
  // Soft assert the two reports show up
  await expect(
    page.locator(
      `app-tags-form-sidenav p:text("Choose reports assigned to this tag") ~ div .report-tile`,
    ),
  ).toHaveCount(2);
  await expect(
    page.locator(
      `app-tags-form-sidenav p:text("Choose reports assigned to this tag") ~ div .report-tile:text-is("${report1}")`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(
      `app-tags-form-sidenav p:text("Choose reports assigned to this tag") ~ div .report-tile:text-is("${report2}")`,
    ),
  ).toBeVisible();
  
  // Click Apply
  await page.locator(`app-tags-form-sidenav button:has-text("Apply")`).click();
  
  // Wait for page to update
  await expect(
    page.locator(`app-tags-list-sidenav button:has-text("New Tag")`),
  ).toBeVisible();
  
  // Close side panel
  await page.locator(`app-tags-list-sidenav button:has-text("close")`).click();
  await expect(
    page.locator(`app-tags-list-sidenav button:has-text("New Tag")`),
  ).not.toBeVisible();
  
  // Filter reports by tag "Manage tags test"
  await page.locator('[data-cy="filter-tags"]').click();
  await page
    .locator(
      `mat-option:has(app-tags-translation:text-is("${tagName}")) mat-pseudo-checkbox`,
    )
    .click();
  
  // Soft assert filter is selected
  await expect(
    page.locator(
      `mat-option:has(app-tags-translation:text-is("${tagName}"))[aria-selected="true"]`,
    ),
  ).toBeVisible();
  
  // Press Escape to close tags dropdown
  await page.keyboard.press("Escape");
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert only two reports visible for the tag
  await expect(page.locator('[data-cy="reports-list-report-name"]')).toHaveCount(
    3,
    { timeout: 30000 },
  );
  await expect(
    page.locator(
      `[data-cy="reports-list-report-name"]:text-is("${report1 + " "}")`,
    ),
  ).toBeVisible({ timeout: 30000 });
  await expect(
    page.locator(`[data-cy="reports-list-report-name"]:has-text("${report2}")`),
  ).toBeVisible({ timeout: 30000 });
  
 // Step 2. Assign Reports to a Tag
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Clear filters
  await page.locator('[data-cy="filter-tags"]').click();
  await page
    .locator(
      `mat-option:has(app-tags-translation:text-is("${tagName}")) mat-pseudo-checkbox`,
    )
    .click();
  await expect(
    page.locator(
      `mat-option:has(app-tags-translation:text-is("${tagName}"))[aria-selected="false"]`,
    ),
  ).toBeVisible();
  
  // Press Escape to close tags dropdown
  await page.keyboard.press("Escape");
  
  // Click options ( three vertical dots )
  await page.locator('[data-cy="manage-menu-open-button"]').click();
  
  // Click Manage Tags
  await page.locator('[data-cy="manage-menu-manage-tags"]').click();
  
  // Wait for side panel of tags to load
  await expect(
    page.locator(`app-tags-list-sidenav .body .list-item`).first(),
  ).toBeVisible();
  
  // Click the tag
  await page
    .locator(`app-tags-list-sidenav .body .list-item span:text-is("${tagName}")`)
    .click();
  //--------------------------------
  // Act:
  //--------------------------------
  // Save fourth report
  const report4 = await page
    .locator('[data-cy="reports-list-report-name"] >> nth=3')
    .innerText();
  
  // Add the report to tag "Manage tags test"
  await page.waitForTimeout(2000)
  await page
    .locator(`mat-row:has([data-cy="reports-list-report-name"]:text-is("${report4}")) input`)
    .click();
  
  // Soft assert the the report is added to panel
  await expect(
    page.locator(
      `app-tags-form-sidenav p:text("Choose reports assigned to this tag") ~ div .report-tile`,
    ),
  ).toHaveCount(3);
  await expect(
    page.locator(
      `app-tags-form-sidenav p:text("Choose reports assigned to this tag") ~ div .report-tile:text-is("${report1}")`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(
      `app-tags-form-sidenav p:text("Choose reports assigned to this tag") ~ div .report-tile:text-is("${report2}")`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(
      `app-tags-form-sidenav p:text("Choose reports assigned to this tag") ~ div .report-tile:text-is("${report4}")`,
    ),
  ).toBeVisible();
  
  // Click Apply
  await page.locator(`app-tags-form-sidenav button:has-text("Apply")`).click();
  
  // Wait for page to update
  await expect(
    page.locator(`app-tags-list-sidenav button:has-text("New Tag")`),
  ).toBeVisible();
  
  // Close side panel
  await page.locator(`app-tags-list-sidenav button:has-text("close")`).click();
  await expect(
    page.locator(`app-tags-list-sidenav button:has-text("New Tag")`),
  ).not.toBeVisible();
  
  // Filter reports by tag "Manage tags test"
  await page.locator('[data-cy="filter-tags"]').click();
  await page
    .locator(
      `mat-option:has(app-tags-translation:text-is("${tagName}")) mat-pseudo-checkbox`,
    )
    .click();
  
  // Soft assert filter is selected
  await expect(
    page.locator(
      `mat-option:has(app-tags-translation:text-is("${tagName}"))[aria-selected="true"]`,
    ),
  ).toBeVisible();
  
  // Press Escape to close tags dropdown
  await page.keyboard.press("Escape");
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert only three reports visible for the tag
  await expect(page.locator('[data-cy="reports-list-report-name"]')).toHaveCount(
    3,
    { timeout: 30000 },
  );
  await expect(
    page.locator(
      `[data-cy="reports-list-report-name"]:text-is("${report1 + " "}")`,
    ),
  ).toBeVisible({ timeout: 30000 });
  await expect(
    page.locator(`[data-cy="reports-list-report-name"]:has-text("${report2}")`),
  ).toBeVisible({ timeout: 30000 });
  await expect(
    page.locator(`[data-cy="reports-list-report-name"]:has-text("${report4}")`),
  ).toBeVisible({ timeout: 30000 });
  
 // Step 3. Remove Assigned Reports from a Tag
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Click options ( three vertical dots )
  await page.locator('[data-cy="manage-menu-open-button"]').click();
  
  // Click Manage Tags
  await page.locator('[data-cy="manage-menu-manage-tags"]').click();
  
  // Click "Manage tags test" tag
  await page
    .locator(`app-tags-list-sidenav .body .list-item span:text-is("${tagName}")`)
    .click();
  //--------------------------------
  // Act:
  //--------------------------------
  // Remove 2 reports from the tag
  await page
    .locator(
      `app-tags-form-sidenav .list-item:has(.report-tile:text-is("${report1}")) button`,
    )
    .click();
  await page
    .locator(
      `app-tags-form-sidenav .list-item:has(.report-tile:text-is("${report4}")) button`,
    )
    .click();
  
  // Soft assert two reports have been removed
  await expect(
    page.locator(
      `app-tags-form-sidenav p:text("Choose reports assigned to this tag") ~ div .report-tile`,
    ),
  ).toHaveCount(1);
  
  // Click Apply
  await page.locator(`app-tags-form-sidenav button:has-text("Apply")`).click();
  
  // Wait for page to update
  await expect(
    page.locator(`app-tags-list-sidenav button:has-text("New Tag")`),
  ).toBeVisible();
  await expect(page.locator(`mat-row:has([data-cy="reports-list-report-name"]:text-is("${report1}"))`)).not.toBeVisible()
  await expect(page.locator(`mat-row:has([data-cy="reports-list-report-name"]:text-is("${report4}"))`)).not.toBeVisible()
  
  // Reload page
  await page.reload();
  
  // Click options ( three vertical dots )
  await page.waitForTimeout(2000)
  await page.locator('[data-cy="manage-menu-open-button"]').click();
  
  // Click Manage Tags
  await page.locator('[data-cy="manage-menu-manage-tags"]').click();
  
  // Click "Manage tags test" tag
  await page
    .locator(`app-tags-list-sidenav .body .list-item span:text-is("${tagName}")`)
    .click();
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert only one report is left in the tag
  await expect(
    page.locator(
      `app-tags-form-sidenav p:text("Choose reports assigned to this tag") ~ div .report-tile`,
    ),
  ).toHaveCount(1);
  await expect(
    page.locator(
      `app-tags-form-sidenav .list-item:has(.report-tile:text-is("${report2}"))`,
    ),
  ).toBeVisible();
  
 // Step 4. Delete Tag
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Close side panel
  await page.locator(`app-tags-form-sidenav button:has-text("close")`).click();
  await expect(
    page.locator(`app-tags-form-sidenav button:has-text("Apply")`),
  ).not.toBeVisible();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Click the Trash icon next to the tag
  await page
    .locator(
      `app-tags-list-sidenav .body .list-item:has(:text-is("${tagName}")) [data-mat-icon-name="delete"]`,
    )
    .click();
  
  // Assert modal
  await expect(
    page.locator(':text("Are you sure you want to delete this tag?")'),
  ).toBeVisible();
  await expect(
    page.locator(
      `xima-warn-list-dialog:has(mat-list-item:has-text("${report2}"))`,
    ),
  ).toBeVisible();
  
  // Click submit
  await page.locator('xima-warn-list-dialog button:has-text("Submit")').click();
  await expect(page.locator(`xima-warn-list-dialog`)).not.toBeVisible();
  
  // Wait for side panel of tags to load
  await expect(
    page.locator(`app-tags-list-sidenav .body .list-item`).first(),
  ).toBeVisible();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert tag has been deleted
  await expect(
    page.locator(
      `app-tags-list-sidenav .body .list-item:has(:text-is("${tagName}"))`,
    ),
  ).not.toBeVisible();
  
});