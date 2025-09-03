import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("add_and_edit_customer_report_parameters", async () => {
 // Step 1. Add param to a custom report
  // Arrange:
  // log in as supervisor
  // Act:
  // Click into a report
  // Click edit
  // Click more options button
  // Click manage params
  // Add a param
  // Assert:
  // Param is added
  // REQ Login as Supervisor
  const { page, browser, context } = await logInSupervisor({
    slowMo: 1500,
    timezoneId: "America/Denver",
  });
  
  // REQ Navigate to my reports
  await expect(
    page.locator('app-home-title-translation:has-text("Reports")'),
  ).toBeVisible();
  
  // search designated report
  await page.fill(
    '[placeholder="Type to Search"]',
    "Agent Call Summary Custom Params",
  );
  await page.keyboard.press("Enter");
  await expect(async () => {
    await page.waitForSelector('[data-cy="reports-list-report-name"]', {
      timeout: 2000,
    });
    await page.click('[data-cy="reports-list-report-name"]');
  }).toPass({ timeout: 120 * 1000 });
  
  // set date to today
  try {
    await page
      .locator(`[data-cy="report-execution-toolbar-configure-button"]`)
      .click();
  } catch (err) {
    console.log(err);
  }
  const today = dateFns.format(new Date(), "L/d/y");
  await page.fill(
    `[data-cy="'configure-report-preview-parameter-DATE_RANGE'"] .mat-start-date`,
    today,
  );
  await page.fill(
    `[data-cy="'configure-report-preview-parameter-DATE_RANGE'"] .mat-end-date`,
    today,
  );
  await page.waitForTimeout(3000);
  
  // Apply filter to show available agents
  await page
    .locator(
      '[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >> nth=0',
    )
    .click();
  if (
    !(await page
      .locator('[data-cy="xima-list-select-select-all"] [type="checkbox"]')
      .isChecked({ timeout: 10000 }))
  ) {
    await page
      .locator('[data-cy="xima-list-select-select-all"] [type="checkbox"]')
      .click({ force: true });
  }
  await page.waitForTimeout(2000);
  await page.locator('button.apply> span:text-is(" Apply ")').click();
  await page.waitForTimeout(2000);
  await page.locator('[data-cy="configure-report-apply-button"]').click();
  await page.waitForTimeout(5000);
  
  let summaryValue;
  
  try {
    // grab data item
    await expect(page.locator("text=WebRTC Agent 4(206)")).toBeVisible();
    summaryValue = await page.innerText(".summary-item-value >> nth=0");
  } catch {
    // configure to select all agents in rows
    await expect(async () => {
      await page.waitForSelector(
        '[data-cy="report-execution-toolbar-configure-button"]',
        { timeout: 2000 },
      );
      await page
        .locator('[data-cy="report-execution-toolbar-configure-button"]')
        .click();
    }).toPass({ timeout: 240 * 1000 });
    await page
      .locator(
        '[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >>nth=0',
      )
      .click();
    await page
      .locator(
        '[data-cy="xima-list-select-select-all"] :text("Select All Agents")',
      )
      .check();
    await page.locator('[data-cy="agents-roles-dialog-apply-button"]').click();
    await page.waitForTimeout(1000);
  
    await page.locator('[data-cy="configure-report-apply-button"]').click();
    await page.waitForTimeout(10 * 1000);
  
    // grab data item
    await expect(page.locator("text=WebRTC Agent 4(206)").first()).toBeVisible({
      timeout: 10_000,
    });
    summaryValue = await page.innerText(".summary-item-value >> nth=0");
  }
  
  // edit params
  await page.click('[data-cy="report-execution-toolbar-edit-button"]');
  
  // click vertical 3 dots
  await page.click('[data-cy="custom-report-header-more-menu"]');
  await page.click(':text("Manage Parameters")');
  
  // delete exisiting param if needed
  try {
    await expect(page.locator('[data-mat-icon-name="delete"]')).toBeVisible({
      timeout: 10 * 1000,
    });
    await page.click('[data-mat-icon-name="delete"]');
  } catch (err) {
    console.log(err);
  }
  
  // add param
  await page.click('[data-cy="xima-header-add-button"]');
  
  const customParamName = "Custom Param " + Date.now().toString().slice(-4);
  await page.fill('[type="text"]', customParamName);
  
  // select type
  await page.locator(`[formcontrolname="valueType"]`).click();
  await page.click(':text("Groups")');
  await page.click(':text("Save")');
  
  // assert param
  await expect(page.locator(`text=${customParamName}`)).toBeVisible();
  await page.click(':text("Finish")');
  
  // Exit edit mode
  await page.click(
    '[data-cy="custom-report-column-configuration-container-next-button"]',
  );
  await page.click(
    '[data-cy="custom-report-summary-values-container-next-button"]',
  );
  await page.click(
    '[data-cy="custom-reports-finalize-report-container-overwrite"] :text("Overwrite Original")',
  );
  await page.click(
    '[data-cy="custom-reports-finalize-report-container-save-button"]',
  );
  
  //configure report
  await page.waitForTimeout(20000);
  // await expect(page.locator("text=WebRTC Agent 4(206)")).toBeVisible();
  // await page.locator(`[data-cy="report-execution-toolbar-configure-button"]`).click();
  
  // assert new param visible
  await expect(page.locator(`text=${customParamName}`)).toBeVisible();
  
  // configure agents
  
  // refresh agents to 0
  await page.click(
    '[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]',
  );
  await page.click(
    '[data-cy="xima-list-select-select-all"] :text("Select All Agents")',
  );
  await page.click(
    '[data-cy="xima-list-select-select-all"] :text("Select All Agents")',
  );
  await page.click('[data-cy="agents-roles-dialog-apply-button"]');
  await page.waitForTimeout(1000);
  
  // choose starting date of 1 day ago
  const yesterday = dateFns.format(
    dateFns.add(new Date(), { days: -3 }),
    "L/d/y",
  );
  await page
    .locator(
      `[data-cy="'configure-report-preview-parameter-DATE_RANGE'"] .mat-start-date`,
    )
    .fill(yesterday);
  await page
    .locator(
      `[data-cy="'configure-report-preview-parameter-DATE_RANGE'"] .mat-end-date`,
    )
    .fill(yesterday);
  
  // configure agent 102
  await page.click(
    '[data-cy="configure-report-preview-parameter-PBX_USERS"] [data-cy="xima-preview-input-edit-button"]',
  );
  await page.click(
    '[data-cy="xima-list-select-option"] :text("WebRTC Agent 4(206)")',
  );
  await page.click('[data-cy="agents-roles-dialog-apply-button"]');
  await page.waitForTimeout(1000);
  
  // configure new param
  await page.click(
    '[data-cy="configure-report-preview-parameter-GROUPS"] [data-cy="xima-preview-input-edit-button"]',
  );
  await page.click('[data-cy="checkbox-tree-property-option"] :text("Skill 2")');
  await page.click('[data-cy="checkbox-tree-dialog-apply-button"]');
  
  // Configure report
  await page.click('[data-cy="configure-report-apply-button"]');
  
  // assert agent loaded
  try {
    await expect(page.locator("text=WebRTC Agent 4(206)")).toBeVisible({
      timeout: 60 * 1000,
    });
  } catch {
    await page.reload();
    await expect(page.locator("text=WebRTC Agent 4(206)").first()).toBeVisible({
      timeout: 60 * 1000,
    });
  }
  
  // grab total call value
  let postParamValue = await page.innerText(".summary-item-value >> nth=0");
  console.log("postParamValue", postParamValue);
  console.log("summaryValue", summaryValue);
  
  // assert total call number is not the same
  await page.waitForTimeout(10 * 1000);
  await expect(async () => {
    await page.reload();
    await page.waitForTimeout(5 * 1000);
    postParamValue = await page.innerText(".summary-item-value >> nth=0")
    expect(summaryValue).not.toBe(postParamValue);
  }).toPass({ timeout: 1000 * 240 });
  
  // delete param
  await page.click('[data-cy="report-execution-toolbar-edit-button"]');
  await page.click('[data-cy="custom-report-header-more-menu"]');
  await page.click(':text("Manage Parameters")');
  await page.click('[data-mat-icon-name="delete"]');
  await expect(page.locator(`text=${customParamName}`)).not.toBeVisible();
  await page.click(':text("Finish")');
  
  // exit edit mode
  await page.click(
    '[data-cy="custom-report-column-configuration-container-next-button"]',
  );
  await page.click(
    '[data-cy="custom-report-summary-values-container-next-button"]',
  );
  await page.click(
    '[data-cy="custom-reports-finalize-report-container-overwrite"] :text("Overwrite Original")',
  );
  await page.click(
    '[data-cy="custom-reports-finalize-report-container-save-button"]',
  );
  
 // Step 2. Configure report with new param added
  // Arrange:
  // have param added
  // Act:
  // configure report with same date range with new param added
  // Assert:
  // assert details
  
  
 // Step 3. Delete param
  // Arrange:
  
  // Act:
  // Click edit
  // Click more options
  // Click manage params
  // Click trash can icon next to param
  // Assert:
  // Param is no longer visible
  
});