import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("supervisor_view_more_options", async () => {
 // Step 1. Realtime display - Manage formulas
  // REQ01 Login as Supervisor
  // login
  const { page, browser, context } = await logInSupervisor({ slowMo: 1000 });
  
  // REQ121 Navigate to Supervisor View
  await page.waitForTimeout(3000);
  await page.hover('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]');
  await page.click(':text-is("Supervisor View")');
  
  // filter by skill
  await page.waitForTimeout(3000);
  await page.click('[data-cy="supervisor-view-filter-title"]');
  await page.locator(`.realtime-status-sidenav-content-group-select`).click();
  await page.locator(`[role="option"]:has-text("Skill")`).click();
  await page.click('[data-cy="supervisor-view-filter-apply-button"]');
  await page.waitForTimeout(3000);
  
  // See refresh dialog
  await expect(
    page.locator(`xima-dialog:has-text("Refresh Required")`),
  ).toBeVisible();
  
  // Click OK
  await page.getByRole(`button`, { name: `Ok` }).click();
  
  // REQ128 Supervisor view more options: Manage formulas
  // click 3 dots
  await page.click('[data-cy="settings-menu-button"]');
  
  // click manage formulas
  await page.click('[data-cy="settings-menu-manage-formulas"]');
  
  // assert manage formulas modal
  await expect(page.getByText("Manage Formula Templates")).toBeVisible();
  await expect(page.locator('[data-cy="xima-header-add-button"]')).toBeVisible();
  await expect(page.locator(':text-is("Finish")')).toBeVisible();
  
  // close the modal and assert closed
  await page.locator('[class="feather feather-x"]').click(); // close button
  await expect(page.getByText("Manage Formulas")).not.toBeVisible();
  
  // REQ129 Supervisor view more options:  Edit summary metrics
  // click 3 dots
  await page.click('[data-cy="settings-menu-button"]');
  
  // click Edit summary metrics
  await page.click('[data-cy="settings-menu-edit-summary-metrics"]');
  
  // assert Edit summary metrics modal
  await expect(page.getByText("Summary Metrics")).toBeVisible();
  await expect(page.locator(':text("Calls in Queue")').first()).toBeVisible();
  await expect(page.locator(':text("Max Queue Duration")').first()).toBeVisible();
  await expect(page.locator(':text("Avg Queue Duration")').first()).toBeVisible();
  await expect(
    page.locator(':text("Avg Speed of Answer")').first(),
  ).toBeVisible();
  await expect(page.locator(':text("Presented Calls")').first()).toBeVisible();
  await expect(page.locator(':text("Restore Default Metrics")')).toBeVisible();
  await expect(page.locator('[data-cy="add-agent-metric-button"]')).toBeVisible();
  await expect(
    page.locator('[data-cy="apply-agent-metrics-button"]'),
  ).toBeVisible();
  
  // close the modal and assert closed
  await page.locator('[class="feather feather-x"]').click(); // close button
  
  await expect(page.getByText("Summary Metrics")).not.toBeVisible();
  
  // REQ130 Supervisor view more options:  Edit metrics for all agents
  // click 3 dots
  await page.click('[data-cy="settings-menu-button"]');
  
  // click Edit metrics for all agents
  await page.click('[data-cy="settings-menu-edit-summary-metrics-all-agents"]');
  
  // assert Edit metrics for all agents modal
  await expect(page.getByText("Agent Metrics")).toBeVisible();
  await expect(
    page.locator(':text-is("Skill Login Count")').first(),
  ).toBeVisible();
  await expect(page.locator(':text-is("Answered Calls")').first()).toBeVisible();
  await expect(page.locator(':text("Restore Default Metrics")')).toBeVisible();
  await expect(page.locator('[data-cy="add-agent-metric-button"]')).toBeVisible();
  await expect(
    page.locator('[data-cy="apply-agent-metrics-button"]'),
  ).toBeVisible();
  
  // close the modal and assert closed
  await page.locator('[class="feather feather-x"]').click(); // close button
  await expect(page.getByText("Agent Metrics")).not.toBeVisible();
  
  // REQ131 Supervisor view more options:  View calls in queue
  // click 3 dots
  await page.click('[data-cy="settings-menu-button"]');
  
  // click View calls in queue
  await page.click('[data-cy="settings-menu-views-calls-queue"]');
  
  // assert View calls in queue toolbar
  await expect(page.getByText("Calls in Queue", { exact: true })).toBeVisible();
  await expect(page.locator("app-queued-calls")).toBeVisible();
  
  // close toolbar and assert
  await page.click(':text("close"):right-of(:text("Calls in Queue"))');
  await expect(
    page.locator("[class*='toolbar-title']:text('Calls in Queue')"),
  ).not.toBeVisible();
  
 // Step 2. Realtime display - Edit summary metrics
  // Description:
 // Step 3. Realtime display - Edit metrics for all agents
  // Description:
 // Step 4. Realtime display - View calls in queue
  // Description:
});