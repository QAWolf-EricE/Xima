import { downloadFile, logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("my_reports_individual_report_options", async () => {
 // Step 1. Edit Report Tags
  // REQ01 Login as Supervisor
  // login
  const { page, browser, context } = await logInSupervisor({
    acceptdownloads: true,
    slowMo: 1000,
  });
  
  // REQ09 Navigate to my reports (CCaaS with UC tab)
  await expect(
    page.locator('app-home-title-translation:has-text("Reports")')
  ).toBeVisible();
  await expect(async () => {
    await page.waitForSelector(
      '[data-cy="reports-list-report-name"][role="cell"]',
      { timeout: 1000 }
    );
  }).toPass({ timeout: 1000 * 240 });
  
  // REQ32 Report: Edit tags // need to follow up with XIMA about how to add a tag to a report
  // await page.click('[data-cy="reports-list-report-more-menu-button"]');
  await page.click(
    '[data-cy="reports-list-report-more-menu-button"]:right-of(:text("Agent Chat Summary"))'
  );
  
  // REQ33 Report: Export report
  const file = await downloadFile(
    page,
    '[data-cy="reports-list-more-menu-export-button"]'
  );
  console.log(file);
  expect(file).toContain("ximasoft.chronicall.reports2.manager.ReportArchive");
  
  // REQ34 Report: rename report
  await page.waitForTimeout(10 * 1000);
  await page.click(
    '[data-cy="reports-list-report-more-menu-button"]:right-of(:text("Agent Chat Summary"))'
  );
  await page.click('[data-cy="reports-list-more-menu-rename-button"]');
  const edittedReport =
    "Agent Chat Summary " + Date.now().toString().slice(-4);
  await page.fill('[data-cy="app-prompt-input"]', edittedReport);
  await page.click('[data-cy="app-prompt-submit"]');
  
  // REQ35 Report: Edit report
  await page.waitForTimeout(4000);
  await page.click(
    '[data-cy="reports-list-report-more-menu-button"]:right-of(:text("Agent Chat Summary"))'
  );
  await page.click('[data-cy="reports-list-more-menu-edit-button"]');
  await expect(page.locator("text=Custom Reports")).toBeVisible();
  await expect(page.locator("text=Select Column Type")).toBeVisible();
  await expect(page.locator("text=Predefined")).toHaveCount(2);
  await expect(page.locator("text=Customizable")).toBeVisible();
  await page.click('[data-cy="sidenav-menu-REPORTS"]');
  await page.click('[data-cy="confirmation-dialog-okay-button"]');
  
  // REQ36 Report: schedule report
  await page.waitForTimeout(4000);
  await page.click(
    '[data-cy="reports-list-report-more-menu-button"]:right-of(:text("Agent Chat Summary"))'
  );
  await page.click('[data-cy="reports-list-more-menu-schedule-button"]');
  const schedule = "QA Schedule " + Date.now().toString().slice(-4);
  await page.fill('[data-cy="schedule-form-name-input"]', schedule);
  await page.locator(`[data-cy="schedule-form-email-input"]`).click();
  const { emailAddress: email, waitForMessage } = await getInbox({ new: true });
  await page.keyboard.type(email);
  await page.click('[data-cy="schedule-form-next-button"]');
  await expect(async () => {
    await expect(page.locator(`text=${edittedReport}`)).toHaveCount(2, {
      timeout: 1000,
    });
  }).toPass({ timeout: 1000 * 240 });
  await page.click('[data-cy="schedule-reports-selection-next-button"]');
  // Had to recreate report > different buttons based on configuration > commenting out for now
  await page.locator(`[data-cy="configure-report-preview-parameter-SKILLS"] [data-cy="xima-preview-input-edit-button"]`).click();
  await page.locator(`[data-cy="checkbox-tree-property-select-all"]`).click();
  await page.locator(`[data-cy="checkbox-tree-dialog-apply-button"]`).click();
  await page.waitForTimeout(1000);
  await page.locator(`[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]`).click();
  await page.locator('[data-cy="xima-list-select-select-all"]').click();
  await page.locator(`[data-cy="agents-roles-dialog-apply-button"]`).click();
  await page.click('[data-cy="schedule-reports-configuration-finish-button"]');
  await expect(page.locator(`text=${schedule} >>nth=0`)).toBeVisible();
  // await page.click(
  //   `[data-cy="schedule-list-remove-schedule-button"]:right-of(:text('${schedule}'))`
  // );
  // await page.click('[data-cy="confirmation-dialog-okay-button"]');
  // await expect(page.locator(`text=${schedule}`)).not.toBeVisible();
  // await page.click('[data-cy="schedule-list-close-button"]');
  await page.locator(`[data-cy="schedule-list-close-button"]`).click();
  // REQ37 Report: duplicate report
  await page.waitForTimeout(4000);
  await page.click(
    '[data-cy="reports-list-report-more-menu-button"]:right-of(:text("Agent Chat Summary"))'
  );
  await page.click('[data-cy="reports-list-more-menu-duplicate-button"]');
  await expect(async () => {
    await expect(page.locator(`text=${edittedReport} (Copy`)).toBeVisible({
      timeout: 1000,
    });
  }).toPass({ timeout: 1000 * 240 });
  
  // REQ38 Delete report
  await page.click(
    `[data-cy="reports-list-report-more-menu-button"]:right-of(:text("${edittedReport} (Copy"))`
  );
  await page.waitForTimeout(2000);
  await page.click('[data-cy="reports-list-more-menu-delete-button"]');
  await page.click('[data-cy="confirmation-dialog-okay-button"]');
  await expect(page.locator(`text=${edittedReport} (Copy`)).toBeHidden({
    timeout: 2 * 60 * 1000,
  });
 // Step 2. Export individual report
  // Description:
 // Step 3. Rename report
  // Description:
 // Step 4. Edit report
  // Description:
 // Step 5. Schedule individual report
  // Description:
 // Step 6. Duplicate report
  // Description:
 // Step 7. Delete individual report
  // Description:
});